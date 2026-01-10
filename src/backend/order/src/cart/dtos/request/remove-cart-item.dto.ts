import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveCartItemDto {
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
}
