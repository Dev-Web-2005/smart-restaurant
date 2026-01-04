import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from 'src/common/entities/user';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesModule } from 'src/roles/roles.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
		RolesModule,
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
								'x-dead-letter-exchange': 'dlx_exchange',
								'x-dead-letter-routing-key': 'notification_dlq',
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
