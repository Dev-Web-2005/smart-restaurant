import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WaiterController } from './waiter.controller';
import { WaiterService } from './waiter.service';
import { OrderNotification } from '../common/entities';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * WaiterModule
 *
 * PURE NOTIFICATION LAYER - Best Practice Architecture
 *
 * Features:
 * - Receive order notifications via RabbitMQ from Order Service (alert creation)
 * - Store notifications in database for display
 * - Provide notification queries for waiter dashboard
 * - Mark notifications as read/archived
 *
 * Does NOT include:
 * - Business logic (handled by Order Service)
 * - Kitchen communication (handled by Order Service)
 * - Accept/Reject operations (Waiter frontend → Order Service directly)
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

		// 3. TypeORM for notification persistence
		TypeOrmModule.forFeature([OrderNotification]),

		// NOTE: Removed RabbitMQ clients to Order/Kitchen services
		// Waiter frontend will call Order Service directly via HTTP/RPC
		// This keeps notification layer pure and decoupled from business logic
	],
	controllers: [WaiterController],
	providers: [WaiterService],
	exports: [WaiterService],
})
export class WaiterModule {}
