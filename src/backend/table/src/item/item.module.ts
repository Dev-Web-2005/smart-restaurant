import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

// nameService + Module -> tổng thể -> imports
// nameService + Service -> logic nghiệp vụ -> providers
// nameService + Controller -> điều phối -> controllers

@Module({
	imports: [
		ClientsModule.register([
			{
				name: 'PRODUCT_SERVICE',
				transport: Transport.TCP,
				options: {
					host: process.env.HOST_PRODUCT_SERVICE || 'localhost',
					port: +process.env.PORT_PRODUCT_SERVICE || 8082,
				},
			},
		]),
	],
	providers: [ItemService],
	controllers: [ItemController],
})
export class ItemModule {}
