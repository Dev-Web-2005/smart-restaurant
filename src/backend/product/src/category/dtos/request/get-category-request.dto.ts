import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetCategoryRequestDto {
	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
