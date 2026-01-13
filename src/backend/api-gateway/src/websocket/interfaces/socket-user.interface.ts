import { WsRole } from '../utils/role-mapping.util';

/**
 * Socket User Interface
 *
 * Represents authenticated user data attached to WebSocket connection
 * Extracted from JWT token during connection authentication
 */
export interface SocketUser {
	userId: string;
	tenantId: string;
	role: WsRole; // WebSocket role (mapped from Identity Service)
	email?: string;
	name?: string;

	// Role-specific IDs
	tableId?: string; // For customers
	waiterId?: string; // For waiters
	kitchenStationId?: string; // For kitchen staff

	// Permissions
	permissions: string[];

	// Session info
	sessionId: string;
	connectedAt: Date;
}

/**
 * Extended Socket interface with user data
 */
export interface AuthenticatedSocket {
	id: string;
	data: {
		user: SocketUser;
	};
	join: (room: string) => void;
	leave: (room: string) => void;
	emit: (event: string, data: any) => void;
	disconnect: (close?: boolean) => void;
}
