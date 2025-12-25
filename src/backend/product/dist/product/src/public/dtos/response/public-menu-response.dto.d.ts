export declare class PublicMenuCategoryDto {
    id: string;
    name: string;
    description?: string;
    items: PublicMenuItemDto[];
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
    modifiers: PublicModifierDto[];
}
export declare class PublicPhotoDto {
    id: string;
    url: string;
    isPrimary: boolean;
    displayOrder: number;
}
export declare class PublicModifierDto {
    id: string;
    groupName: string;
    label: string;
    priceDelta: number;
    type: string;
}
export declare class GetPublicMenuResponseDto {
    tenantId: string;
    categories: PublicMenuCategoryDto[];
}
