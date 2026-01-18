import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KitchenModule } from './kitchen/kitchen.module';
import { KitchenTicket, KitchenTicketItem } from './common/entities';

@Module({
	imports: [
		// 1. Load ConfigModule globally
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),

		// 2. Database connection
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				host: configService.get('HOST_DB'),
				port: parseInt(configService.get('PORT_DB')),
				username: configService.get('USERNAME_DB'),
				password: configService.get('PASSWORD_DB'),
				database: configService.get('DATABASE_DB'),
				entities: [KitchenTicket, KitchenTicketItem],
				synchronize: true, // ONLY for development
				logging: false,
			}),
		}),

		// 3. Kitchen feature module
		KitchenModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
