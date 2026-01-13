import { RoleEnum } from '@shared/utils/enum';

/**
 * WebSocket Role Mapping
 *
 * Maps Identity Service role enums to WebSocket-friendly role names
 * Ensures consistency between authentication and real-time communication
 */

/**
 * WebSocket Role Names (lowercase, user-friendly)
 */
export enum WsRole {
	ADMIN = 'admin',
	OWNER = 'owner', // Maps to USER (chủ nhà hàng)
	WAITER = 'waiter', // Maps to STAFF
	KITCHEN = 'kitchen', // Maps to CHEF
	CUSTOMER = 'customer',
}

/**
 * Identity Service Role Names (from RoleEnum)
 */
export type IdentityRole = 'ADMIN' | 'USER' | 'STAFF' | 'CHEF' | 'CUSTOMER';

/**
 * Map Identity Service role to WebSocket role
 */
export function mapIdentityRoleToWsRole(identityRole: string): WsRole {
	switch (identityRole) {
		case 'ADMIN':
			return WsRole.ADMIN;
		case 'USER':
			return WsRole.OWNER; // Chủ nhà hàng
		case 'STAFF':
			return WsRole.WAITER; // Nhân viên phục vụ
		case 'CHEF':
			return WsRole.KITCHEN; // Đầu bếp
		case 'CUSTOMER':
			return WsRole.CUSTOMER;
		default:
			throw new Error(`Unknown identity role: ${identityRole}`);
	}
}

/**
 * Map WebSocket role to Identity Service role
 */
export function mapWsRoleToIdentityRole(wsRole: WsRole): IdentityRole {
	switch (wsRole) {
		case WsRole.ADMIN:
			return 'ADMIN';
		case WsRole.OWNER:
			return 'USER';
		case WsRole.WAITER:
			return 'STAFF';
		case WsRole.KITCHEN:
			return 'CHEF';
		case WsRole.CUSTOMER:
			return 'CUSTOMER';
	}
}

/**
 * Check if user has specific role
 */
export function hasRole(userRoles: string[], targetRole: IdentityRole): boolean {
	return userRoles.includes(targetRole);
}

/**
 * Get primary role from roles array
 * Priority: ADMIN > USER > STAFF > CHEF > CUSTOMER
 */
export function getPrimaryRole(roles: string[]): WsRole {
	if (roles.includes('ADMIN')) return WsRole.ADMIN;
	if (roles.includes('USER')) return WsRole.OWNER;
	if (roles.includes('STAFF')) return WsRole.WAITER;
	if (roles.includes('CHEF')) return WsRole.KITCHEN;
	if (roles.includes('CUSTOMER')) return WsRole.CUSTOMER;

	throw new Error('User has no valid roles');
}

/**
 * Validate role string
 */
export function isValidWsRole(role: string): role is WsRole {
	return Object.values(WsRole).includes(role as WsRole);
}

/**
 * Validate Identity role string
 */
export function isValidIdentityRole(role: string): role is IdentityRole {
	return ['ADMIN', 'USER', 'STAFF', 'CHEF', 'CUSTOMER'].includes(role);
}
