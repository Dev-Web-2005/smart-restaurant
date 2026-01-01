import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsArray,
	ValidateNested,
	IsNumber,
	Min,
	IsEnum,
	IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../../../common/enums/order-type.enum';

/**
 * DTO for creating a new order
 *
 * Business Rules:
 * - Order must have at least one item
 * - Table must exist and belong to the same tenant
 * - For dine-in, table should be available or occupied
 * - Customer can be a guest (customerId optional) or registered user
 */
export class CreateOrderRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string; // API key for authentication

	@IsUUID()
	@IsNotEmpty()
	tenantId: string;

	@IsUUID()
	@IsNotEmpty()
	tableId: string;

	@IsUUID()
	@IsOptional()
	customerId?: string; // Optional for guest orders

	@IsString()
	@IsOptional()
	customerName?: string;

	@IsEnum(OrderType)
	@IsOptional()
	orderType?: OrderType; // Defaults to DINE_IN

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	items: CreateOrderItemDto[];

	@IsString()
	@IsOptional()
	notes?: string; // Special instructions
}

/**
 * DTO for adding an order item
 */
export class CreateOrderItemDto {
	@IsUUID()
	@IsNotEmpty()
	menuItemId: string;

	@IsNumber()
	@Min(1)
	quantity: number;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OrderItemModifierDto)
	@IsOptional()
	modifiers?: OrderItemModifierDto[];

	@IsString()
	@IsOptional()
	notes?: string; // Item-specific notes (e.g., "Well done")
}

/**
 * DTO for order item modifier
 */
export class OrderItemModifierDto {
	@IsUUID()
	@IsNotEmpty()
	modifierGroupId: string;

	@IsUUID()
	@IsNotEmpty()
	modifierOptionId: string;
}
