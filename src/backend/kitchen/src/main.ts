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
		await channel.assertExchange('dlx_exchange_kitchen', 'direct', { durable: true });
		await channel.assertQueue('kitchen_dlq', {
			durable: true,
		});

		await channel.bindQueue('kitchen_dlq', 'dlx_exchange_kitchen', 'kitchen_dlq');
		await channel.assertQueue('kitchen_queue', {
			durable: true,
			arguments: {
				'x-dead-letter-exchange': 'dlx_exchange_kitchen',
				'x-dead-letter-routing-key': 'kitchen_dlq',
			},
		});
	} finally {
		await channel.close();
		await connection.close();
	}

	const port = parseInt(process.env.PORT, 10);
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.CONNECTION_AMQP],
			queue: 'kitchen_queue',
			queueOptions: {
				durable: true,
				noAck: false,
				arguments: {
					'x-dead-letter-exchange': 'dlx_exchange_kitchen',
					'x-dead-letter-routing-key': 'kitchen_dlq',
				},
			},
		},
	});

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.CONNECTION_AMQP],
			queue: 'kitchen_dlq',
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
	console.log(`Notification Service is running on port ${port}`);

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
		console.log(`Microservice started successfully`);
	})
	.catch((err) => {
		console.error('Error starting the microservice', err);
		process.exit(1);
	});
