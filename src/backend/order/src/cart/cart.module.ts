import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
	imports: [
		// 1. Load ConfigModule đầu tiên và set isGlobal
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env', // Đảm bảo đường dẫn đúng
		}),
		// 2. Cấu hình Redis Cache
		CacheModule.registerAsync({
			isGlobal: true,
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => {
				// Lấy thông tin config
				const host = configService.get<string>('REDIS_HOST') || 'localhost';
				const port = parseInt(configService.get<string>('REDIS_PORT')) || 6379;
				// const password = configService.get<string>('REDIS_PASSWORD');

				console.log(`🔌 Connecting to Redis at ${host}:${port}...`);

				const store = await redisStore({
					socket: {
						host: host,
						port: port,
					},
					// Nếu server leader có pass thì bỏ comment dòng dưới
					// password: password,
					ttl: 86400 * 1000, // TTL mặc định (ms)
				});

				return {
					store: () => store, // <--- TRICK QUAN TRỌNG: Wrap vào function để tránh lỗi undefined
					ttl: 86400 * 1000,
				};
			},
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
