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
}
