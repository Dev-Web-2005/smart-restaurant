import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsNumber,
	Min,
	Max,
	Length,
	IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { menuItemStatusFromString, MenuItemStatus } from 'src/common/enums';

/**
 * DTO for updating an existing menu item
 *
 * All fields except identifiers are optional to allow partial updates
 */
export class UpdateMenuItemRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	categoryId?: string;

	@IsOptional()
	@IsString()
	@Length(2, 80, { message: 'Item name must be between 2 and 80 characters' })
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsNumber()
	@Min(0.01, { message: 'Price must be at least 0.01' })
	@Max(999999, { message: 'Price cannot exceed 999999' })
	price?: number;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsOptional()
	@IsNumber()
	@Min(0, { message: 'Preparation time cannot be negative' })
	@Max(240, { message: 'Preparation time cannot exceed 240 minutes' })
	prepTimeMinutes?: number;

	@IsOptional()
	@IsIn(['AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT', 'available', 'unavailable', 'sold_out'])
	@Transform(({ value }) => menuItemStatusFromString(value))
	status?: MenuItemStatus;

	@IsOptional()
	isChefRecommended?: boolean;

	@IsOptional()
	@IsString()
	imageUrl?: string;
}
