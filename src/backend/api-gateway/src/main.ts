import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express from 'express';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import cookieParser from 'cookie-parser'; 
async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Register Cookie Parser middleware
	app.use(cookieParser());
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
		: ['http://localhost:5173', 'http://localhost:3000', "https://web-dev.lethanhcong.site:46268"];

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
