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

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		ClientsModule.register([
			{
				name: 'IDENTITY_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_IDENTITY_SERVICE || 'localhost',
					port: +process.env.PORT_IDENTITY_SERVICE || 8080,
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
		]),
	],
	controllers: [
		AppController,
		IdentityController,
		ProfileController,
		TableController,
		FloorController,
		ProductController,
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
