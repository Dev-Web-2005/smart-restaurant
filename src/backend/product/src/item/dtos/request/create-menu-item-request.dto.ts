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
import { MenuItemStatus } from 'src/common/enums';

/**
 * DTO for creating a new menu item
 *
 * Validation Rules (from Week_MenuManagement.md):
 * - Name: required, 2-80 characters
 * - Price: required, positive (0.01 to 999999)
 * - Preparation time: optional, 0-240 minutes
 * - Category must exist and belong to same restaurant
 * - Status: Available/Unavailable/Sold out
 */
export class CreateMenuItemRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	categoryId: string;

	@IsString()
	@IsNotEmpty()
	@Length(2, 80, { message: 'Item name must be between 2 and 80 characters' })
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsNumber()
	@Min(0.01, { message: 'Price must be at least 0.01' })
	@Max(999999, { message: 'Price cannot exceed 999999' })
	price: number;

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
	status?: MenuItemStatus | string;

	@IsOptional()
	isChefRecommended?: boolean;
}
