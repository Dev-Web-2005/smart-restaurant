import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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
 * - Publish events to RabbitMQ for WebSocket broadcast via API Gateway
 *
 * Architecture (Consistent with Order Service):
 * Kitchen Service → RabbitMQ (order_events_exchange) → API Gateway → WebSocket clients
 *
 * Features:
 * - Ticket management with status lifecycle
 * - Item-level tracking and station routing
 * - Elapsed time timers with color thresholds
 * - Statistics and KPI tracking
 * - Recall/remake functionality
 *
 * NOTE: This module uses amqplib directly for RabbitMQ publishing
 * instead of NestJS ClientsModule. This ensures proper fanout exchange
 * pattern broadcasting, consistent with the Order Service approach.
 */
@Module({
	imports: [
		// 1. Load ConfigModule
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),

		// 2. TypeORM for ticket persistence
		TypeOrmModule.forFeature([KitchenTicket, KitchenTicketItem]),

		// NOTE: RabbitMQ publishing is done via amqplib directly in KitchenService
		// This is consistent with Order Service pattern for proper fanout broadcasting
	],
	controllers: [KitchenController],
	providers: [KitchenService],
	exports: [KitchenService],
})
export class KitchenModule {}
