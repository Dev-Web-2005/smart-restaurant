import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderNotification } from '../common/entities';
import {
	NotificationStatus,
	NotificationStatusString,
} from '../common/enums/notification-status.enum';
import { NewOrderItemsEventDto } from './dtos/request/new-order-items-event.dto';
import { AcceptOrderItemsRequestDto } from './dtos/request/accept-order-items-request.dto';
import { RejectOrderItemsRequestDto } from './dtos/request/reject-order-items-request.dto';
import { GetPendingNotificationsRequestDto } from './dtos/request/get-pending-notifications-request.dto';
import { MarkNotificationViewedRequestDto } from './dtos/request/mark-notification-viewed-request.dto';
import {
	OrderNotificationResponseDto,
	PaginatedNotificationsResponseDto,
	WaiterActionResponseDto,
} from './dtos/response/waiter-response.dto';
import ErrorCode from '@shared/exceptions/error-code';

/**
 * WaiterService
 *
 * Core business logic for waiter notification management
 *
 * Responsibilities:
 * 1. Receive order notifications from Order Service via RabbitMQ
 * 2. Store notifications in database for tracking
 * 3. Handle waiter actions (accept/reject items)
 * 4. Communicate back to Order Service for status updates
 * 5. Send accepted orders to Kitchen Service via RabbitMQ
 *
 * Business Flow:
 * Order Service -> Waiter Service (new items) -> Waiter Reviews
 *   -> Accept -> Order Service (update items status) -> Kitchen Service
 *   -> Reject -> Order Service (mark items rejected)
 */
@Injectable()
export class WaiterService {
	private readonly logger = new Logger(WaiterService.name);

	constructor(
		@InjectRepository(OrderNotification)
		private readonly notificationRepository: Repository<OrderNotification>,
		private readonly configService: ConfigService,
		@Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
		@Inject('KITCHEN_SERVICE') private readonly kitchenClient: ClientProxy,
	) {}

	/**
	 * Validate API key for security
	 */
	private validateApiKey(providedKey: string): void {
		const validKey = this.configService.get<string>('WAITER_API_KEY');
		if (providedKey !== validKey) {
			throw new RpcException({
				code: ErrorCode.UNAUTHORIZED.code,
				message: 'Invalid API key',
				status: ErrorCode.UNAUTHORIZED.httpStatus,
			});
		}
	}

	/**
	 * Handle incoming notification for new order items
	 * Called via RabbitMQ event from Order Service
	 *
	 * Business Rules:
	 * - Create notification record for tracking
	 * - Set expiry time based on SLA (e.g., 5 minutes)
	 * - Extract item IDs for granular tracking
	 * - Priority handling for urgent orders
	 *
	 * @param dto - Event data from Order Service
	 * @returns Created notification
	 */
	async handleNewOrderItems(
		dto: NewOrderItemsEventDto,
	): Promise<OrderNotificationResponseDto> {
		this.validateApiKey(dto.waiterApiKey);

		this.logger.log(`Received new order items notification for order ${dto.orderId}`);

		// Calculate expiry time (default 15 minutes from now)
		const expiresAt = new Date();
		expiresAt.setMinutes(expiresAt.getMinutes() + 15);

		// Extract item IDs
		const itemIds = dto.items.map((item) => item.id);

		// Create notification record
		const notification = this.notificationRepository.create({
			orderId: dto.orderId,
			tableId: dto.tableId,
			tenantId: dto.tenantId,
			status: NotificationStatus.PENDING,
			notificationType: 'NEW_ITEMS',
			priority: dto.priority || 0,
			itemIds: itemIds,
			metadata: {
				orderType: dto.orderType,
				customerName: dto.customerName,
				itemCount: dto.items.length,
				items: dto.items, // Store full item data for waiter reference
			},
			notes: dto.notes,
			expiresAt: expiresAt,
		});

		const saved = await this.notificationRepository.save(notification);

		this.logger.log(
			`Created notification ${saved.id} for order ${dto.orderId} with ${itemIds.length} items`,
		);

		return this.mapToResponseDto(saved);
	}

	/**
	 * Get pending notifications for waiter dashboard
	 *
	 * Business Rules:
	 * - Show only PENDING and VIEWED notifications
	 * - Order by priority DESC, createdAt ASC (oldest first)
	 * - Support filtering by table, waiter
	 * - Pagination for performance
	 */
	async getPendingNotifications(
		dto: GetPendingNotificationsRequestDto,
	): Promise<PaginatedNotificationsResponseDto> {
		this.validateApiKey(dto.waiterApiKey);

		const page = dto.page || 1;
		const limit = dto.limit || 20;
		const skip = (page - 1) * limit;

		const queryBuilder = this.notificationRepository
			.createQueryBuilder('notification')
			.where('notification.tenantId = :tenantId', { tenantId: dto.tenantId })
			.andWhere('notification.status IN (:...statuses)', {
				statuses: [NotificationStatus.PENDING, NotificationStatus.VIEWED],
			});

		if (dto.waiterId) {
			queryBuilder.andWhere('notification.waiterId = :waiterId', {
				waiterId: dto.waiterId,
			});
		}

		if (dto.tableId) {
			queryBuilder.andWhere('notification.tableId = :tableId', { tableId: dto.tableId });
		}

		// Order by priority DESC (urgent first), then by creation time ASC (oldest first)
		queryBuilder
			.orderBy('notification.priority', 'DESC')
			.addOrderBy('notification.createdAt', 'ASC');

		const [notifications, total] = await queryBuilder
			.skip(skip)
			.take(limit)
			.getManyAndCount();

		return {
			notifications: notifications.map((n) => this.mapToResponseDto(n)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Mark notification as viewed by waiter
	 *
	 * Business Rules:
	 * - Can only mark PENDING notifications as VIEWED
	 * - Track timestamp for SLA metrics
	 * - Assign waiter to notification
	 */
	async markNotificationViewed(
		dto: MarkNotificationViewedRequestDto,
	): Promise<OrderNotificationResponseDto> {
		this.validateApiKey(dto.waiterApiKey);

		const notification = await this.notificationRepository.findOne({
			where: { id: dto.notificationId },
		});

		if (!notification) {
			throw new RpcException({
				code: ErrorCode.NOTIFICATION_NOT_FOUND.code,
				message: 'Notification not found',
				status: ErrorCode.NOTIFICATION_NOT_FOUND.httpStatus,
			});
		}

		if (notification.status !== NotificationStatus.PENDING) {
			throw new RpcException({
				code: ErrorCode.INVALID_STATUS_TRANSITION.code,
				message: 'Can only mark PENDING notifications as viewed',
				status: ErrorCode.INVALID_STATUS_TRANSITION.httpStatus,
			});
		}

		notification.status = NotificationStatus.VIEWED;
		notification.waiterId = dto.waiterId;
		notification.viewedAt = new Date();

		const updated = await this.notificationRepository.save(notification);

		this.logger.log(
			`Notification ${notification.id} marked as viewed by waiter ${dto.waiterId}`,
		);

		return this.mapToResponseDto(updated);
	}

	/**
	 * Accept order items - Waiter approves items to send to kitchen
	 *
	 * Business Flow:
	 * 1. Validate notification exists and is actionable
	 * 2. Update notification status to ACCEPTED
	 * 3. Send event to Order Service to update item status to ACCEPTED
	 * 4. Send event to Kitchen Service to start preparation
	 *
	 * Business Rules:
	 * - Can only accept PENDING or VIEWED notifications
	 * - Must accept all items in notification (partial accept not supported in v1)
	 * - Track waiter and timestamp for accountability
	 */
	async acceptOrderItems(
		dto: AcceptOrderItemsRequestDto,
	): Promise<WaiterActionResponseDto> {
		this.validateApiKey(dto.waiterApiKey);

		const notification = await this.notificationRepository.findOne({
			where: { id: dto.notificationId },
		});

		if (!notification) {
			throw new RpcException({
				code: ErrorCode.NOTIFICATION_NOT_FOUND.code,
				message: 'Notification not found',
				status: ErrorCode.NOTIFICATION_NOT_FOUND.httpStatus,
			});
		}

		if (
			notification.status !== NotificationStatus.PENDING &&
			notification.status !== NotificationStatus.VIEWED
		) {
			throw new RpcException({
				code: ErrorCode.INVALID_STATUS_TRANSITION.code,
				message: 'Can only accept PENDING or VIEWED notifications',
				status: ErrorCode.INVALID_STATUS_TRANSITION.httpStatus,
			});
		}

		// Validate item IDs match notification
		const validItemIds = dto.itemIds.every((id) => notification.itemIds.includes(id));
		if (!validItemIds) {
			throw new RpcException({
				code: ErrorCode.VALIDATION_FAILED.code,
				message: 'Some item IDs do not belong to this notification',
				status: ErrorCode.VALIDATION_FAILED.httpStatus,
			});
		}

		// Update notification
		notification.status = NotificationStatus.ACCEPTED;
		notification.waiterId = dto.waiterId;
		notification.respondedAt = new Date();

		await this.notificationRepository.save(notification);

		this.logger.log(
			`Waiter ${dto.waiterId} accepted ${dto.itemIds.length} items from order ${dto.orderId}`,
		);

		// Send event to Order Service to update item status
		this.orderClient.emit('order.items_accepted_by_waiter', {
			orderId: dto.orderId,
			itemIds: dto.itemIds,
			waiterId: dto.waiterId,
			acceptedAt: new Date(),
		});

		// Send event to Kitchen Service to start preparation
		this.kitchenClient.emit('kitchen.new_items', {
			orderId: dto.orderId,
			tableId: notification.tableId,
			tenantId: notification.tenantId,
			itemIds: dto.itemIds,
			items: notification.metadata.items, // Full item details
			priority: notification.priority,
			customerName: notification.metadata.customerName,
			notes: notification.notes,
			kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
		});

		this.logger.log(`Sent accepted items to Kitchen Service for order ${dto.orderId}`);

		return {
			success: true,
			message: 'Order items accepted and sent to kitchen',
			notificationId: notification.id,
			orderId: dto.orderId,
			itemIds: dto.itemIds,
			action: 'ACCEPTED',
			timestamp: new Date(),
		};
	}

	/**
	 * Reject order items - Waiter declines items (e.g., ingredient unavailable)
	 *
	 * Business Flow:
	 * 1. Validate notification exists and is actionable
	 * 2. Require rejection reason
	 * 3. Update notification status to REJECTED
	 * 4. Send event to Order Service to mark items as REJECTED
	 *
	 * Business Rules:
	 * - Can only reject PENDING or VIEWED notifications
	 * - Rejection reason is mandatory (min 5 characters)
	 * - Customer should be notified via Order Service
	 */
	async rejectOrderItems(
		dto: RejectOrderItemsRequestDto,
	): Promise<WaiterActionResponseDto> {
		this.validateApiKey(dto.waiterApiKey);

		const notification = await this.notificationRepository.findOne({
			where: { id: dto.notificationId },
		});

		if (!notification) {
			throw new RpcException({
				code: ErrorCode.NOTIFICATION_NOT_FOUND.code,
				message: 'Notification not found',
				status: ErrorCode.NOTIFICATION_NOT_FOUND.httpStatus,
			});
		}

		if (
			notification.status !== NotificationStatus.PENDING &&
			notification.status !== NotificationStatus.VIEWED
		) {
			throw new RpcException({
				code: ErrorCode.INVALID_STATUS_TRANSITION.code,
				message: 'Can only reject PENDING or VIEWED notifications',
				status: ErrorCode.INVALID_STATUS_TRANSITION.httpStatus,
			});
		}

		// Validate item IDs match notification
		const validItemIds = dto.itemIds.every((id) => notification.itemIds.includes(id));
		if (!validItemIds) {
			throw new RpcException({
				code: ErrorCode.VALIDATION_FAILED.code,
				message: 'Some item IDs do not belong to this notification',
				status: ErrorCode.VALIDATION_FAILED.httpStatus,
			});
		}

		// Update notification
		notification.status = NotificationStatus.REJECTED;
		notification.waiterId = dto.waiterId;
		notification.rejectionReason = dto.rejectionReason;
		notification.respondedAt = new Date();

		await this.notificationRepository.save(notification);

		this.logger.log(
			`Waiter ${dto.waiterId} rejected ${dto.itemIds.length} items from order ${dto.orderId}: ${dto.rejectionReason}`,
		);

		// Send event to Order Service to update item status to REJECTED
		this.orderClient.emit('order.items_rejected_by_waiter', {
			orderId: dto.orderId,
			itemIds: dto.itemIds,
			waiterId: dto.waiterId,
			rejectionReason: dto.rejectionReason,
			rejectedAt: new Date(),
		});

		this.logger.log(`Notified Order Service of rejection for order ${dto.orderId}`);

		return {
			success: true,
			message: 'Order items rejected',
			notificationId: notification.id,
			orderId: dto.orderId,
			itemIds: dto.itemIds,
			action: 'REJECTED',
			timestamp: new Date(),
		};
	}

	/**
	 * Helper: Map entity to response DTO
	 */
	private mapToResponseDto(
		notification: OrderNotification,
	): OrderNotificationResponseDto {
		return {
			id: notification.id,
			orderId: notification.orderId,
			tableId: notification.tableId,
			tenantId: notification.tenantId,
			waiterId: notification.waiterId,
			status: NotificationStatusString[notification.status],
			notificationType: notification.notificationType,
			priority: notification.priority,
			itemIds: notification.itemIds,
			metadata: notification.metadata,
			notes: notification.notes,
			rejectionReason: notification.rejectionReason,
			viewedAt: notification.viewedAt,
			respondedAt: notification.respondedAt,
			expiresAt: notification.expiresAt,
			createdAt: notification.createdAt,
			updatedAt: notification.updatedAt,
		};
	}
}
