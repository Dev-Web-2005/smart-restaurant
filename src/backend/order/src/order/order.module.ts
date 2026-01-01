import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderItem } from '../common/entities';

/**
 * OrderModule
 *
 * Encapsulates order management functionality
 * Provides CRUD operations and order lifecycle management
 */
@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([Order, OrderItem]),
	],
	controllers: [OrderController],
	providers: [OrderService],
	exports: [OrderService],
})
export class OrderModule {}
