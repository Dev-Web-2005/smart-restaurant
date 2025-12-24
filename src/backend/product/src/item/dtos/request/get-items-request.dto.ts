import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetItemsRequestDto {
	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
