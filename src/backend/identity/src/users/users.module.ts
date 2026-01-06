import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from 'src/common/entities/user';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesModule } from 'src/roles/roles.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
		RolesModule,
		CacheModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				store: await redisStore({
					socket: {
						host: configService.get<string>('REDIS_HOST') || 'localhost',
						port: configService.get<number>('REDIS_PORT') || 6379,
					},
					password: configService.get<string>('REDIS_PASSWORD') || undefined,
				}),
			}),
		}),
		ClientsModule.registerAsync([
			{
				name: 'PROFILE_SERVICE',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.TCP,
					options: {
						host: configService.get<string>('HOST_PROFILE_SERVICE') || 'localhost',
						port: configService.get<number>('PORT_PROFILE_SERVICE') || 8081,
					},
				}),
			},
			{
				name: 'NOTIFICATION_SERVICE',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.RMQ,
					options: {
						urls: [
							configService.get<string>('CONNECTION_AMQP') || 'amqp://localhost:5672',
						],
						queue: 'notification_queue',
						queueOptions: {
							durable: true,
							arguments: {
								'x-dead-letter-exchange':
									configService.get<string>('QUEUE_NAME_OF_NOTIFICATION') +
										'_dlx_exchange' || 'local_notification_dlx_exchange',
								'x-dead-letter-routing-key':
									configService.get<string>('QUEUE_NAME_OF_NOTIFICATION') + '_dlq' ||
									'local_notification_dlq',
							},
						},
					},
				}),
			},
		]),
	],
	controllers: [UsersController],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
