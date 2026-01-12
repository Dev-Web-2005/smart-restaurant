import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigService
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderItem } from '../common/entities';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager'; // Import CacheModule
import { redisStore } from 'cache-manager-redis-yet'; // Import redisStore
import { CartModule } from 'src/cart/cart.module';

/**
 * OrderModule
 *
 * Encapsulates order management functionality
 * Provides CRUD operations and order lifecycle management
 */
@Module({
	imports: [
		// 1. Load ConfigModule đầu tiên và set isGlobal
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env', // Đảm bảo đường dẫn đúng
		}),
		TypeOrmModule.forFeature([Order, OrderItem]),

		// 2. Cấu hình Redis Cache
		CacheModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				store: await redisStore({
					socket: {
						host: configService.get('REDIS_HOST') || 'localhost',
						port: parseInt(configService.get('REDIS_PORT')) || 6379,
					},
					ttl: 86400 * 1000, // Mặc định lưu 24h (tính bằng mili-giây)
				}),
			}),
			inject: [ConfigService],
		}),

		ClientsModule.registerAsync([
			{
				name: 'WAITER_SERVICE',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.RMQ,
					options: {
						urls: [
							configService.get<string>('CONNECTION_AMQP') || 'amqp://localhost:5672',
						],
						queue:
							(configService.get<string>('QUEUE_NAME_OF_WAITER') || 'local_waiter') +
							'_queue',
						queueOptions: {
							durable: true,
							arguments: {
								'x-dead-letter-exchange':
									(configService.get<string>('QUEUE_NAME_OF_WAITER') || 'local_waiter') +
									'_dlx_exchange',
								'x-dead-letter-routing-key':
									(configService.get<string>('QUEUE_NAME_OF_WAITER') || 'local_waiter') +
									'_dlq',
							},
						},
					},
				}),
			},
		]),

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
		CartModule,
	],
	controllers: [OrderController],
	providers: [OrderService],
	exports: [OrderService],
})
export class OrderModule {}
