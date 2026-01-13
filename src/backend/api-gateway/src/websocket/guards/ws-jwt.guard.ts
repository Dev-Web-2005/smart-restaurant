import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { getPrimaryRole, isValidIdentityRole, WsRole } from '../utils/role-mapping.util';

/**
 * WebSocket JWT Guard
 *
 * Authenticates WebSocket connections using JWT tokens from Identity Service
 * Extracts user data from token and attaches to socket.data.user
 *
 * CRITICAL: Uses SAME JWT_SECRET as Identity Service
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
	private readonly logger = new Logger(WsJwtGuard.name);

	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		try {
			const client: Socket = context.switchToWs().getClient();
			const authData = client.handshake.auth;

			// 1. Extract token
			const token = this.extractToken(authData);

			// 🎯 GUEST MODE: Allow connection without token if tableId provided
			if (!token) {
				return this.handleGuestConnection(client, authData);
			}

			// 2. ✅ Verify using SAME secret as Identity Service (ACCESS_TOKEN)
			const jwtSecret = this.configService.get<string>('JWT_SECRET_KEY_ACCESS');
			const payload = await this.jwtService.verifyAsync(token, {
				secret: jwtSecret,
			});

			// 3. Validate JWT payload structure (from Identity Service)
			if (!payload.userId || !payload.roles || !Array.isArray(payload.roles)) {
				this.logger.warn('Invalid JWT payload structure', payload);
				throw new WsException('Unauthorized: Invalid token payload');
			}

			// 4. Validate roles from Identity Service
			const hasValidRole = payload.roles.some((role: string) =>
				isValidIdentityRole(role),
			);
			if (!hasValidRole) {
				this.logger.warn(`No valid roles in JWT: ${payload.roles.join(', ')}`);
				throw new WsException('Unauthorized: No valid roles');
			}

			// 5. ✅ Map Identity roles to WebSocket role
			const wsRole = getPrimaryRole(payload.roles);

			// 6. Extract tenantId (ownerId for CUSTOMER/STAFF/CHEF, userId for ADMIN/USER)
			const tenantId = payload.ownerId || payload.userId;

			// 7. Validate tenant isolation (if provided in handshake)
			if (authData.tenantId && tenantId !== authData.tenantId) {
				this.logger.warn(
					`Tenant mismatch: JWT=${tenantId}, Provided=${authData.tenantId}`,
				);
				throw new WsException('Unauthorized: Tenant mismatch');
			}

			// 8. ✅ Attach user data from JWT payload
			client.data.user = {
				userId: payload.userId,
				tenantId,
				role: wsRole, // Mapped WebSocket role
				email: payload.email,
				name: payload.username,
				tableId: authData.tableId, // From handshake (customer-specific)
				waiterId: authData.waiterId, // From handshake (waiter-specific)
				permissions: payload.roles, // Identity roles as permissions
				sessionId: client.id,
				connectedAt: new Date(),
			};

			this.logger.log(
				`✅ WebSocket authenticated: ${wsRole} ${payload.userId} (tenant: ${tenantId}) | Identity roles: ${payload.roles.join(', ')}`,
			);

			return true;
		} catch (error) {
			this.logger.error(`❌ WebSocket authentication failed: ${error.message}`);

			if (error.name === 'TokenExpiredError') {
				throw new WsException('Unauthorized: Token expired');
			}
			if (error.name === 'JsonWebTokenError') {
				throw new WsException('Unauthorized: Invalid token');
			}

			throw new WsException('Unauthorized: Authentication failed');
		}
	}

	/**
	 * Handle guest connection (no JWT token)
	 * Guests must provide tenantId and tableId to connect
	 */
	private handleGuestConnection(client: Socket, authData: any): boolean {
		const { tenantId, tableId, guestName } = authData;

		// Validate required fields for guest
		if (!tenantId || !tableId) {
			this.logger.warn('Guest connection missing tenantId or tableId');
			throw new WsException(
				'Unauthorized: Guest users must provide tenantId and tableId',
			);
		}

		// Generate guest user ID
		const guestId = `guest_${tableId}_${Date.now()}`;

		// Attach guest user data
		client.data.user = {
			userId: guestId,
			tenantId,
			role: WsRole.GUEST,
			name: guestName || `Guest at ${tableId}`,
			tableId,
			permissions: [], // No permissions for guest
			sessionId: client.id,
			connectedAt: new Date(),
			isGuest: true, // Flag for guest user
		};

		this.logger.log(
			`✅ Guest connected: ${guestId} at table ${tableId} (tenant: ${tenantId})`,
		);

		return true;
	}

	/**
	 * Extract token from auth data
	 */
	private extractToken(authData: any): string | null {
		if (!authData || !authData.token) {
			return null;
		}

		const token = authData.token;

		// Remove 'Bearer ' prefix if present
		if (token.startsWith('Bearer ')) {
			return token.substring(7);
		}

		return token;
	}
}
