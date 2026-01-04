import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport, RpcException } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import ErrorCode from '@shared/exceptions/error-code';
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const connection = await amqp.connect(process.env.CONNECTION_AMQP);
	const channel = await connection.createChannel();

	try {
		await channel.assertExchange('dlx_exchange', 'direct', { durable: true });
		await channel.assertQueue('notification_dlq', {
			durable: true,
		});

		await channel.bindQueue('notification_dlq', 'dlx_exchange', 'notification_dlq');

		await channel.assertQueue('notification_queue', {
			durable: true,
			arguments: {
				'x-dead-letter-exchange': 'dlx_exchange',
				'x-dead-letter-routing-key': 'notification_dlq',
			},
		});
	} finally {
		await channel.close();
		await connection.close();
	}

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.CONNECTION_AMQP],
			queue: 'notification_queue',
			prefetchCount: 1,
			queueOptions: {
				durable: true,
				noAck: false,
				arguments: {
					'x-dead-letter-exchange': 'dlx_exchange',
					'x-dead-letter-routing-key': 'notification_dlq',
				},
			},
		},
	});

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.CONNECTION_AMQP],
			queue: 'notification_dlq',
			prefetchCount: 1,
			queueOptions: {
				durable: true,
				noAck: false,
			},
		},
	});

	// TCP transport for synchronous request-response (e.g., TTS API)
	const port = parseInt(process.env.PORT, 10) || 8085;
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

	await app.startAllMicroservices();
	console.log(`Notification Service RMQ is running`);
	console.log(
		`Notification Service TCP is running on port ${parseInt(process.env.PORT, 10) || 8085}`,
	);

	await app.listen(parseInt(process.env.PORT, 10) || 8085, '127.0.0.1');
	console.log(
		`HTTP Health endpoint listening on 127.0.0.1:${parseInt(process.env.PORT, 10) || 8085}`,
	);

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
		console.log(`Microservice started successfully`);
	})
	.catch((err) => {
		console.error('Error starting the microservice', err);
		process.exit(1);
	});
