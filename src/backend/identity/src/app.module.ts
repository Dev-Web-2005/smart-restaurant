import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entity/user';
import { Authority } from 'src/entity/authority';
import { Role } from 'src/entity/role';
import { ConfigModule } from '@nestjs/config';
import { AuthoritiesModule } from 'src/authorities/authorities.module';

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
			entities: [User, Role, Authority], // add your entity here

			synchronize: true,
		}),
		UsersModule,
		RolesModule,
		AuthoritiesModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
