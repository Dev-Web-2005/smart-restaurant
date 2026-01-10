import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class RemoveCartItemDto {
	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	tableId: string;

	@IsUUID()
	@IsNotEmpty()
	menuItemId: string;
}
