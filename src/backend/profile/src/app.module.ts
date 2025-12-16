import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DetailModule } from './detail/detail.module';
import Profile from 'src/common/entities/profile';
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
			entities: [Profile], // add your entity here

			synchronize: true,
		}),

		DetailModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
