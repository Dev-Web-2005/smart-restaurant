import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { OrderNotification } from '../common/entities';
import {
	NotificationStatus,
	NotificationStatusString,
} from '../common/enums/notification-status.enum';
import { NewOrderItemsEventDto } from './dtos/request/new-order-items-event.dto';
import { GetPendingNotificationsRequestDto } from './dtos/request/get-pending-notifications-request.dto';
import { MarkNotificationViewedRequestDto } from './dtos/request/mark-notification-viewed-request.dto';
import {
	OrderNotificationResponseDto,
	PaginatedNotificationsResponseDto,
} from './dtos/response/waiter-response.dto';
import ErrorCode from '@shared/exceptions/error-code';

/**
 * WaiterService
 *
 * PURE ALERT LAYER - Best Practice Architecture
 *
 * Responsibilities (NOTIFICATION ONLY):
 * 1. Receive order notifications from Order Service via RabbitMQ
 * 2. Store notifications in database for display
 * 3. Mark notifications as read when waiter views them
 * 4. Archive notifications when dismissed or order completed
 *
 * What this service DOES NOT do:
 * - Accept/Reject items (handled by Order Service directly)
 * - Track business logic state (handled by OrderItem entity)
 * - Communicate with Kitchen Service (Order Service handles that)
 *
 * Architecture Pattern:
 * - Notification = "Doorbell" that rings when customer orders
 * - Waiter reads notification → marks as READ
 * - Waiter takes action → calls Order Service RPC directly
 * - Order Service handles all business logic and kitchen communication
 *
 * This follows Toast POS, Square Restaurant, Uber Eats Merchant pattern
 */
@Injectable()
export class WaiterService {
	private readonly logger = new Logger(WaiterService.name);

	constructor(
		@InjectRepository(OrderNotification)
		private readonly notificationRepository: Repository<OrderNotification>,
		private readonly configService: ConfigService,
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
	 * PURE ALERT CREATION:
	 * - Create notification record for display
	 * - Extract item IDs for UI reference only
	 * - Set priority for sorting
	 * - NO business logic - just store the alert
	 *
	 * @param dto - Event data from Order Service
	 * @returns Created notification
	 */
	async handleNewOrderItems(
		dto: NewOrderItemsEventDto,
	): Promise<OrderNotificationResponseDto> {
		this.validateApiKey(dto.waiterApiKey);

		this.logger.log(
			`Creating notification for order ${dto.orderId}, table ${dto.tableId} with ${dto.items.length} items`,
		);

		// Extract item IDs for display reference
		const itemIds = dto.items.map((item) => item.id);

		// Build display message
		const itemNames = dto.items.map((item) => item.name).join(', ');
		const message = `New order from ${dto.customerName || 'Guest'}: ${itemNames}`;

		// Create notification (pure alert)
		const notification = this.notificationRepository.create({
			orderId: dto.orderId,
			tableId: dto.tableId,
			tenantId: dto.tenantId,
			status: NotificationStatus.UNREAD,
			notificationType: 'NEW_ITEMS',
			priority: dto.priority || 0,
			itemIds,
			message,
			metadata: {
				customerName: dto.customerName,
				orderType: dto.orderType,
				itemCount: dto.items.length,
				items: dto.items, // For display only
			},
		});

		const saved = await this.notificationRepository.save(notification);

		this.logger.log(`Created notification ${saved.id} with ${itemIds.length} items`);

		return this.mapToResponseDto(saved);
	}

	/**
	 * Get pending notifications for waiter dashboard
	 *
	 * Business Rules:
	 * - Show UNREAD and READ notifications (exclude ARCHIVED)
	 * - Order by priority DESC, createdAt ASC (oldest first)
	 * - Support filtering by table
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
				statuses: [NotificationStatus.UNREAD, NotificationStatus.READ],
			});

		if (dto.tableId) {
			queryBuilder.andWhere('notification.tableId = :tableId', { tableId: dto.tableId });
		}

		queryBuilder
			.orderBy('notification.priority', 'DESC')
			.addOrderBy('notification.createdAt', 'ASC')
			.skip(skip)
			.take(limit);

		const [notifications, total] = await queryBuilder.getManyAndCount();

		this.logger.log(
			`Retrieved ${notifications.length} pending notifications for tenant ${dto.tenantId}`,
		);

		return {
			notifications: notifications.map((n) => this.mapToResponseDto(n)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Mark notification as read by waiter
	 *
	 * PURE NOTIFICATION UPDATE:
	 * - Can only mark UNREAD notifications as READ
	 * - Track timestamp for display
	 * - NO business logic - just UI state
	 */
	async markNotificationRead(
		dto: MarkNotificationViewedRequestDto,
	): Promise<OrderNotificationResponseDto> {
		this.validateApiKey(dto.waiterApiKey);

		const notification = await this.notificationRepository.findOne({
			where: { id: dto.notificationId },
		});

		if (!notification) {
			throw new RpcException({
				code: ErrorCode.NOTIFICATION_NOT_FOUND.code,
				message: `Notification ${dto.notificationId} not found`,
				status: ErrorCode.NOTIFICATION_NOT_FOUND.httpStatus,
			});
		}

		// Can only mark UNREAD as READ
		if (notification.status !== NotificationStatus.UNREAD) {
			this.logger.warn(
				`Notification ${dto.notificationId} already read or archived (status: ${NotificationStatusString[notification.status]})`,
			);
			return this.mapToResponseDto(notification);
		}

		notification.status = NotificationStatus.READ;
		notification.readAt = new Date();

		const updated = await this.notificationRepository.save(notification);

		this.logger.log(
			`Marked notification ${dto.notificationId} as READ by waiter ${dto.waiterId}`,
		);

		return this.mapToResponseDto(updated);
	}

	/**
	 * Archive notification
	 *
	 * Used when:
	 * - Waiter dismisses notification
	 * - Order completed
	 * - Notification no longer relevant
	 */
	async archiveNotification(notificationId: string, waiterApiKey: string): Promise<void> {
		this.validateApiKey(waiterApiKey);

		const notification = await this.notificationRepository.findOne({
			where: { id: notificationId },
		});

		if (!notification) {
			throw new RpcException({
				code: ErrorCode.NOTIFICATION_NOT_FOUND.code,
				message: `Notification ${notificationId} not found`,
				status: ErrorCode.NOTIFICATION_NOT_FOUND.httpStatus,
			});
		}

		notification.status = NotificationStatus.ARCHIVED;
		await this.notificationRepository.save(notification);

		this.logger.log(`Archived notification ${notificationId}`);
	}

	/**
	 * Map entity to response DTO
	 */
	private mapToResponseDto(
		notification: OrderNotification,
	): OrderNotificationResponseDto {
		return {
			id: notification.id,
			orderId: notification.orderId,
			tableId: notification.tableId,
			tenantId: notification.tenantId,
			status: NotificationStatusString[notification.status],
			notificationType: notification.notificationType,
			priority: notification.priority,
			itemIds: notification.itemIds || [],
			metadata: notification.metadata || {},
			message: notification.message,
			readAt: notification.readAt,
			createdAt: notification.createdAt,
			updatedAt: notification.updatedAt,
		};
	}
}
