import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemModule } from './item/item.module';
import { TablesModule } from './tables/tables.module';
import { FloorsModule } from './floors/floors.module';
import { QrCodeModule } from './qr-code/qr-code.module';
import { TableEntity } from './common/entities/table';
import { FloorEntity } from './common/entities/floor';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.HOST_DB,
			port: process.env.PORT_DB ? parseInt(process.env.PORT_DB) : 5432,
			username: process.env.USERNAME_DB,
			password: process.env.PASSWORD_DB,
			database: process.env.DATABASE_DB,
			entities: [TableEntity, FloorEntity],
			synchronize: true,
		}),
		ItemModule,
		TablesModule,
		FloorsModule,
		QrCodeModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
