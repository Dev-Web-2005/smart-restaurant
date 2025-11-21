import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { IdentityController } from './identity/identity.controller';
@Module({
	imports: [
		ClientsModule.register([
			{
				name: 'IDENTITY_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_IDENTITY_SERVICE || 'localhost',
					port: +process.env.PORT_IDENTITY_SERVICE || 8080,
				},
			},
		]),
	],
	controllers: [AppController, IdentityController],
	providers: [AppService],
})
export class AppModule {}
