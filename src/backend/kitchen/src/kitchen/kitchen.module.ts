import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KitchenController } from './kitchen.controller';
import { KitchenService } from './kitchen.service';
import { KitchenTicket, KitchenTicketItem } from '../common/entities';

/**
 * KitchenModule
 *
 * Core module for Kitchen Display System (KDS)
 *
 * THIN KITCHEN LAYER ARCHITECTURE:
 * - Kitchen Service is a display-enrichment layer, NOT status owner
 * - Order Service is the single source of truth for item status
 * - Kitchen actions call Order Service RPC to update item status
 * - Kitchen only manages: timers, priority, station assignments, display grouping
 *
 * Flow:
 * 1. Order Service broadcasts order.items.accepted
 * 2. Kitchen receives event, creates display tracking record
 * 3. Cook starts preparing → Kitchen calls Order Service RPC (PREPARING)
 * 4. Cook marks ready → Kitchen calls Order Service RPC (READY)
 * 5. Order Service broadcasts order.items.preparing / order.items.ready
 * 6. All apps receive the same order.items.* events
 *
 * Kitchen-specific features:
 * - Elapsed time timers with color thresholds
 * - Priority management (NORMAL → HIGH → URGENT → FIRE)
 * - Station routing for multi-station kitchens
 * - Ticket grouping by table/order
 * - Statistics and KPI tracking
 */
@Module({
	imports: [
		// 1. Load ConfigModule
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),

		// 2. TypeORM for ticket persistence
		TypeOrmModule.forFeature([KitchenTicket, KitchenTicketItem]),

		// 3. Order Service RPC Client (for updating item status)
		ClientsModule.registerAsync([
			{
				name: 'ORDER_SERVICE',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.TCP,
					options: {
						host: configService.get<string>('HOST_ORDER_SERVICE') || 'localhost',
						port: parseInt(configService.get<string>('PORT_ORDER_SERVICE') || '8087', 10),
					},
				}),
			},
			{
				name: 'TABLE_SERVICE',
				imports: [ConfigModule],
				inject: [ConfigService],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.TCP,
					options: {
						host: configService.get<string>('HOST_TABLE_SERVICE') || 'localhost',
						port: parseInt(configService.get<string>('PORT_TABLE_SERVICE') || '8083', 10),
					},
				}),
			},
		]),
	],
	controllers: [KitchenController],
	providers: [KitchenService],
	exports: [KitchenService],
})
export class KitchenModule {}
