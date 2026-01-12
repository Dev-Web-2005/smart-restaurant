import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport, RpcException } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import ErrorCode from '@shared/exceptions/error-code';
import { GlobalExceptionFilter } from './common/filters/global-exception/global-exception.filter';
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const port = parseInt(process.env.PORT, 10) || 8083;

	// Setup RabbitMQ Dead Letter Queue and Exchange for Order Service
	const connection = await amqp.connect(process.env.CONNECTION_AMQP);
	const channel = await connection.createChannel();
	const queueName: string = process.env.QUEUE_NAME_OF_ORDER || 'local_order';

	try {
		// Create Dead Letter Exchange and Queue
		await channel.assertExchange(queueName + '_dlx_exchange', 'direct', {
			durable: true,
		});
		await channel.assertQueue(queueName + '_dlq', {
			durable: true,
		});

		// Bind Dead Letter Queue to Dead Letter Exchange
		await channel.bindQueue(
			queueName + '_dlq',
			queueName + '_dlx_exchange',
			queueName + '_dlq',
		);

		// Create main queue with DLX configuration
		await channel.assertQueue(queueName + '_queue', {
			durable: true,
			arguments: {
				'x-dead-letter-exchange': queueName + '_dlx_exchange',
				'x-dead-letter-routing-key': queueName + '_dlq',
			},
		});
	} finally {
		await channel.close();
		await connection.close();
	}

	// 1. TCP Transport for RPC calls (existing)
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.TCP,
		options: {
			port: port,
		},
	});

	// 2. RabbitMQ Transport for events from other services (Waiter, Kitchen, etc.)
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.CONNECTION_AMQP],
			queue: queueName + '_queue',
			prefetchCount: 1,
			queueOptions: {
				durable: true,
				noAck: false,
				arguments: {
					'x-dead-letter-exchange': queueName + '_dlx_exchange',
					'x-dead-letter-routing-key': queueName + '_dlq',
				},
			},
		},
	});

	// 3. RabbitMQ DLQ listener
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.CONNECTION_AMQP],
			queue: queueName + '_dlq',
			prefetchCount: 1,
			queueOptions: {
				durable: true,
				noAck: false,
			},
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
	console.log(`Order Service is running on TCP port ${port}`);
	console.log(`Order Service RabbitMQ listener active on queue: ${queueName}_queue`);

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
		console.log(`Order Service is running on port ${process.env.PORT}`);
	})
	.catch((err) => {
		console.error('Failed to start Order Service:', err);
		process.exit(1);
	});
