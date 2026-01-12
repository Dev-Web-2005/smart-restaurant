import { IsNotEmpty, IsString, IsUUID, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for order item data in notifications
 */
export class OrderItemDataDto {
	@IsNotEmpty()
	@IsString()
	id: string;

	@IsNotEmpty()
	@IsString()
	menuItemId: string;

	@IsNotEmpty()
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsNotEmpty()
	unitPrice: number;

	@IsNotEmpty()
	quantity: number;

	@IsNotEmpty()
	total: number;

	@IsOptional()
	modifiers?: any[];

	@IsOptional()
	@IsString()
	notes?: string;
}

/**
 * Request DTO for incoming order notification event
 * Sent from Order Service via RabbitMQ when new items are added
 */
export class NewOrderItemsEventDto {
	@IsNotEmpty()
	@IsString()
	waiterApiKey: string; // Security validation

	@IsNotEmpty()
	@IsUUID()
	orderId: string;

	@IsNotEmpty()
	@IsString()
	tableId: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsNotEmpty()
	@IsArray()
	@Type(() => OrderItemDataDto)
	items: OrderItemDataDto[];

	@IsOptional()
	@IsString()
	orderType?: string;

	@IsOptional()
	@IsString()
	customerName?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	priority?: number; // 0=normal, 1=high, 2=urgent
}
