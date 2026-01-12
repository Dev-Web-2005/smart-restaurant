import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WaiterController } from './waiter.controller';
import { WaiterService } from './waiter.service';
import { OrderNotification } from '../common/entities';

/**
 * WaiterModule
 *
 * Encapsulates waiter notification and order review functionality
 *
 * Features:
 * - Receive order notifications via RabbitMQ from Order Service
 * - Store notifications in database for tracking and SLA
 * - Handle waiter actions (accept/reject items)
 * - Communicate with Order Service and Kitchen Service
 */
@Module({
	imports: [
		// 1. Load ConfigModule
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),

		// 2. TypeORM for notification persistence
		TypeOrmModule.forFeature([OrderNotification]),

		// 3. RabbitMQ client to Order Service
		ClientsModule.registerAsync([
			{
				name: 'ORDER_SERVICE',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.RMQ,
					options: {
						urls: [
							configService.get<string>('CONNECTION_AMQP') || 'amqp://localhost:5672',
						],
						queue:
							(configService.get<string>('QUEUE_NAME_OF_ORDER') || 'local_order') +
							'_queue',
						queueOptions: {
							durable: true,
							arguments: {
								'x-dead-letter-exchange':
									(configService.get<string>('QUEUE_NAME_OF_ORDER') || 'local_order') +
									'_dlx_exchange',
								'x-dead-letter-routing-key':
									(configService.get<string>('QUEUE_NAME_OF_ORDER') || 'local_order') +
									'_dlq',
							},
						},
					},
				}),
			},
		]),

		// 4. RabbitMQ client to Kitchen Service
		ClientsModule.registerAsync([
			{
				name: 'KITCHEN_SERVICE',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.RMQ,
					options: {
						urls: [
							configService.get<string>('CONNECTION_AMQP') || 'amqp://localhost:5672',
						],
						queue:
							(configService.get<string>('QUEUE_NAME_OF_KITCHEN') || 'local_kitchen') +
							'_queue',
						queueOptions: {
							durable: true,
							arguments: {
								'x-dead-letter-exchange':
									(configService.get<string>('QUEUE_NAME_OF_KITCHEN') ||
										'local_kitchen') + '_dlx_exchange',
								'x-dead-letter-routing-key':
									(configService.get<string>('QUEUE_NAME_OF_KITCHEN') ||
										'local_kitchen') + '_dlq',
							},
						},
					},
				}),
			},
		]),
	],
	controllers: [WaiterController],
	providers: [WaiterService],
	exports: [WaiterService],
})
export class WaiterModule {}
