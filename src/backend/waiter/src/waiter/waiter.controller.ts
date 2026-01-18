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
import { GetPendingNotificationsRequestDto } from './dtos/request/get-pending-notifications-request.dto';
import { MarkNotificationViewedRequestDto } from './dtos/request/mark-notification-viewed-request.dto';

/**
 * WaiterController
 *
 * PURE NOTIFICATION LAYER - Best Practice Architecture
 *
 * Responsibilities:
 * - Receive order notifications from Order Service (alert creation)
 * - Provide notification queries for waiter dashboard
 * - Mark notifications as read (UI state only)
 *
 * What this controller DOES NOT do:
 * - Accept/Reject items (Waiter frontend calls Order Service directly)
 * - Business logic (handled by Order Service)
 * - Kitchen communication (handled by Order Service)
 *
 * Event Patterns (Fire-and-forget from other services):
 * - order.new_items: Receive notification when customers add items
 *
 * Message Patterns (Request-response for client apps):
 * - waiter.get_pending_notifications: Get list of unread/read notifications
 * - waiter.mark_read: Mark notification as read
 * - waiter.archive: Archive notification
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
	 * Purpose: Create notification alert for waiter
	 */
	@EventPattern('order.new_items')
	async handleNewOrderItems(
		@Payload() data: NewOrderItemsEventDto,
		@Ctx() context: RmqContext,
	) {
		console.log(`🔔 [RABBITMQ] start function`);

		const channel = context.getChannelRef();
		const message = context.getMessage();

		console.log(
			`🔔 [RABBITMQ] Received message from queue. Pattern: ${message.fields.routingKey || 'order.new_items'}`,
		);
		console.log(
			`🔔 [RABBITMQ] Message properties: ${JSON.stringify(message.properties.headers || {})}`,
		);
		console.log(`🔔 [RABBITMQ] Payload: ${JSON.stringify(data)}`);

		try {
			console.log(
				`[EVENT] Processing order.new_items for order ${data.orderId}, table ${data.tableId}`,
			);

			const result = await this.waiterService.handleNewOrderItems(data);

			console.log(
				`✅ [EVENT] Created notification ${result.id} with ${data.items.length} items`,
			);

			// ✅ NestJS auto-acks after successful handler completion (noAck: false)
		} catch (error) {
			this.logger.error(
				`❌ [EVENT] Failed to handle new order items: ${error.message}`,
				error.stack,
			);

			// Get retry count
			const xDeath = message.properties.headers['x-death'];
			const retryCount = xDeath ? xDeath[0].count : 0;
			const maxRetries = parseInt(process.env.LIMIT_REQUEUE || '10', 10);

			if (retryCount >= maxRetries) {
				this.logger.error(
					`[EVENT] Max retries (${maxRetries}) reached for order ${data.orderId}. Sending to DLQ.`,
				);
				channel.ack(message); // Acknowledge to move to DLQ
			} else {
				this.logger.warn(
					`[EVENT] Retry ${retryCount + 1}/${maxRetries} for order ${data.orderId}`,
				);
				channel.nack(message, false, false); // Reject and requeue
			}
		}
	}

	/**
	 * MESSAGE PATTERN: Get pending notifications
	 *
	 * Used by waiter dashboard to fetch notifications needing action
	 */
	@MessagePattern('waiter.get_pending_notifications')
	async getPendingNotifications(@Payload() data: GetPendingNotificationsRequestDto) {
		try {
			return await this.waiterService.getPendingNotifications(data);
		} catch (error) {
			this.logger.error(`Failed to get pending notifications: ${error.message}`);
			throw error;
		}
	}

	/**
	 * MESSAGE PATTERN: Mark notification as read
	 *
	 * Tracks when waiter first sees notification (for UI state)
	 */
	@MessagePattern('waiter.mark_read')
	async markNotificationRead(@Payload() data: MarkNotificationViewedRequestDto) {
		try {
			return await this.waiterService.markNotificationRead(data);
		} catch (error) {
			this.logger.error(`Failed to mark notification as read: ${error.message}`);
			throw error;
		}
	}

	/**
	 * MESSAGE PATTERN: Archive notification
	 *
	 * Used when waiter dismisses notification or order completed
	 */
	@MessagePattern('waiter.archive')
	async archiveNotification(
		@Payload() data: { notificationId: string; waiterApiKey: string },
	) {
		try {
			await this.waiterService.archiveNotification(
				data.notificationId,
				data.waiterApiKey,
			);
			return { success: true };
		} catch (error) {
			this.logger.error(`Failed to archive notification: ${error.message}`);
			throw error;
		}
	}

	/**
	 * DEBUGGING: Catch-all event handler to see what messages arrive
	 */
	@EventPattern('*')
	async handleAllEvents(@Payload() data: any, @Ctx() context: RmqContext) {
		const message = context.getMessage();
		const pattern =
			message.properties.headers?.pattern || message.fields.routingKey || 'unknown';

		this.logger.log(`🔍 [DEBUG] Received event with pattern: ${pattern}`);
		this.logger.log(`🔍 [DEBUG] Payload: ${JSON.stringify(data).substring(0, 200)}`);

		// Don't acknowledge - let specific handlers do that
	}
}
