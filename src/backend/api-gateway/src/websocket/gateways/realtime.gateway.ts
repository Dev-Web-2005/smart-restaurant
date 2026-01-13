import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	ConnectedSocket,
	MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { RoomManagerService } from '../services/room-manager.service';
import { EventEmitterService } from '../services/event-emitter.service';
import { ConnectionTrackerService } from '../services/connection-tracker.service';
import { SocketUser } from '../interfaces/socket-user.interface';
import type { JoinOrderRoomDto, LeaveOrderRoomDto } from '../dtos/event-payload.dto';
import { WsRole } from '../utils/role-mapping.util';
/**
 * Realtime Gateway
 *
 * Main WebSocket gateway for Smart Restaurant real-time communications
 * Implements hierarchical room pattern with multi-tenant isolation
 *
 * Responsibilities:
 * - Authenticate connections via JWT
 * - Auto-join users to role-based rooms
 * - Handle client subscriptions (join/leave order rooms)
 * - Emit server events to appropriate rooms
 * - Track active connections
 * - Implement heartbeat and reconnection logic
 */
@WebSocketGateway({
	namespace: '/realtime',
	cors: {
		origin: process.env.CORS_ORIGIN || '*',
		credentials: true,
	},
	pingInterval: 25000, // Send ping every 25s
	pingTimeout: 60000, // Disconnect if no pong after 60s
	transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
})
export class RealtimeGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(RealtimeGateway.name);

	constructor(
		private readonly roomManager: RoomManagerService,
		private readonly eventEmitter: EventEmitterService,
		private readonly connectionTracker: ConnectionTrackerService,
	) {}

	/**
	 * Lifecycle: Gateway initialization
	 */
	afterInit(server: Server) {
		this.logger.log('🚀 WebSocket Gateway initialized');
		this.eventEmitter.setServer(server);
	}

	/**
	 * Lifecycle: Client connection
	 *
	 * Flow:
	 * 1. Authenticate via JWT (WsJwtGuard)
	 * 2. Extract user from socket.data.user
	 * 3. Auto-join to role-based rooms
	 * 4. Track connection
	 */
	@UseGuards(WsJwtGuard)
	async handleConnection(@ConnectedSocket() client: Socket) {
		try {
			const user: SocketUser = client.data.user;

			if (!user) {
				this.logger.warn(`Connection rejected: No user data for socket ${client.id}`);
				client.disconnect();
				return;
			}

			// Auto-join role-based rooms
			await this.roomManager.joinRoleBasedRooms(client, user);

			// Track connection
			this.connectionTracker.trackConnection(client, user);

			// Send welcome message
			client.emit('connection.success', {
				message: 'Connected to Smart Restaurant real-time server',
				userId: user.userId,
				tenantId: user.tenantId,
				role: user.role,
				sessionId: client.id,
				timestamp: new Date(),
			});

			this.logger.log(
				`✅ Client connected: ${client.id} | User: ${user.userId} (${user.role}) | Tenant: ${user.tenantId}`,
			);
		} catch (error) {
			this.logger.error(`Connection error: ${error.message}`, error.stack);
			client.disconnect();
		}
	}

	/**
	 * Lifecycle: Client disconnection
	 *
	 * Flow:
	 * 1. Cleanup rooms (auto-removed by Socket.IO)
	 * 2. Remove from connection tracker
	 */
	async handleDisconnect(@ConnectedSocket() client: Socket) {
		try {
			const user: SocketUser = client.data.user;

			if (user) {
				await this.roomManager.cleanupRooms(client, user);
				this.connectionTracker.removeConnection(client.id);

				this.logger.log(
					`❌ Client disconnected: ${client.id} | User: ${user.userId} (${user.role})`,
				);
			} else {
				this.logger.log(`❌ Client disconnected: ${client.id} (unauthenticated)`);
			}
		} catch (error) {
			this.logger.error(`Disconnection error: ${error.message}`, error.stack);
		}
	}

	/**
	 * MESSAGE: Join order room
	 *
	 * Client subscribes to real-time updates for a specific order
	 * Called when customer places order or waiter opens order details
	 */
	@SubscribeMessage('order.join')
	async handleJoinOrder(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: JoinOrderRoomDto,
	) {
		try {
			const user: SocketUser = client.data.user;
			await this.roomManager.joinOrderRoom(client, user, data.orderId);

			this.connectionTracker.updateActivity(client.id);

			return {
				success: true,
				message: `Joined order room: ${data.orderId}`,
				orderId: data.orderId,
			};
		} catch (error) {
			this.logger.error(`Failed to join order room: ${error.message}`);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * MESSAGE: Leave order room
	 *
	 * Client unsubscribes from order updates
	 * Called when customer closes order page or order is completed
	 */
	@SubscribeMessage('order.leave')
	async handleLeaveOrder(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: LeaveOrderRoomDto,
	) {
		try {
			const user: SocketUser = client.data.user;
			await this.roomManager.leaveOrderRoom(client, user, data.orderId);

			this.connectionTracker.updateActivity(client.id);

			return {
				success: true,
				message: `Left order room: ${data.orderId}`,
				orderId: data.orderId,
			};
		} catch (error) {
			this.logger.error(`Failed to leave order room: ${error.message}`);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * MESSAGE: Ping (heartbeat)
	 *
	 * Client sends ping to keep connection alive
	 * Server responds with pong
	 */
	@SubscribeMessage('ping')
	handlePing(@ConnectedSocket() client: Socket) {
		this.connectionTracker.updateActivity(client.id);
		return {
			event: 'pong',
			timestamp: new Date(),
		};
	}

	/**
	 * MESSAGE: Sync missed events
	 *
	 * When client reconnects, fetch events missed during disconnection
	 * (This requires event persistence - future enhancement)
	 */
	@SubscribeMessage('sync.missed_events')
	async handleSyncMissedEvents(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { since: Date },
	) {
		try {
			const user: SocketUser = client.data.user;

			// TODO: Implement event persistence and retrieval
			// For now, just acknowledge
			this.logger.log(
				`Sync missed events requested by ${user.userId} since ${data.since}`,
			);

			this.connectionTracker.updateActivity(client.id);

			return {
				success: true,
				message: 'No missed events (feature coming soon)',
				events: [],
			};
		} catch (error) {
			this.logger.error(`Failed to sync missed events: ${error.message}`);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * MESSAGE: Get connection stats (admin/owner only)
	 *
	 * Returns active connection statistics for monitoring
	 */
	@SubscribeMessage('admin.connection_stats')
	async handleGetConnectionStats(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { tenantId?: string },
	) {
		try {
			const user: SocketUser = client.data.user;

			// Authorization: Only admins and owners
			if (![WsRole.ADMIN, WsRole.OWNER].includes(user.role)) {
				return {
					success: false,
					error: 'Unauthorized: Admin or Owner role required',
				};
			}

			const tenantId = data.tenantId || user.tenantId;
			const stats = this.connectionTracker.getStatsByTenant(tenantId);

			return {
				success: true,
				tenantId,
				stats,
				timestamp: new Date(),
			};
		} catch (error) {
			this.logger.error(`Failed to get connection stats: ${error.message}`);
			return {
				success: false,
				error: error.message,
			};
		}
	}
}
