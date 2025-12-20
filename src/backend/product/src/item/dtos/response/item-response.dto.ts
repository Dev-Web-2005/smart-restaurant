export class ModifierResponseDto {
	id: string;
	itemId: string;
	groupName: string;
	label: string;
	priceDelta: number;
	type: string;
}

export class ItemResponseDto {
	id: string;
	tenantId: string;
	categoryId: string;
	name: string;
	description?: string;
	imageUrl?: string;
	price: number;
	currency: string;
	available: boolean;
	published: boolean;
	createdAt: Date;
	modifiers?: ModifierResponseDto[];
}
