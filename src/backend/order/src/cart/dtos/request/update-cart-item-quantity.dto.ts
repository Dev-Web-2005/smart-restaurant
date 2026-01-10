import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateCartItemQuantityDto {
	@IsString()
	@IsNotEmpty()
	cartApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	tableId: string;

	@IsString()
	@IsNotEmpty()
	itemKey: string;

	@IsNumber()
	@Min(1)
	quantity: number;
}
