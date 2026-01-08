import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderItem } from '../common/entities';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
		ClientsModule.register([
			{
				name: 'PRODUCT_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_PRODUCT_SERVICE || 'localhost',
					port: +process.env.PORT_PRODUCT_SERVICE || 8082,
				},
			},
		]),
	],
	controllers: [OrderController],
	providers: [OrderService],
	exports: [OrderService],
})
export class OrderModule {}
