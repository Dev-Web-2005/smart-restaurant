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

			// ✅ CRITICAL FIX: Manually ACK message to prevent redelivery
			channel.ack(message);
			this.logger.log(`[RabbitMQ] Message acknowledged successfully`);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.new_items: ${error.message}`,
				error.stack,
			);
			// Nack with no requeue to send to DLQ
			channel.nack(message, false, false);
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

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.accepted: ${error.message}`,
			);
			channel.nack(message, false, false);
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

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.preparing: ${error.message}`,
			);
			channel.nack(message, false, false);
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

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.ready: ${error.message}`,
			);
			channel.nack(message, false, false);
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

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.served: ${error.message}`,
			);
			channel.nack(message, false, false);
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

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle order.items.rejected: ${error.message}`,
			);
			channel.nack(message, false, false);
		}
	}

	// ==================== KITCHEN SERVICE EVENTS ====================
	// These are display-only events for Kitchen Display System (KDS)
	// Item status updates (PREPARING, READY) flow through Order Service instead
	// using order.items.* events for unified state management

	/**
	 * EVENT: New kitchen ticket created
	 * Triggered when Order Service accepts items and Kitchen creates display ticket
	 * Used by KDS frontend to display new tickets in real-time
	 */
	@EventPattern('kitchen.ticket.new')
	async handleKitchenTicketNew(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received kitchen.ticket.new for order ${data.orderId}, ticket ${data.ticket?.ticketNumber}`,
			);

			this.eventEmitterService.broadcastKitchenTicketNew({
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticket: data.ticket,
			});

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.ticket.new: ${error.message}`,
			);
			channel.nack(message, false, false);
		}
	}

	/**
	 * EVENT: Kitchen ticket ready (all items prepared)
	 * Used by waiter/expo to know when to pick up food
	 */
	@EventPattern('kitchen.ticket.ready')
	async handleKitchenTicketReady(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received kitchen.ticket.ready for ticket ${data.ticket?.ticketNumber}`,
			);

			this.eventEmitterService.broadcastKitchenTicketReady({
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticket: data.ticket,
			});

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.ticket.ready: ${error.message}`,
			);
			channel.nack(message, false, false);
		}
	}

	/**
	 * EVENT: Kitchen ticket completed (bumped by cook/expo)
	 */
	@EventPattern('kitchen.ticket.completed')
	async handleKitchenTicketCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received kitchen.ticket.completed for ticket ${data.ticketNumber}`,
			);

			this.eventEmitterService.broadcastKitchenTicketCompleted({
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticketId: data.ticketId,
				ticketNumber: data.ticketNumber,
			});

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.ticket.completed: ${error.message}`,
			);
			channel.nack(message, false, false);
		}
	}

	/**
	 * EVENT: Kitchen ticket priority changed
	 */
	@EventPattern('kitchen.ticket.priority')
	async handleKitchenTicketPriority(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received kitchen.ticket.priority for ticket ${data.ticket?.ticketNumber}: ${data.oldPriority} → ${data.newPriority}`,
			);

			this.eventEmitterService.broadcastKitchenTicketPriority({
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticket: data.ticket,
				oldPriority: data.oldPriority,
				newPriority: data.newPriority,
			});

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.ticket.priority: ${error.message}`,
			);
			channel.nack(message, false, false);
		}
	}

	/**
	 * EVENT: Kitchen items recalled (need to remake)
	 */
	@EventPattern('kitchen.items.recalled')
	async handleKitchenItemsRecalled(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[RabbitMQ] Received kitchen.items.recalled for ticket ${data.ticketNumber}: ${data.reason}`,
			);

			this.eventEmitterService.broadcastKitchenItemsRecalled({
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticketId: data.ticketId,
				ticketNumber: data.ticketNumber,
				items: data.items,
				reason: data.reason,
			});

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.items.recalled: ${error.message}`,
			);
			channel.nack(message, false, false);
		}
	}

	/**
	 * EVENT: Kitchen timers update (throttled every 5 seconds)
	 * Used by KDS to display real-time elapsed time on tickets
	 */
	@EventPattern('kitchen.timers.update')
	async handleKitchenTimersUpdate(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			// Don't log every 5 seconds to avoid log spam
			this.eventEmitterService.broadcastKitchenTimersUpdate({
				tenantId: data.tenantId,
				tickets: data.tickets,
			});

			// ✅ Manual ACK for reliability
			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.timers.update: ${error.message}`,
			);
			channel.nack(message, false, false);
		}
	}

	// NOTE: kitchen.items.preparing and kitchen.items.ready have been removed
	// Item status updates now flow through Order Service using order.items.* events
	// This ensures a single source of truth for item status across all apps
}
