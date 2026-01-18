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
	const name: string = process.env.NAME_QUEUE || 'local_waiter';
	const exchangeName = process.env.ORDER_EVENTS_EXCHANGE || 'order_events_exchange';

	try {
		// 1. Create fanout exchange for order events (shared with API Gateway)
		await channel.assertExchange(exchangeName, 'fanout', {
			durable: true,
		});
		console.log(`✅ Exchange created: ${exchangeName}`);

		// 2. Setup Dead Letter Queue
		await channel.assertExchange(name + '_dlx_exchange', 'direct', { durable: true });
		await channel.assertQueue(name + '_dlq', {
			durable: true,
		});
		await channel.bindQueue(name + '_dlq', name + '_dlx_exchange', name + '_dlq');

		// 3. Setup main queue
		await channel.assertQueue(name + '_queue', {
			durable: true,
			arguments: {
				'x-dead-letter-exchange': name + '_dlx_exchange',
				'x-dead-letter-routing-key': name + '_dlq',
			},
		});
		console.log(`✅ Queue created: ${name}_queue`);

		// 4. Bind queue to exchange (Pub/Sub pattern)
		await channel.bindQueue(name + '_queue', exchangeName, '');
		console.log(`✅ Queue bound to exchange: ${name}_queue → ${exchangeName}`);
	} finally {
		await channel.close();
		await connection.close();
	}

	const port = parseInt(process.env.PORT, 10);
	// 1. TCP Transport cho API Gateway RPC calls
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.TCP,
		options: {
			host: '0.0.0.0',
			port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8088, // 8088
		},
	});

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.CONNECTION_AMQP],
			queue: name + '_queue',
			prefetchCount: 1,
			queueOptions: {
				durable: true,
				noAck: false,
				arguments: {
					'x-dead-letter-exchange': name + '_dlx_exchange',
					'x-dead-letter-routing-key': name + '_dlq',
				},
			},
		},
	});

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.CONNECTION_AMQP],
			queue: name + '_dlq',
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

	await app.startAllMicroservices();
	console.log(`Waiter Service is running on port ${port}`);
	console.log(`Microservice is running on port ${port}`);

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
