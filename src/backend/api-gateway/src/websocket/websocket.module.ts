import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Gateways
import { RealtimeGateway } from './gateways/realtime.gateway';

// Services
import { RoomManagerService } from './services/room-manager.service';
import { EventEmitterService } from './services/event-emitter.service';
import { ConnectionTrackerService } from './services/connection-tracker.service';
import { StringValue } from 'ms';

// Guards
import { WsJwtGuard } from './guards/ws-jwt.guard';

/**
 * WebSocket Module
 *
 * Provides real-time communication infrastructure for Smart Restaurant
 * Implements hierarchical room pattern with multi-tenant isolation
 *
 * Features:
 * - JWT-based WebSocket authentication
 * - Role-based room management
 * - Event-driven architecture
 * - Connection tracking and monitoring
 * - Horizontal scalability (with Redis adapter)
 */
@Module({
	imports: [
		// EventEmitter for service-to-WebSocket bridge
		EventEmitterModule.forRoot({
			wildcard: true,
			delimiter: '.',
			maxListeners: 100,
		}),

		// JWT for WebSocket authentication
		// ✅ MUST use SAME secret as Identity Service
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const secret = configService.get<string>('JWT_SECRET_KEY_ACCESS');

				if (!secret) {
					throw new Error(
						'JWT_SECRET_KEY_ACCESS not configured. Must match Identity Service secret.',
					);
				}

				return {
					secret,
					signOptions: {
						expiresIn: configService.get<StringValue>('ACCESS_TOKEN_EXPIRY') || '5m',
					},
				};
			},
		}),

		ConfigModule,
	],
	providers: [
		// Gateway
		RealtimeGateway,

		// Services
		RoomManagerService,
		EventEmitterService,
		ConnectionTrackerService,

		// Guards
		WsJwtGuard,
	],
	exports: [
		// Export services for use in other modules
		RoomManagerService,
		EventEmitterService,
		ConnectionTrackerService,
	],
})
export class WebsocketModule {}
