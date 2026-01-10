import {
	IsString,
	IsNotEmpty,
	IsNumber,
	Min,
	IsUUID,
	IsOptional,
	IsArray,
} from 'class-validator';

export class AddToCartDto {
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
	price: number;

	@IsArray()
	@IsOptional()
	modifiers?: any[]; // Lưu JSON modifiers

	@IsString()
	@IsOptional()
	notes?: string;
}
