import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KitchenModule } from './kitchen/kitchen.module';
import { KitchenItem, KitchenItemHistory } from './common/entities';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),

		// TypeORM Database Connection
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				host: configService.get<string>('HOST_DB'),
				port: configService.get<number>('PORT_DB'),
				username: configService.get<string>('USERNAME_DB'),
				password: configService.get<string>('PASSWORD_DB'),
				database: configService.get<string>('DATABASE_DB'),
				entities: [KitchenItem, KitchenItemHistory],
				synchronize: true,
				ssl: configService.get<string>('HOST_DB')?.includes('supabase')
					? { rejectUnauthorized: false }
					: false,
			}),
			inject: [ConfigService],
		}),

		KitchenModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
