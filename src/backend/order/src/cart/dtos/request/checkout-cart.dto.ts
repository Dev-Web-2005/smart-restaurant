import { IsString, IsNotEmpty, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CheckoutCartDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string; // API key for authentication

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	tableId: string;

	@IsUUID()
	@IsOptional()
	customerId?: string; // Optional for guest orders

	@IsString()
	@IsOptional()
	customerName?: string;

	@IsString()
	@IsOptional()
	@IsIn(['DINE_IN', 'TAKEAWAY', 'DELIVERY'])
	orderType?: string; // Defaults to DINE_IN

	@IsString()
	@IsOptional()
	notes?: string; // Special instructions for the entire order
}
