import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IdentityController } from './services/identity/identity.controller';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from 'src/common/middleware/logger/logger.middleware';
import { ProfileController } from './services/profile/profile.controller';
import { RateLimitMiddleware } from 'src/common/middleware/rate-limit/rate-limit.middleware';

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
		]),
	],
	controllers: [AppController, IdentityController, ProfileController],
	providers: [AppService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware, RateLimitMiddleware).forRoutes('*');
	}
}
