import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryRequestDto {
	@IsNotEmpty({ message: 'Tenant ID must not be empty' })
	@IsUUID('4', { message: 'Tenant ID must be a valid UUID' })
	tenantId: string;

	@IsString({ message: 'Name of the category must be a string' })
	@IsNotEmpty({ message: 'Name of the category must not be empty' })
	name: string;

	@IsOptional()
	@IsString({ message: 'Description must be a string' })
	description?: string;

	@IsNotEmpty({ message: 'Product API key must not be empty' })
	@IsString({ message: 'Product API key must be a string' })
	productApiKey: string;
}
