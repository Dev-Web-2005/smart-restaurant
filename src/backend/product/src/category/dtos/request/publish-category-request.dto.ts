import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class PublishCategoryRequestDto {
	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsBoolean()
	published: boolean;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
