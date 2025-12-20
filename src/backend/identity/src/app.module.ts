import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/common/entities/user';
import { Authority } from 'src/common/entities/authority';
import { Role } from 'src/common/entities/role';
import { ConfigModule } from '@nestjs/config';
import { AuthoritiesModule } from 'src/authorities/authorities.module';
import { AuthModule } from './auth/auth.module';
import { RemoveToken } from 'src/common/entities/remove-token';

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
			entities: [User, Role, Authority, RemoveToken], // add your entity here

			synchronize: true,
		}),
		UsersModule,
		RolesModule,
		AuthoritiesModule,
		AuthModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
