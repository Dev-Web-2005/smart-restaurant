export class PublicMenuCategoryDto {
	id: string;
	name: string;
	description?: string;
	items: PublicMenuItemDto[];
}

export class PublicMenuItemDto {
	id: string;
	categoryId: string;
	name: string;
	description?: string;
	imageUrl?: string; // Primary photo URL
	photos?: PublicPhotoDto[]; // All photos for gallery view
	price: number;
	currency: string;
	prepTimeMinutes?: number;
	isChefRecommended: boolean;
	status: string; // "AVAILABLE", "UNAVAILABLE", or "SOLD_OUT"
	modifiers: PublicModifierDto[];
}

export class PublicPhotoDto {
	id: string;
	url: string;
	isPrimary: boolean;
	displayOrder: number;
}

export class PublicModifierDto {
	id: string;
	groupName: string;
	label: string;
	priceDelta: number;
	type: string;
}

export class GetPublicMenuResponseDto {
	tenantId: string;
	categories: PublicMenuCategoryDto[];
}
