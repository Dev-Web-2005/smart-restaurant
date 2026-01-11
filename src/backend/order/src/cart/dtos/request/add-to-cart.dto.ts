import {
	IsString,
	IsNotEmpty,
	IsNumber,
	Min,
	IsUUID,
	IsOptional,
	IsArray,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for modifier option in cart
 */
export class CartModifierDto {
	@IsUUID()
	@IsNotEmpty()
	modifierGroupId: string;

	@IsUUID()
	@IsNotEmpty()
	modifierOptionId: string;

	@IsString()
	@IsNotEmpty()
	name: string; // Modifier option name (e.g., "Extra cheese", "Large size")

	@IsNumber()
	@Min(0)
	price: number; // Additional price for this modifier
}

export class AddToCartDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	tableId: string;

	@IsString()
	@IsOptional()
	customerId: string; // Có thể để trống cho khách vãng lai

	@IsUUID()
	@IsNotEmpty()
	menuItemId: string;

	@IsString()
	@IsNotEmpty()
	name: string;

	@IsNumber()
	@Min(1)
	quantity: number;

	@IsNumber()
	@Min(0)
	price: number; // Base price of the item (without modifiers)

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CartModifierDto)
	@IsOptional()
	modifiers?: CartModifierDto[]; // Modifiers with prices

	@IsString()
	@IsOptional()
	notes?: string;
}
