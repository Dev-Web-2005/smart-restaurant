import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EventEmitterService } from '../services/event-emitter.service';

/**
 * WebSocket Event Controller
 *
 * Listens to RabbitMQ events from Order Service and broadcasts them via WebSocket
 * Implements Option 1: Reuse existing `order.new_items` event from Order → Waiter
 *
 * Architecture:
 * Order Service → RabbitMQ `order.new_items` → [Waiter Service + API Gateway]
 * API Gateway receives event → EventEmitterService → WebSocket clients
 *
 * Benefits:
 * - Reuses existing RabbitMQ infrastructure
 * - Minimal code changes
 * - Same event payload for Waiter and WebSocket
 */
@Controller()
export class WebsocketEventController {
	private readonly logger = new Logger(WebsocketEventController.name);

	constructor(private readonly eventEmitterService: EventEmitterService) {}

	/**
	 * EVENT: Receive new order items from Order Service
	 *
	 * This is the SAME event that Waiter Service receives
	 * We subscribe to it to broadcast real-time updates to WebSocket clients
	 *
	 * Flow:
	 * 1. Order Service emits `order.new_items` via RabbitMQ
	 * 2. Both Waiter Service AND API Gateway receive the event
	 * 3. Waiter Service creates notification (alert layer)
	 * 4. API Gateway broadcasts to WebSocket clients (real-time layer)
	 *
	 * Payload structure (from Order Service):
	 * {
	 *   waiterApiKey: string,
	 *   orderId: string,
	 *   tableId: string,
	 *   tenantId: string,
	 *   items: OrderItem[], // Full OrderItem objects from database
	 *   orderType?: string,
	 *   customerName?: string,
	 *   notes?: string,
	 *   priority?: number
	 * }
	 */
	@EventPattern('order.new_items')
	async handleNewOrderItems(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received order.new_items for order ${data.orderId}, table ${data.tableId}`,
			);
			this.logger.log(`[RabbitMQ] Event data:`, JSON.stringify(data, null, 2));

			// Broadcast to WebSocket clients in waiter room
			// Use EventEmitterService to emit to Socket.IO server
			this.eventEmitterService.broadcastOrderItemsNew({
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items, // ✅ Full OrderItem objects from Order Service
				orderType: data.orderType,
				customerName: data.customerName,
				notes: data.notes,
			});

			this.logger.log(
				`[WebSocket] Broadcasted order.items.new to tenant:${data.tenantId}:waiters room`,
			);

			// Acknowledge message
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.new_items: ${error.message}`,
				error.stack,
			);

			// Reject and requeue on error (with retry limit handled by RabbitMQ DLX)
			channel.nack(message, false, true);
		}
	}

	/**
	 * Future: Listen to other order events
	 * - order.items.accepted
	 * - order.items.preparing
	 * - order.items.ready
	 * - order.items.served
	 * etc.
	 */
}
