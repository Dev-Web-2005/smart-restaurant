import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user';
import { RemoveToken } from 'src/common/entities/remove-token';
import { Role } from 'src/common/entities/role';
import { JwtConfigModule } from 'src/common/config/jwt.config.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, RemoveToken, Role]),
		JwtConfigModule,
		ClientsModule.registerAsync([
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
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService],
})
export class AuthModule {}
