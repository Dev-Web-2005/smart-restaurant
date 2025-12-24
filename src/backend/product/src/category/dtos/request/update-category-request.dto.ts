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
import { Transform } from 'class-transformer';
import { CategoryStatus, categoryStatusFromString } from 'src/common/enums';

export class UpdateCategoryRequestDto {
	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsOptional()
	@IsString()
	@Length(2, 50, { message: 'Category name must be between 2 and 50 characters' })
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString({ message: 'Status must be a string' })
	@IsIn(['ACTIVE', 'INACTIVE', 'active', 'inactive'], {
		message: 'Status must be either ACTIVE or INACTIVE',
	})
	@Transform(({ value }) => (value ? categoryStatusFromString(value) : undefined))
	status?: CategoryStatus;

	@IsOptional()
	@IsInt({ message: 'Display order must be an integer' })
	@Min(0, { message: 'Display order must be a non-negative integer' })
	displayOrder?: number;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
