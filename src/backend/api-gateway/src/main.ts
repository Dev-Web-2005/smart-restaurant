import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express from 'express';
import { RpcExceptionFilter } from './common/filters/rpc-exception.filter';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import CookieParser from 'cookie-parser';
async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Set global prefix nhưng exclude health routes để Render có thể health check
	app.setGlobalPrefix('api/v1', {
		exclude: ['/', 'health'],
	});
	app.use(express.json({ limit: '10mb' }));
	app.use(express.urlencoded({ limit: '10mb', extended: true }));

	// Register exception filters
	app.useGlobalFilters(new RpcExceptionFilter(), new GlobalExceptionFilter());

	// Register interceptors
	app.useGlobalInterceptors(new TransformResponseInterceptor());

	app.enableCors({
		origin: '*',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
		credentials: true,
	});

	// Register Cookie Parser middleware
	app.use(CookieParser());

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
