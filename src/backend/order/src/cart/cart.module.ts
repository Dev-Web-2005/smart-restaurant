import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
	imports: [
		ConfigModule,
		// 1. Cấu hình Redis Cache
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
	controllers: [CartController],
	providers: [CartService],
	exports: [CartService],
})
export class CartModule {}
