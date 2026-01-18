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
		const receivedAt = new Date().toISOString();
		const channel = context.getChannelRef();
		const message = context.getMessage();

		// 🔍 DEBUG: Extract message tracking info
		const messageId = data._messageId || message.properties?.messageId || 'UNKNOWN';
		const publishedAt = data._publishedAt || 'UNKNOWN';
		const deliveryTag = message.fields?.deliveryTag;
		const redelivered = message.fields?.redelivered;

		this.logger.log(
			`\n🔔 [DEBUG-GATEWAY-RECEIVE] ========== START ==========\n` +
			`   ReceivedAt: ${receivedAt}\n` +
			`   MessageId: ${messageId}\n` +
			`   PublishedAt: ${publishedAt}\n` +
			`   DeliveryTag: ${deliveryTag}\n` +
			`   Redelivered: ${redelivered}\n` +
			`   OrderId: ${data.orderId}\n` +
			`   TableId: ${data.tableId}\n` +
			`   TenantId: ${data.tenantId}\n` +
			`   ItemCount: ${data.items?.length}\n` +
			`   Headers: ${JSON.stringify(message.properties?.headers || {})}`,
		);

		try {
			this.logger.log(
				`🔍 [DEBUG-GATEWAY-RECEIVE] Broadcasting to WebSocket...`,
			);

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
				`✅ [DEBUG-GATEWAY-RECEIVE] SUCCESS\n` +
				`   MessageId: ${messageId}\n` +
				`   Room: tenant:${data.tenantId}:waiters\n` +
				`   ========== END ==========\n`,
			);

			// ✅ NestJS auto-acks on success, auto-nacks on error (noAck: false)
		} catch (error) {
			this.logger.error(
				`❌ [DEBUG-GATEWAY-RECEIVE] ERROR\n` +
				`   MessageId: ${messageId}\n` +
				`   Error: ${error.message}`,
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
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.ticket.new: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Kitchen ticket ready (all items prepared)
	 * Used by waiter/expo to know when to pick up food
	 */
	@EventPattern('kitchen.ticket.ready')
	async handleKitchenTicketReady(@Payload() data: any, @Ctx() context: RmqContext) {
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
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.ticket.ready: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Kitchen ticket completed (bumped by cook/expo)
	 */
	@EventPattern('kitchen.ticket.completed')
	async handleKitchenTicketCompleted(@Payload() data: any, @Ctx() context: RmqContext) {
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
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.ticket.completed: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Kitchen ticket priority changed
	 */
	@EventPattern('kitchen.ticket.priority')
	async handleKitchenTicketPriority(@Payload() data: any, @Ctx() context: RmqContext) {
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
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.ticket.priority: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Kitchen items recalled (need to remake)
	 */
	@EventPattern('kitchen.items.recalled')
	async handleKitchenItemsRecalled(@Payload() data: any, @Ctx() context: RmqContext) {
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
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.items.recalled: ${error.message}`,
			);
			throw error;
		}
	}

	/**
	 * EVENT: Kitchen timers update (throttled every 5 seconds)
	 * Used by KDS to display real-time elapsed time on tickets
	 */
	@EventPattern('kitchen.timers.update')
	async handleKitchenTimersUpdate(@Payload() data: any, @Ctx() context: RmqContext) {
		try {
			// Don't log every 5 seconds to avoid log spam
			this.eventEmitterService.broadcastKitchenTimersUpdate({
				tenantId: data.tenantId,
				tickets: data.tickets,
			});
		} catch (error) {
			this.logger.error(
				`[RabbitMQ] Failed to handle kitchen.timers.update: ${error.message}`,
			);
			throw error;
		}
	}

	// NOTE: kitchen.items.preparing and kitchen.items.ready have been removed
	// Item status updates now flow through Order Service using order.items.* events
	// This ensures a single source of truth for item status across all apps
}
