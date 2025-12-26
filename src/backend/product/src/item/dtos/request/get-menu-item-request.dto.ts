import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetMenuItemRequestDto {
	@IsNotEmpty()
	@IsString()
	productApiKey: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	menuItemId: string;
}
