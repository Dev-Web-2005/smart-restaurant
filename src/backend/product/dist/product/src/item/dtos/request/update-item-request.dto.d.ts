export declare class UpdateItemRequestDto {
    itemId: string;
    tenantId: string;
    name?: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
    available?: boolean;
    productApiKey: string;
}
