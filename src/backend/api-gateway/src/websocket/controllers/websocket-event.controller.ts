import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EventEmitterService } from '../services/event-emitter.service';

/**
 * WebSocket Event Controller
 *
 * Listens to RabbitMQ events from Order Service and broadcasts them via WebSocket
 * Implements Publish-Subscribe Pattern via Exchange (NO competing consumer issue)
 *
 * Architecture (FIXED ✅):
 * Order Service → RabbitMQ Exchange (order_events_exchange) → Fanout to:
 *   - Queue 1 (local_waiter_queue) → Waiter Service (100% messages)
 *   - Queue 2 (local_api_gateway_queue) → API Gateway (100% messages)
 *
 * API Gateway receives event → EventEmitterService → WebSocket clients
 *
 * Benefits:
 * - Each service has dedicated queue (no competing consumers)
 * - All services receive ALL events (fanout pattern)
 * - Shared exchange for event distribution
 * - Independent scaling and failure isolation
 */
@Controller()
export class WebsocketEventController {
	private readonly logger = new Logger(WebsocketEventController.name);

	constructor(private readonly eventEmitterService: EventEmitterService) {}

	/**
	 * EVENT: Receive new order items from Order Service
	 *
	 * Pub/Sub Pattern: Order Service emits to Exchange → All subscribers receive
	 * This ensures BOTH Waiter Service AND API Gateway receive the SAME event
	 *
	 * Flow:
	 * 1. Order Service emits `order.new_items` to Exchange
	 * 2. Exchange broadcasts to:
	 *    - local_waiter_queue → Waiter Service creates notification (100% events)
	 *    - local_api_gateway_queue → API Gateway broadcasts WebSocket (100% events)
	 * 3. NO competing consumers (each service has dedicated queue)
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

			// ✅ NestJS auto-acks on success, auto-nacks on error (noAck: false)
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.new_items: ${error.message}`,
				error.stack,
			);
			// Auto-nack with requeue on error
			throw error;
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

	/**
	 * EVENT: Order items accepted by waiter
	 */
	@EventPattern('order.items.accepted')
	async handleItemsAccepted(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received order.items.accepted for order ${data.orderId}`,
			);

			this.eventEmitterService.broadcastOrderItemsAccepted({
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				updatedBy: data.updatedBy,
			});

			// ✅ NestJS auto-acks on success
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.accepted: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Order items preparing in kitchen
	 */
	@EventPattern('order.items.preparing')
	async handleItemsPreparing(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received order.items.preparing for order ${data.orderId}`,
			);

			this.eventEmitterService.broadcastOrderItemsPreparing({
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				updatedBy: data.updatedBy,
			});

			// ✅ NestJS auto-acks on success
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.preparing: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Order items ready from kitchen
	 */
	@EventPattern('order.items.ready')
	async handleItemsReady(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(`[RabbitMQ] Received order.items.ready for order ${data.orderId}`);

			this.eventEmitterService.broadcastOrderItemsReady({
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				updatedBy: data.updatedBy,
			});

			// ✅ NestJS auto-acks on success
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.ready: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Order items served to customer
	 */
	@EventPattern('order.items.served')
	async handleItemsServed(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(`[RabbitMQ] Received order.items.served for order ${data.orderId}`);

			this.eventEmitterService.broadcastOrderItemsServed({
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				updatedBy: data.updatedBy,
			});

			// ✅ NestJS auto-acks on success
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.served: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Order items rejected
	 */
	@EventPattern('order.items.rejected')
	async handleItemsRejected(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received order.items.rejected for order ${data.orderId}`,
			);

			this.eventEmitterService.broadcastOrderItemsRejected({
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				rejectionReason: data.rejectionReason,
				updatedBy: data.updatedBy,
			});

			// ✅ NestJS auto-acks on success
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.rejected: ${error.message}`,
			);
			throw error;
		}
	}
}
