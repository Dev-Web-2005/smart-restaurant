import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomPatternManager } from '../interfaces/room-pattern.interface';
import { SocketUser } from '../interfaces/socket-user.interface';

/**
 * Room Manager Service
 *
 * Manages WebSocket room membership based on user roles and actions
 * Implements hierarchical room pattern for multi-tenant isolation
 */
@Injectable()
export class RoomManagerService {
	private readonly logger = new Logger(RoomManagerService.name);
	private readonly roomPattern = new RoomPatternManager();

	/**
	 * Join user to role-based rooms on connection
	 */
	async joinRoleBasedRooms(socket: Socket, user: SocketUser): Promise<void> {
		const rooms = this.roomPattern.getRoomsForUser({
			tenantId: user.tenantId,
			role: user.role,
			tableId: user.tableId,
			waiterId: user.waiterId,
		});

		for (const room of rooms) {
			await socket.join(room);
			this.logger.log(`Socket ${socket.id} joined room: ${room}`);
		}

		this.logger.log(
			`User ${user.userId} (${user.role}) joined ${rooms.length} rooms in tenant ${user.tenantId}`,
		);
	}

	/**
	 * Join user to a specific order room
	 * Called when customer places order or waiter is assigned
	 */
	async joinOrderRoom(socket: Socket, user: SocketUser, orderId: string): Promise<void> {
		const room = this.roomPattern.order(user.tenantId, orderId);
		await socket.join(room);
		this.logger.log(`User ${user.userId} joined order room: ${room}`);
	}

	/**
	 * Leave order room
	 * Called when order is completed or cancelled
	 */
	async leaveOrderRoom(socket: Socket, user: SocketUser, orderId: string): Promise<void> {
		const room = this.roomPattern.order(user.tenantId, orderId);
		await socket.leave(room);
		this.logger.log(`User ${user.userId} left order room: ${room}`);
	}

	/**
	 * Cleanup all rooms when user disconnects
	 */
	async cleanupRooms(socket: Socket, user: SocketUser): Promise<void> {
		// Socket.IO automatically removes from all rooms on disconnect
		// This is for logging purposes
		this.logger.log(
			`User ${user.userId} disconnected, cleaning up rooms in tenant ${user.tenantId}`,
		);
	}

	/**
	 * Get all active sockets in a room
	 */
	async getSocketsInRoom(server: Server, room: string): Promise<string[]> {
		const sockets = await server.in(room).fetchSockets();
		return sockets.map((s) => s.id);
	}

	/**
	 * Get count of users in a room
	 */
	async getRoomSize(server: Server, room: string): Promise<number> {
		const sockets = await this.getSocketsInRoom(server, room);
		return sockets.length;
	}

	/**
	 * Broadcast to specific room (used by event emitter)
	 */
	emitToRoom(server: Server, room: string, event: string, data: any): void {
		server.to(room).emit(event, data);
		this.logger.debug(`Emitted '${event}' to room '${room}'`);
	}

	/**
	 * Get room pattern manager instance
	 */
	getRoomPattern(): RoomPatternManager {
		return this.roomPattern;
	}
}
