import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import dotenv from 'dotenv';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
dotenv.config();

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
		transport: Transport.TCP,
		options: {
			port: parseInt(process.env.PORT, 10),
		},
	});

	await app.listen();
}
bootstrap();
