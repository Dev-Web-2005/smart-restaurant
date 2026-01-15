import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IdentityController } from './services/identity/identity.controller';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from 'src/common/middleware/logger/logger.middleware';
import { ProfileController } from './services/profile/profile.controller';
import { RateLimitMiddleware } from 'src/common/middleware/rate-limit/rate-limit.middleware';
import { TableController } from './services/table/table.controller';
import { FloorController } from './services/table/floor.controller';
import { ProductController } from './services/product/product.controller';
import { PublicUrlMiddleware } from 'src/common/middleware/public-url/public-url.middleware';
import { HealthController } from './health.controller';
import { NotificationController } from './services/notification/notification.controller';
import { OrderController } from './services/order/order.controller';
import { CartController } from './services/cart/cart.controller';
import { WaiterController } from './services/waiter/waiter.controller';
import { KitchenController } from './services/kitchen/kitchen.controller';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),

		// WebSocket Module for real-time communications
		WebsocketModule,

		ClientsModule.register([
			{
				name: 'IDENTITY_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_IDENTITY_SERVICE || 'localhost',
					port: +process.env.PORT_IDENTITY_SERVICE || 8084,
				},
			},
			{
				name: 'PROFILE_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_PROFILE_SERVICE || 'localhost',
					port: +process.env.PORT_PROFILE_SERVICE || 8081,
				},
			},
			{
				name: 'PRODUCT_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_PRODUCT_SERVICE || 'localhost',
					port: +process.env.PORT_PRODUCT_SERVICE || 8082,
				},
			},
			{
				name: 'TABLE_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_TABLE_SERVICE || 'localhost',
					port: +process.env.PORT_TABLE_SERVICE || 8083,
				},
			},
			{
				name: 'ORDER_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_ORDER_SERVICE || 'localhost',
					port: +process.env.PORT_ORDER_SERVICE || 8087,
				},
			},
			{
				name: 'NOTIFICATION_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_NOTIFICATION_SERVICE || 'localhost',
					port: +process.env.PORT_NOTIFICATION_SERVICE || 8085,
				},
			},
			{
				name: 'WAITER_SERVICE',
				transport: Transport.TCP, // ✅ Đổi thành TCP
				options: {
					host: process.env.HOST_WAITER_SERVICE || 'localhost',
					port: +process.env.PORT_WAITER_SERVICE || 8088,
				},
			},
			{
				name: 'KITCHEN_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_KITCHEN_SERVICE || 'localhost',
					port: +process.env.PORT_KITCHEN_SERVICE || 8086,
				},
			},
		]),
	],
	controllers: [
		HealthController,
		AppController,
		IdentityController,
		ProfileController,
		TableController,
		FloorController,
		ProductController,
		NotificationController,
		OrderController,
		CartController,
		WaiterController,
		KitchenController,
	],
	providers: [AppService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(LoggerMiddleware, PublicUrlMiddleware, RateLimitMiddleware)
			.forRoutes('*');
	}
}
