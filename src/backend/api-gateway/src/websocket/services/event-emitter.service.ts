import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import type { WebSocketEventPayload } from '../dtos/event-payload.dto';

/**
 * Event Emitter Service
 *
 * Listens to internal events and emits them to WebSocket clients
 * Bridge between backend services and frontend real-time updates
 */
@Injectable()
export class EventEmitterService {
	private readonly logger = new Logger(EventEmitterService.name);
	private server: Server;

	/**
	 * Set Socket.IO server instance
	 */
	setServer(server: Server): void {
		this.server = server;
		this.logger.log('Socket.IO server instance set for event emitter');
	}

	/**
	 * Listen to 'websocket.emit' events from other services
	 *
	 * Services emit events like:
	 * this.eventEmitter.emit('websocket.emit', {
	 *   event: 'order.items.new',
	 *   room: 'tenant:abc:waiters',
	 *   data: { ... }
	 * });
	 */
	@OnEvent('websocket.emit')
	handleWebSocketEmit(payload: WebSocketEventPayload): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot emit event');
			return;
		}

		const { event, room, data, timestamp = new Date(), metadata } = payload;

		const eventPayload: WebSocketEventPayload = {
			event,
			room,
			data,
			timestamp,
			metadata,
		};

		if (room) {
			// Emit to specific room
			this.server.to(room).emit(event, eventPayload);
			this.logger.log(`Emitted '${event}' to room '${room}'`);
		} else {
			// Broadcast to all connected clients (rarely used)
			this.server.emit(event, eventPayload);
			this.logger.log(`Broadcasted '${event}' to all clients`);
		}
	}

	/**
	 * Listen to order events from Order Service
	 */
	@OnEvent('order.items.new')
	handleOrderItemsNew(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'order.items.new',
		});
	}

	@OnEvent('order.items.accepted')
	handleOrderItemsAccepted(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'order.items.accepted',
		});
	}

	@OnEvent('order.items.rejected')
	handleOrderItemsRejected(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'order.items.rejected',
		});
	}

	@OnEvent('order.items.preparing')
	handleOrderItemsPreparing(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'order.items.preparing',
		});
	}

	@OnEvent('order.items.ready')
	handleOrderItemsReady(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'order.items.ready',
		});
	}

	@OnEvent('order.items.served')
	handleOrderItemsServed(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'order.items.served',
		});
	}

	/**
	 * Listen to notification events from Waiter Service
	 */
	@OnEvent('notification.waiter.new')
	handleWaiterNotification(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'notification.waiter.new',
		});
	}

	/**
	 * Listen to payment events
	 */
	@OnEvent('payment.requested')
	handlePaymentRequested(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'payment.requested',
		});
	}

	@OnEvent('payment.completed')
	handlePaymentCompleted(payload: WebSocketEventPayload): void {
		this.handleWebSocketEmit({
			...payload,
			event: 'payment.completed',
		});
	}

	/**
	 * ============================================================
	 * DIRECT BROADCAST METHODS (Called from RabbitMQ Controller)
	 * ============================================================
	 *
	 * These methods are called directly by WebsocketEventController
	 * when receiving RabbitMQ events from Order Service
	 *
	 * They bypass the EventEmitter pattern and emit directly to Socket.IO
	 * This is the proper way to handle cross-process communication
	 */

	/**
	 * Broadcast new order items to waiters
	 * Called from RabbitMQ controller when Order Service emits order.new_items
	 */
	broadcastOrderItemsNew(data: {
		orderId: string;
		tableId: string;
		tenantId: string;
		items: any[];
		orderType?: string;
		customerName?: string;
		notes?: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const room = `tenant:${data.tenantId}:waiters`;
		const eventPayload: WebSocketEventPayload = {
			event: 'order.items.new',
			room,
			data: {
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				customerName: data.customerName,
				items: data.items, // ✅ Full OrderItem objects from Order Service
				orderType: data.orderType,
				notes: data.notes,
				createdAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'order-service',
			},
		};

		this.server.to(room).emit('order.items.new', eventPayload);
		this.logger.log(
			`[WebSocket] Emitted 'order.items.new' to room '${room}' with ${data.items.length} items`,
		);
	}

	/**
	 * Future: Add more broadcast methods for other order events
	 * - broadcastOrderItemsAccepted()
	 * - broadcastOrderItemsPreparing()
	 * - broadcastOrderItemsReady()
	 * - broadcastOrderItemsServed()
	 */

	/**
	 * Broadcast accepted order items
	 * Target rooms: Customer order room + Kitchen room
	 */
	broadcastOrderItemsAccepted(data: {
		orderId: string;
		tableId: string;
		tenantId: string;
		items: any[];
		status: string;
		updatedBy?: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'order.items.accepted',
			data: {
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				updatedBy: data.updatedBy,
				updatedAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'order-service',
			},
		};

		// Emit to customer order room
		const orderRoom = `tenant:${data.tenantId}:order:${data.orderId}`;
		this.server.to(orderRoom).emit('order.items.accepted', eventPayload);

		// Emit to kitchen room
		const kitchenRoom = `tenant:${data.tenantId}:kitchen`;
		this.server.to(kitchenRoom).emit('order.items.accepted', eventPayload);

		this.logger.log(
			`[WebSocket] Emitted 'order.items.accepted' to rooms: ${orderRoom}, ${kitchenRoom}`,
		);
	}

	/**
	 * Broadcast preparing order items
	 * Target rooms: Customer order room + Waiter room
	 */
	broadcastOrderItemsPreparing(data: {
		orderId: string;
		tableId: string;
		tenantId: string;
		items: any[];
		status: string;
		updatedBy?: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'order.items.preparing',
			data: {
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				updatedBy: data.updatedBy,
				updatedAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'order-service',
			},
		};

		// Emit to customer order room
		const orderRoom = `tenant:${data.tenantId}:order:${data.orderId}`;
		this.server.to(orderRoom).emit('order.items.preparing', eventPayload);

		// Emit to waiter room
		const waiterRoom = `tenant:${data.tenantId}:waiters`;
		this.server.to(waiterRoom).emit('order.items.preparing', eventPayload);

		this.logger.log(
			`[WebSocket] Emitted 'order.items.preparing' to rooms: ${orderRoom}, ${waiterRoom}`,
		);
	}

	/**
	 * Broadcast ready order items
	 * Target rooms: Customer order room + Waiter room
	 */
	broadcastOrderItemsReady(data: {
		orderId: string;
		tableId: string;
		tenantId: string;
		items: any[];
		status: string;
		updatedBy?: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'order.items.ready',
			data: {
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				updatedBy: data.updatedBy,
				updatedAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'order-service',
			},
		};

		// Emit to customer order room
		const orderRoom = `tenant:${data.tenantId}:order:${data.orderId}`;
		this.server.to(orderRoom).emit('order.items.ready', eventPayload);

		// Emit to waiter room
		const waiterRoom = `tenant:${data.tenantId}:waiters`;
		this.server.to(waiterRoom).emit('order.items.ready', eventPayload);

		this.logger.log(
			`[WebSocket] Emitted 'order.items.ready' to rooms: ${orderRoom}, ${waiterRoom}`,
		);
	}

	/**
	 * Broadcast served order items
	 * Target room: Customer order room only
	 */
	broadcastOrderItemsServed(data: {
		orderId: string;
		tableId: string;
		tenantId: string;
		items: any[];
		status: string;
		updatedBy?: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'order.items.served',
			data: {
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				updatedBy: data.updatedBy,
				updatedAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'order-service',
			},
		};

		// Emit to customer order room only
		const orderRoom = `tenant:${data.tenantId}:order:${data.orderId}`;
		this.server.to(orderRoom).emit('order.items.served', eventPayload);

		this.logger.log(`[WebSocket] Emitted 'order.items.served' to room: ${orderRoom}`);
	}

	/**
	 * Broadcast rejected order items
	 * Target room: Customer order room only
	 */
	broadcastOrderItemsRejected(data: {
		orderId: string;
		tableId: string;
		tenantId: string;
		items: any[];
		status: string;
		rejectionReason?: string;
		updatedBy?: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'order.items.rejected',
			data: {
				orderId: data.orderId,
				tableId: data.tableId,
				tenantId: data.tenantId,
				items: data.items,
				status: data.status,
				rejectionReason: data.rejectionReason,
				updatedBy: data.updatedBy,
				updatedAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'order-service',
			},
		};

		// Emit to customer order room only
		const orderRoom = `tenant:${data.tenantId}:order:${data.orderId}`;
		this.server.to(orderRoom).emit('order.items.rejected', eventPayload);

		this.logger.log(`[WebSocket] Emitted 'order.items.rejected' to room: ${orderRoom}`);
	}

	// ==================== KITCHEN SERVICE BROADCAST METHODS ====================
	// These are display-only events for Kitchen Display System (KDS)
	// Item status updates (PREPARING, READY) now flow through Order Service
	// using order.items.* events for unified state management
	//
	// REMOVED methods (no longer needed):
	// - broadcastKitchenTicketNew (Order uses order.items.accepted)
	// - broadcastKitchenTicketStarted (Order uses order.items.preparing)
	// - broadcastKitchenItemsPreparing (Order uses order.items.preparing)
	// - broadcastKitchenItemsReady (Order uses order.items.ready)

	/**
	 * Broadcast kitchen ticket ready
	 * Target room: Kitchen room + Waiter room + Customer order room
	 * Used by waiter/expo to know when to pick up food
	 */
	broadcastKitchenTicketReady(data: {
		tenantId: string;
		orderId: string;
		tableId: string;
		ticket: any;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'kitchen.ticket.ready',
			data: {
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticket: data.ticket,
				readyAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'kitchen-service',
			},
		};

		// Emit to kitchen room
		const kitchenRoom = `tenant:${data.tenantId}:kitchen`;
		this.server.to(kitchenRoom).emit('kitchen.ticket.ready', eventPayload);

		// Emit to waiter room (pickup notification)
		const waiterRoom = `tenant:${data.tenantId}:waiters`;
		this.server.to(waiterRoom).emit('kitchen.ticket.ready', eventPayload);

		// Emit to customer order room
		const orderRoom = `tenant:${data.tenantId}:order:${data.orderId}`;
		this.server.to(orderRoom).emit('kitchen.ticket.ready', eventPayload);

		this.logger.log(
			`[WebSocket] Emitted 'kitchen.ticket.ready' to rooms: ${kitchenRoom}, ${waiterRoom}, ${orderRoom}`,
		);
	}

	/**
	 * Broadcast kitchen ticket completed (bumped)
	 * Target room: Kitchen room + Waiter room
	 */
	broadcastKitchenTicketCompleted(data: {
		tenantId: string;
		orderId: string;
		tableId: string;
		ticketId: string;
		ticketNumber: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'kitchen.ticket.completed',
			data: {
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticketId: data.ticketId,
				ticketNumber: data.ticketNumber,
				completedAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'kitchen-service',
			},
		};

		// Emit to kitchen room
		const kitchenRoom = `tenant:${data.tenantId}:kitchen`;
		this.server.to(kitchenRoom).emit('kitchen.ticket.completed', eventPayload);

		// Emit to waiter room
		const waiterRoom = `tenant:${data.tenantId}:waiters`;
		this.server.to(waiterRoom).emit('kitchen.ticket.completed', eventPayload);

		this.logger.log(
			`[WebSocket] Emitted 'kitchen.ticket.completed' to rooms: ${kitchenRoom}, ${waiterRoom}`,
		);
	}

	/**
	 * Broadcast kitchen ticket priority changed
	 * Target room: Kitchen room only
	 */
	broadcastKitchenTicketPriority(data: {
		tenantId: string;
		orderId: string;
		tableId: string;
		ticket: any;
		oldPriority: string;
		newPriority: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'kitchen.ticket.priority',
			data: {
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticket: data.ticket,
				oldPriority: data.oldPriority,
				newPriority: data.newPriority,
				updatedAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'kitchen-service',
			},
		};

		// Emit to kitchen room only (internal kitchen event)
		const kitchenRoom = `tenant:${data.tenantId}:kitchen`;
		this.server.to(kitchenRoom).emit('kitchen.ticket.priority', eventPayload);

		this.logger.log(
			`[WebSocket] Emitted 'kitchen.ticket.priority' (${data.oldPriority} → ${data.newPriority}) to room: ${kitchenRoom}`,
		);
	}

	/**
	 * Broadcast kitchen items recalled
	 * Target room: Kitchen room + Waiter room
	 */
	broadcastKitchenItemsRecalled(data: {
		tenantId: string;
		orderId: string;
		tableId: string;
		ticketId: string;
		ticketNumber: string;
		items: any[];
		reason: string;
	}): void {
		if (!this.server) {
			this.logger.warn('Socket.IO server not initialized, cannot broadcast');
			return;
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'kitchen.items.recalled',
			data: {
				tenantId: data.tenantId,
				orderId: data.orderId,
				tableId: data.tableId,
				ticketId: data.ticketId,
				ticketNumber: data.ticketNumber,
				items: data.items,
				reason: data.reason,
				recalledAt: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'kitchen-service',
			},
		};

		// Emit to kitchen room
		const kitchenRoom = `tenant:${data.tenantId}:kitchen`;
		this.server.to(kitchenRoom).emit('kitchen.items.recalled', eventPayload);

		// Emit to waiter room (awareness)
		const waiterRoom = `tenant:${data.tenantId}:waiters`;
		this.server.to(waiterRoom).emit('kitchen.items.recalled', eventPayload);

		this.logger.log(
			`[WebSocket] Emitted 'kitchen.items.recalled' to rooms: ${kitchenRoom}, ${waiterRoom}`,
		);
	}

	/**
	 * Broadcast kitchen timers update (throttled every 5 seconds)
	 * Target room: Kitchen room only
	 * Used by KDS to display real-time elapsed time on tickets
	 */
	broadcastKitchenTimersUpdate(data: { tenantId: string; tickets: any[] }): void {
		if (!this.server) {
			return; // Silently return - don't spam logs for timer updates
		}

		const eventPayload: WebSocketEventPayload = {
			event: 'kitchen.timers.update',
			data: {
				tenantId: data.tenantId,
				tickets: data.tickets,
				timestamp: new Date(),
			},
			timestamp: new Date(),
			metadata: {
				tenantId: data.tenantId,
				sourceService: 'kitchen-service',
			},
		};

		// Emit to kitchen room only (KDS display update)
		const kitchenRoom = `tenant:${data.tenantId}:kitchen`;
		this.server.to(kitchenRoom).emit('kitchen.timers.update', eventPayload);

		// Don't log to avoid spam - this runs every 5 seconds
	}
}
