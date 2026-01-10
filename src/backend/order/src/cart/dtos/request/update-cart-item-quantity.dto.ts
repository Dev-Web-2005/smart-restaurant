import { IsString, IsNotEmpty, IsNumber, Min, IsUUID } from 'class-validator';

export class UpdateCartItemQuantityDto {
	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	tableId: string;

	@IsUUID()
	@IsNotEmpty()
	menuItemId: string;

	@IsNumber()
	@Min(1)
	quantity: number;
}
