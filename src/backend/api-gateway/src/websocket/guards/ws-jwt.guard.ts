import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

/**
 * WebSocket JWT Guard
 *
 * Authenticates WebSocket connections using JWT tokens
 * Extracts user data from token and attaches to socket.data.user
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

			// Extract token
			const token = this.extractToken(authData);
			if (!token) {
				this.logger.warn('No token provided in WebSocket connection');
				throw new WsException('Unauthorized: No token provided');
			}

			// Verify JWT token
			const jwtSecret = this.configService.get<string>('JWT_SECRET');
			const payload = await this.jwtService.verifyAsync(token, {
				secret: jwtSecret,
			});

			// Validate tenant isolation
			if (authData.tenantId && payload.tenantId !== authData.tenantId) {
				this.logger.warn(
					`Tenant mismatch: JWT=${payload.tenantId}, Provided=${authData.tenantId}`,
				);
				throw new WsException('Unauthorized: Tenant mismatch');
			}

			// Attach user data to socket
			client.data.user = {
				userId: payload.userId || payload.sub,
				tenantId: payload.tenantId,
				role: payload.role,
				email: payload.email,
				name: payload.name,
				tableId: authData.tableId,
				waiterId: authData.waiterId,
				permissions: payload.permissions || [],
				sessionId: client.id,
				connectedAt: new Date(),
			};

			this.logger.log(
				`WebSocket authenticated: ${client.data.user.role} ${client.data.user.userId} (tenant: ${client.data.user.tenantId})`,
			);

			return true;
		} catch (error) {
			this.logger.error(`WebSocket authentication failed: ${error.message}`);
			throw new WsException('Unauthorized: Invalid token');
		}
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
