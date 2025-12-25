import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsEnum,
	IsUUID,
	IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Sort fields for public menu items
 */
export enum PublicMenuSortBy {
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
 * DTO for retrieving public menu with filtering, sorting, and pagination
 *
 * Supports:
 * - Filter by categoryId, chef recommendation
 * - Search by item name
 * - Sort by creation time, price, name, popularity
 * - Pagination
 */
export class GetPublicMenuRequestDto {
	@IsNotEmpty()
	@IsUUID()
	@IsString()
	tenantId: string;

	@IsOptional()
	@IsString()
	categoryId?: string; // Filter by specific category

	@IsOptional()
	@IsString()
	search?: string; // Search by item name (case-insensitive)

	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	isChefRecommended?: boolean; // Filter by chef recommendation

	@IsOptional()
	@IsEnum(PublicMenuSortBy)
	sortBy?: PublicMenuSortBy;

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
