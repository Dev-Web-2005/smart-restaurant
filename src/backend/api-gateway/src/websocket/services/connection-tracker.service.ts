import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { SocketUser } from '../interfaces/socket-user.interface';

/**
 * Connection Tracker Service
 *
 * Tracks active WebSocket connections for monitoring and analytics
 * Useful for dashboard metrics and debugging
 */
@Injectable()
export class ConnectionTrackerService {
	private readonly logger = new Logger(ConnectionTrackerService.name);

	// In-memory store (in production, use Redis for distributed systems)
	private connections = new Map<
		string,
		{
			socketId: string;
			user: SocketUser;
			connectedAt: Date;
			lastActivity: Date;
		}
	>();

	/**
	 * Track new connection
	 */
	trackConnection(socket: Socket, user: SocketUser): void {
		this.connections.set(socket.id, {
			socketId: socket.id,
			user,
			connectedAt: new Date(),
			lastActivity: new Date(),
		});

		this.logger.log(
			`Tracking connection: ${socket.id} for user ${user.userId} (tenant: ${user.tenantId})`,
		);
		this.logStats();
	}

	/**
	 * Update last activity timestamp
	 */
	updateActivity(socketId: string): void {
		const connection = this.connections.get(socketId);
		if (connection) {
			connection.lastActivity = new Date();
		}
	}

	/**
	 * Remove connection on disconnect
	 */
	removeConnection(socketId: string): void {
		const connection = this.connections.get(socketId);
		if (connection) {
			this.logger.log(
				`Removing connection: ${socketId} for user ${connection.user.userId}`,
			);
			this.connections.delete(socketId);
			this.logStats();
		}
	}

	/**
	 * Get all active connections for a tenant
	 */
	getConnectionsByTenant(tenantId: string): Array<{
		socketId: string;
		user: SocketUser;
		connectedAt: Date;
		lastActivity: Date;
	}> {
		const tenantConnections = [];
		for (const [_, connection] of this.connections) {
			if (connection.user.tenantId === tenantId) {
				tenantConnections.push(connection);
			}
		}
		return tenantConnections;
	}

	/**
	 * Get connections by role
	 */
	getConnectionsByRole(
		tenantId: string,
		role: string,
	): Array<{
		socketId: string;
		user: SocketUser;
		connectedAt: Date;
		lastActivity: Date;
	}> {
		const roleConnections = [];
		for (const [_, connection] of this.connections) {
			if (connection.user.tenantId === tenantId && connection.user.role === role) {
				roleConnections.push(connection);
			}
		}
		return roleConnections;
	}

	/**
	 * Get total connection count
	 */
	getTotalConnections(): number {
		return this.connections.size;
	}

	/**
	 * Get connection stats by tenant
	 */
	getStatsByTenant(tenantId: string): {
		total: number;
		byRole: Record<string, number>;
	} {
		const tenantConnections = this.getConnectionsByTenant(tenantId);
		const byRole: Record<string, number> = {};

		for (const conn of tenantConnections) {
			const role = conn.user.role;
			byRole[role] = (byRole[role] || 0) + 1;
		}

		return {
			total: tenantConnections.length,
			byRole,
		};
	}

	/**
	 * Log current stats
	 */
	private logStats(): void {
		const total = this.getTotalConnections();
		this.logger.debug(`Total active WebSocket connections: ${total}`);
	}

	/**
	 * Get all connections (for admin dashboard)
	 */
	getAllConnections(): Array<{
		socketId: string;
		user: SocketUser;
		connectedAt: Date;
		lastActivity: Date;
	}> {
		return Array.from(this.connections.values());
	}
}
