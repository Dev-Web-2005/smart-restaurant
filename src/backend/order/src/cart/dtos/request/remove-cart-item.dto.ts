import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveCartItemDto {
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
	@IsNotEmpty()
	itemKey: string;
}
