import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KitchenController } from './kitchen.controller';
import { KitchenService } from './kitchen.service';
import { KitchenItem, KitchenItemHistory } from '../common/entities';

@Module({
	imports: [
		ConfigModule,
		TypeOrmModule.forFeature([KitchenItem, KitchenItemHistory]),

		ClientsModule.registerAsync([
			{
				name: 'ORDER_SERVICE',
				imports: [ConfigModule],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.TCP,
					options: {
						host: configService.get<string>('HOST_ORDER_SERVICE') || 'localhost',
						port: configService.get<number>('PORT_ORDER_SERVICE') || 8087,
					},
				}),
				inject: [ConfigService],
			},
		]),
	],
	controllers: [KitchenController],
	providers: [KitchenService],
	exports: [KitchenService],
})
export class KitchenModule {}
