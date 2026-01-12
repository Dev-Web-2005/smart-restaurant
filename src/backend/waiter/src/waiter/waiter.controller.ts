import { Controller, Logger } from '@nestjs/common';
import {
	EventPattern,
	MessagePattern,
	Payload,
	Ctx,
	RmqContext,
} from '@nestjs/microservices';
import { WaiterService } from './waiter.service';
import { NewOrderItemsEventDto } from './dtos/request/new-order-items-event.dto';
import { AcceptOrderItemsRequestDto } from './dtos/request/accept-order-items-request.dto';
import { RejectOrderItemsRequestDto } from './dtos/request/reject-order-items-request.dto';
import { GetPendingNotificationsRequestDto } from './dtos/request/get-pending-notifications-request.dto';
import { MarkNotificationViewedRequestDto } from './dtos/request/mark-notification-viewed-request.dto';

/**
 * WaiterController
 *
 * Handles RabbitMQ events and TCP messages for waiter operations
 *
 * Event Patterns (Fire-and-forget from other services):
 * - order.new_items: Receive notification when customers add items
 *
 * Message Patterns (Request-response for client apps):
 * - waiter.get_pending_notifications: Get list of pending orders
 * - waiter.mark_viewed: Mark notification as viewed
 * - waiter.accept_items: Accept order items and send to kitchen
 * - waiter.reject_items: Reject order items with reason
 */
@Controller()
export class WaiterController {
	private readonly logger = new Logger(WaiterController.name);

	constructor(private readonly waiterService: WaiterService) {}

	/**
	 * EVENT: Receive new order items from Order Service
	 *
	 * Triggered when:
	 * - Customer places initial order
	 * - Customer adds more items to existing order
	 *
	 * Flow: Order Service -> RabbitMQ -> Waiter Service (this handler)
	 */
	@EventPattern('order.new_items')
	async handleNewOrderItems(
		@Payload() data: NewOrderItemsEventDto,
		@Ctx() context: RmqContext,
	) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[EVENT] Received order.new_items for order ${data.orderId}, table ${data.tableId}`,
			);

			const result = await this.waiterService.handleNewOrderItems(data);

			this.logger.log(
				`[EVENT] Created notification ${result.id} with ${data.items.length} items`,
			);

			// Acknowledge message
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[EVENT] Failed to handle new order items: ${error.message}`,
				error.stack,
			);

			// Get retry count
			const xDeath = message.properties.headers['x-death'];
			const retryCount = xDeath ? xDeath[0].count : 0;
			const maxRetries = parseInt(process.env.LIMIT_REQUEUE) || 10;

			if (retryCount < maxRetries) {
				this.logger.warn(
					`[EVENT] Rejecting message for retry (attempt ${retryCount + 1}/${maxRetries})`,
				);
				channel.nack(message, false, false); // Reject to DLX
			} else {
				this.logger.error(`[EVENT] Max retries reached. Sending to DLQ.`);
				channel.nack(message, false, false); // Send to DLQ
			}
		}
	}

	/**
	 * MESSAGE PATTERN: Get pending notifications
	 *
	 * Used by waiter dashboard to fetch orders needing action
	 */
	@MessagePattern('waiter.get_pending_notifications')
	async getPendingNotifications(@Payload() data: GetPendingNotificationsRequestDto) {
		try {
			this.logger.log(`[RPC] Get pending notifications for tenant ${data.tenantId}`);
			return await this.waiterService.getPendingNotifications(data);
		} catch (error) {
			this.logger.error(`[RPC] Failed to get pending notifications: ${error.message}`);
			throw error;
		}
	}

	/**
	 * MESSAGE PATTERN: Mark notification as viewed
	 *
	 * Tracks when waiter first sees notification (for SLA metrics)
	 */
	@MessagePattern('waiter.mark_viewed')
	async markNotificationViewed(@Payload() data: MarkNotificationViewedRequestDto) {
		try {
			this.logger.log(`[RPC] Marking notification ${data.notificationId} as viewed`);
			return await this.waiterService.markNotificationViewed(data);
		} catch (error) {
			this.logger.error(`[RPC] Failed to mark notification viewed: ${error.message}`);
			throw error;
		}
	}

	/**
	 * MESSAGE PATTERN: Accept order items
	 *
	 * Waiter approves items and sends to kitchen
	 */
	@MessagePattern('waiter.accept_items')
	async acceptOrderItems(@Payload() data: AcceptOrderItemsRequestDto) {
		try {
			this.logger.log(
				`[RPC] Waiter ${data.waiterId} accepting ${data.itemIds.length} items from order ${data.orderId}`,
			);
			return await this.waiterService.acceptOrderItems(data);
		} catch (error) {
			this.logger.error(`[RPC] Failed to accept order items: ${error.message}`);
			throw error;
		}
	}

	/**
	 * MESSAGE PATTERN: Reject order items
	 *
	 * Waiter declines items with reason
	 */
	@MessagePattern('waiter.reject_items')
	async rejectOrderItems(@Payload() data: RejectOrderItemsRequestDto) {
		try {
			this.logger.log(
				`[RPC] Waiter ${data.waiterId} rejecting ${data.itemIds.length} items from order ${data.orderId}`,
			);
			return await this.waiterService.rejectOrderItems(data);
		} catch (error) {
			this.logger.error(`[RPC] Failed to reject order items: ${error.message}`);
			throw error;
		}
	}
}
