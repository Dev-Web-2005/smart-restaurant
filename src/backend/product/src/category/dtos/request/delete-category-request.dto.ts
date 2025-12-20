import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteCategoryRequestDto {
	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
