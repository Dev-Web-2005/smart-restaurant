/**
 * Photo information in Menu Item response
 */
export class MenuItemPhotoDto {
	id: string;
	url: string;
	isPrimary: boolean;
	displayOrder: number;
}

/**
 * Response DTO for Menu Item
 *
 * Returns status as uppercase string (AVAILABLE, UNAVAILABLE, SOLD_OUT)
 * instead of integer enum value for better API clarity
 */
export class MenuItemResponseDto {
	id: string;
	tenantId: string;
	categoryId: string;
	categoryName?: string; // Populated from relation
	name: string;
	description?: string;
	price: number;
	currency: string;
	prepTimeMinutes?: number;
	status: string; // "AVAILABLE", "UNAVAILABLE", or "SOLD_OUT"
	isChefRecommended: boolean;
	photos?: MenuItemPhotoDto[]; // Photos sorted by isPrimary DESC, displayOrder ASC
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Paginated response for menu items list
 */
export class PaginatedMenuItemsResponseDto {
	items: MenuItemResponseDto[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
