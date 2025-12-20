import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport, RpcException } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import ErrorCode from '@shared/exceptions/error-code';
import { GlobalExceptionFilter } from 'src/common/filters/global-exception/global-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const port = parseInt(process.env.PORT, 10);
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.TCP,
		options: {
			port: port,
		},
	});

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			exceptionFactory: (errors) => {
				const messages = errors.map((err) => {
					return {
						[err.property]: Object.values(err.constraints),
					};
				});
				throw new RpcException({
					code: ErrorCode.VALIDATION_FAILED.code,
					message: 'Validation failed',
					status: ErrorCode.VALIDATION_FAILED.httpStatus,
					errors: messages,
				});
			},
		}),
	);

	app.useGlobalFilters(new GlobalExceptionFilter());

	await app.startAllMicroservices();
	console.log(`Identity Service is running on TCP port ${port}`);

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
