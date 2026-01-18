import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express from 'express';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import CookieParser from 'cookie-parser';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// ============================================================
	// RabbitMQ Pub/Sub Configuration
	// Subscribe to order events via Exchange (not direct queue)
	// ============================================================
	const connection = await amqp.connect(process.env.CONNECTION_AMQP);
	const channel = await connection.createChannel();
	const queueName: string = process.env.NAME_QUEUE || 'local_api_gateway';
	const exchangeName = process.env.ORDER_EVENTS_EXCHANGE || 'order_events_exchange';

	try {
		// 1. Create fanout exchange for order events
		await channel.assertExchange(exchangeName, 'fanout', {
			durable: true,
		});
		console.log(`✅ Exchange created: ${exchangeName}`);

		// 2. Setup Dead Letter Queue for failed messages
		await channel.assertExchange(queueName + '_dlx_exchange', 'direct', {
			durable: true,
		});
		await channel.assertQueue(queueName + '_dlq', {
			durable: true,
		});
		await channel.bindQueue(
			queueName + '_dlq',
			queueName + '_dlx_exchange',
			queueName + '_dlq',
		);

		// 3. Setup main queue with DLX configuration
		await channel.assertQueue(queueName + '_queue', {
			durable: true,
			arguments: {
				'x-dead-letter-exchange': queueName + '_dlx_exchange',
				'x-dead-letter-routing-key': queueName + '_dlq',
			},
		});
		console.log(`✅ Queue created: ${queueName}_queue`);

		// 4. Bind queue to exchange (Pub/Sub pattern)
		await channel.bindQueue(queueName + '_queue', exchangeName, '');
		console.log(`✅ Queue bound to exchange: ${queueName}_queue → ${exchangeName}`);
	} finally {
		await channel.close();
		await connection.close();
	}

	// Connect to RabbitMQ microservice (listen to queue)
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

	// Connect to Dead Letter Queue
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

	// Register Cookie Parser middleware
	app.use(CookieParser());
	// Trust proxy - Cách 1: Get Express instance
	const expressApp = app.getHttpAdapter().getInstance();
	expressApp.set('trust proxy', 1); // hoặc true

	// Set global prefix nhưng exclude health routes và QR scan routes
	app.setGlobalPrefix('api/v1', {
		exclude: [
			'/',
			'health',
			// 'tenants/:tenantId/tables/scan/:token', // QR scan endpoint - public, no prefix
		],
	});
	app.use(express.json({ limit: '10mb' }));
	app.use(express.urlencoded({ limit: '10mb', extended: true }));

	// Register exception filters
	app.useGlobalFilters(new RpcExceptionFilter(), new GlobalExceptionFilter());

	// Register interceptors
	app.useGlobalInterceptors(new TransformResponseInterceptor());

	// CORS configuration - allow frontend domain with credentials
	const allowedOrigins = process.env.FRONTEND_URL
		? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
		: [
				'http://localhost:5173',
				'http://localhost:3000',
				'https://web-dev.lethanhcong.site:46268',
			];

	console.log('CORS Allowed Origins:', allowedOrigins);

	app.enableCors({
		origin: (origin, callback) => {
			console.log('📨 Request from origin:', origin);

			// Allow requests with no origin (mobile apps, Postman, etc.)
			if (!origin) {
				console.log('✅ No origin - allowing request');
				return callback(null, true);
			}

			if (allowedOrigins.includes(origin)) {
				console.log('✅ Origin allowed:', origin);
				callback(null, true);
			} else {
				console.log('❌ Origin blocked:', origin);
				console.log('   Allowed origins:', allowedOrigins);
				callback(null, true); // Temporarily allow all to debug
			}
		},
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
		allowedHeaders: 'Content-Type,Authorization,x-api-key',
		exposedHeaders: 'Set-Cookie',
	});

	// Start all microservices
	await app.startAllMicroservices();
	console.log('✅ RabbitMQ microservices started');

	await app.listen(parseInt(process.env.PORT, 10) ?? 8888);

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
		console.log(`API Gateway is running on port ${process.env.PORT || 8888}`);
	})
	.catch((err) => {
		console.error('Error starting API Gateway', err);
	});
