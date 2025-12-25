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
	imageUrl?: string;
	price: number;
	currency: string;
	available: boolean;
	modifiers: PublicModifierDto[];
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
