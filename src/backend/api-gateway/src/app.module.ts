import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IdentityController } from './services/identity/identity.controller';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from 'src/middleware/logger/logger.middleware';
import { JwtConfigModule } from './jwt/jwt.config.module';
import { AddHeaderMiddleware } from 'src/middleware/add-header/add-header.middleware';

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
		]),
		JwtConfigModule,
	],
	controllers: [AppController, IdentityController],
	providers: [AppService],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware, AddHeaderMiddleware).forRoutes('*');
	}
}
