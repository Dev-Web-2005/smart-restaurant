/**
 * Response DTO for Modifier Option
 */
export class ModifierOptionResponseDto {
	id: string;
	modifierGroupId: string;
	label: string;
	priceDelta: number;
	displayOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Response DTO for Modifier Group
 */
export class ModifierGroupResponseDto {
	id: string;
	tenantId: string;
	name: string;
	description?: string;
	displayOrder: number;
	isActive: boolean;
	options?: ModifierOptionResponseDto[];
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Response DTO for Menu Item Modifier Group (with configuration)
 */
export class MenuItemModifierGroupResponseDto {
	id: string;
	menuItemId: string;
	modifierGroupId: string;
	modifierGroup: ModifierGroupResponseDto;
	displayOrder: number;
	isRequired: boolean;
	minSelections: number;
	maxSelections: number;
	createdAt: Date;
	updatedAt: Date;
}
