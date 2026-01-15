import {
	IsNotEmpty,
	IsString,
	IsUUID,
	IsArray,
	IsOptional,
	IsNumber,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for item data in kitchen prepare event
 */
export class KitchenItemDataDto {
	@IsNotEmpty()
	@IsString()
	id: string;

	@IsNotEmpty()
	@IsString()
	menuItemId: string;

	@IsNotEmpty()
	@IsString()
	name: string;

	@IsNotEmpty()
	@IsNumber()
	quantity: number;

	@IsOptional()
	modifiers?: any[];

	@IsOptional()
	@IsString()
	notes?: string;
}

/**
 * Request DTO for incoming kitchen prepare event
 * Sent from Order Service via RabbitMQ when waiter accepts items
 */
export class PrepareItemsEventDto {
	@IsNotEmpty()
	@IsString()
	kitchenApiKey: string; // Security validation

	@IsNotEmpty()
	@IsUUID()
	orderId: string;

	@IsNotEmpty()
	@IsString()
	tableId: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsOptional()
	@IsUUID()
	waiterId?: string;

	@IsNotEmpty()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => KitchenItemDataDto)
	items: KitchenItemDataDto[];

	@IsOptional()
	@IsString()
	orderType?: string;

	@IsOptional()
	@IsString()
	customerName?: string;

	@IsOptional()
	@IsString()
	tableNumber?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	@IsNumber()
	priority?: number; // 0=normal, 1=high, 2=urgent, 3=fire
}
