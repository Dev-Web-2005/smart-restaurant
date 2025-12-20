export declare class ModifierOptionDto {
    groupName: string;
    label: string;
    priceDelta: number;
    type: string;
}
export declare class AddModifiersRequestDto {
    itemId: string;
    tenantId: string;
    modifiers: ModifierOptionDto[];
    productApiKey: string;
}
