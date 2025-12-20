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
    price: number;
    currency: string;
    available: boolean;
    modifiers: PublicModifierDto[];
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
