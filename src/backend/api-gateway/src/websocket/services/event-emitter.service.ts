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
}
