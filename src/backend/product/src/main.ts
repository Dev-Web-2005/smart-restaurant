import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { CatchAppExceptionFilter, GlobalExceptionFilter } from './common/filters';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);

	const port = configService.get<number>('PORT') || 8082;

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.TCP,
		options: {
			port: port,
		},
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: false,
			transform: true,
		}),
	);

	app.useGlobalFilters(new GlobalExceptionFilter(), new CatchAppExceptionFilter());

	await app.startAllMicroservices();
	console.log(`Product Service is running on TCP port ${port}`);

	await app.listen(port, '127.0.0.1');
	console.log(`HTTP Health endpoint listening on 127.0.0.1:${port}`);

	process.on('SIGINT', () => {
		console.log('SIGINT received. Shutting down gracefully...');
		app.close().then(() => process.exit(0));
	});
	process.on('SIGTERM', () => {
		console.log('SIGTERM received. Shutting down gracefully...');
		app.close().then(() => process.exit(0));
	});
}
bootstrap()
	.then(() => {
		console.log(`Microservice is running on port ${process.env.PORT}`);
	})
	.catch((err) => {
		console.error('Error starting the microservice', err);
	});
