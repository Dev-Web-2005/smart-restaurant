import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetCategoriesRequestDto {
	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
