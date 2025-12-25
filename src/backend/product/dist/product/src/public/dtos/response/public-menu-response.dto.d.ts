export declare class PublicMenuCategoryDto {
    id: string;
    name: string;
    description?: string;
    items: PublicMenuItemDto[];
}
export declare class PublicPhotoDto {
    id: string;
    url: string;
    isPrimary: boolean;
    displayOrder: number;
}
export declare class PublicModifierOptionDto {
    id: string;
    label: string;
    priceDelta: number;
    displayOrder: number;
}
export declare class PublicModifierGroupDto {
    id: string;
    name: string;
    displayOrder: number;
    isRequired: boolean;
    minSelections: number;
    maxSelections: number;
    options: PublicModifierOptionDto[];
}
export declare class PublicMenuItemDto {
    id: string;
    categoryId: string;
    name: string;
    description?: string;
    imageUrl?: string;
    photos?: PublicPhotoDto[];
    price: number;
    currency: string;
    prepTimeMinutes?: number;
    isChefRecommended: boolean;
    status: string;
    modifierGroups: PublicModifierGroupDto[];
}
export declare class GetPublicMenuResponseDto {
    tenantId: string;
    categories: PublicMenuCategoryDto[];
}
export declare class PaginatedPublicMenuResponseDto {
    tenantId: string;
    items: PublicMenuItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
