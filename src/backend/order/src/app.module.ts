import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from './order/order.module';
import { Order, OrderItem } from './common/entities';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),

		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				host: configService.get('HOST_DB'),
				port: +configService.get('PORT_DB'),
				username: configService.get('USERNAME_DB'),
				password: configService.get('PASSWORD_DB'),
				database: configService.get('DATABASE_DB'),
				entities: [Order, OrderItem],
				synchronize: true,
				logging: false,
			}),
			inject: [ConfigService],
		}),

		OrderModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
