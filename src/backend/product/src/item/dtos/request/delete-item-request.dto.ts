import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteItemRequestDto {
	@IsNotEmpty()
	@IsUUID()
	itemId: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
