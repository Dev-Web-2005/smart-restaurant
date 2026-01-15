import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KitchenController } from './kitchen.controller';
import { KitchenService } from './kitchen.service';
import { KitchenTicket, KitchenTicketItem } from '../common/entities';

/**
 * KitchenModule
 *
 * Core module for Kitchen Display System (KDS)
 *
 * BEST PRACTICE ARCHITECTURE (Toast POS, Square KDS, Oracle MICROS):
 * - Receive items from Order Service when waiter accepts
 * - Real-time timer tracking for preparation times
 * - Priority management for expediting
 * - Bump screen workflow for completion
 * - WebSocket events for real-time KDS updates
 *
 * Features:
 * - Ticket management with status lifecycle
 * - Item-level tracking and station routing
 * - Elapsed time timers with color thresholds
 * - Statistics and KPI tracking
 * - Recall/remake functionality
 */
@Module({
	imports: [
		// 1. Load ConfigModule
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),

		// 2. EventEmitter for WebSocket integration
		EventEmitterModule.forRoot({
			wildcard: true,
			delimiter: '.',
			maxListeners: 100,
		}),

		// 3. TypeORM for ticket persistence
		TypeOrmModule.forFeature([KitchenTicket, KitchenTicketItem]),

		// 4. RabbitMQ Client for publishing events
		ClientsModule.registerAsync([
			{
				name: 'KITCHEN_EVENTS',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.RMQ,
					options: {
						urls: [
							configService.get<string>('CONNECTION_AMQP') || 'amqp://localhost:5672',
						],
						queue: 'order_events_exchange', // Publish to same exchange as Order Service
						routingKey: '',
						noAck: true,
						persistent: true,
						queueOptions: {
							durable: true,
						},
					},
				}),
			},
		]),
	],
	controllers: [KitchenController],
	providers: [KitchenService],
	exports: [KitchenService],
})
export class KitchenModule {}
