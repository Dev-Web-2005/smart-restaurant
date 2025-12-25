import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CategoryStatus } from 'src/common/enums';

export enum CategorySortBy {
	DISPLAY_ORDER = 'displayOrder',
	NAME = 'name',
	CREATED_AT = 'createdAt',
}

export enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}

export class GetCategoriesRequestDto {
	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsOptional()
	@IsString({ message: 'Status must be a string' })
	@IsIn(['ACTIVE', 'INACTIVE', 'active', 'inactive'], {
		message: 'Status must be either ACTIVE or INACTIVE',
	})
	status?: CategoryStatus | string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsEnum(CategorySortBy)
	sortBy?: CategorySortBy;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
