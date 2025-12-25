import { IsString, IsNotEmpty, IsOptional, IsIn, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { menuItemStatusFromString, MenuItemStatus } from 'src/common/enums';

/**
 * Sort fields for menu items
 */
export enum MenuItemSortBy {
	CREATED_AT = 'createdAt',
	PRICE = 'price',
	NAME = 'name',
	POPULARITY = 'popularity', // Future: based on order count
}

/**
 * Sort order
 */
export enum SortOrder {
	ASC = 'ASC',
	DESC = 'DESC',
}

/**
 * DTO for retrieving menu items with filtering, sorting, and pagination
 *
 * Supports:
 * - Filter by name (contains), category, status
 * - Sort by creation time, price, name, popularity
 * - Pagination
 */
export class GetMenuItemsRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsOptional()
	@IsString()
	categoryId?: string;

	@IsOptional()
	@IsString()
	search?: string; // Search by item name (case-insensitive)

	@IsOptional()
	@IsIn(['AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT', 'available', 'unavailable', 'sold_out'])
	@Transform(({ value }) => (value ? menuItemStatusFromString(value) : undefined))
	status?: MenuItemStatus;

	@IsOptional()
	isChefRecommended?: boolean;

	@IsOptional()
	@IsEnum(MenuItemSortBy)
	sortBy?: MenuItemSortBy;

	@IsOptional()
	@IsEnum(SortOrder)
	sortOrder?: SortOrder;

	@IsOptional()
	@Type(() => Number)
	page?: number;

	@IsOptional()
	@Type(() => Number)
	limit?: number;
}
