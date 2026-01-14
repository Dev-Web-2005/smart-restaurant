import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderItem } from '../common/entities';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CartModule } from 'src/cart/cart.module';

/**
 * OrderModule
 *
 * Encapsulates order management functionality
 * Provides CRUD operations and order lifecycle management
 * Emits WebSocket events for real-time updates
 */
@Module({
	imports: [
		// 1. Load ConfigModule đầu tiên và set isGlobal
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
				name: 'ORDER_EVENTS',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.RMQ,
					options: {
						urls: [
							configService.get<string>('CONNECTION_AMQP') || 'amqp://localhost:5672',
						],
						// ✅ PUBLISH-SUBSCRIBE PATTERN: Emit to Exchange (not queue)
						// NestJS ClientProxy: 'queue' field is used as exchange name when routingKey is present
						// routingKey: '' means fanout pattern (broadcast to all bound queues)
						queue: 'order_events_exchange', // Exchange name (not a queue)
						routingKey: '', // Empty routing key = fanout broadcast (must be set to enable exchange mode, otherwise direct queue mode)
						noAck: false,
						queueOptions: {
							durable: true,
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
