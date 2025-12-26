import {
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Length,
	Min,
} from 'class-validator';
import { CategoryStatus } from 'src/common/enums';

export class CreateCategoryRequestDto {
	@IsNotEmpty({ message: 'Tenant ID must not be empty' })
	@IsUUID('4', { message: 'Tenant ID must be a valid UUID' })
	tenantId: string;

	@IsString({ message: 'Name of the category must be a string' })
	@IsNotEmpty({ message: 'Name of the category must not be empty' })
	@Length(2, 50, { message: 'Category name must be between 2 and 50 characters' })
	name: string;

	@IsOptional()
	@IsString({ message: 'Description must be a string' })
	description?: string;

	@IsOptional()
	@IsString({ message: 'Status must be a string' })
	@IsIn(['ACTIVE', 'INACTIVE', 'active', 'inactive'], {
		message: 'Status must be either ACTIVE or INACTIVE',
	})
	status?: CategoryStatus | string;

	@IsOptional()
	@IsInt({ message: 'Display order must be an integer' })
	@Min(0, { message: 'Display order must be a non-negative integer' })
	displayOrder?: number;

	@IsOptional()
	@IsString({ message: 'Image URL must be a string' })
	imageUrl?: string;

	@IsNotEmpty({ message: 'Product API key must not be empty' })
	@IsString({ message: 'Product API key must be a string' })
	productApiKey: string;
}
