export declare enum PublicMenuSortBy {
    CREATED_AT = "createdAt",
    PRICE = "price",
    NAME = "name",
    POPULARITY = "popularity"
}
export declare enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}
export declare class GetPublicMenuRequestDto {
    tenantId: string;
    categoryId?: string;
    search?: string;
    isChefRecommended?: boolean;
    sortBy?: PublicMenuSortBy;
    sortOrder?: SortOrder;
    page?: number;
    limit?: number;
}
