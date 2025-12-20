export declare class CreateItemRequestDto {
    tenantId: string;
    categoryId: string;
    name: string;
    description?: string;
    imageUrl?: string;
    price: number;
    currency?: string;
    available?: boolean;
    productApiKey: string;
}
