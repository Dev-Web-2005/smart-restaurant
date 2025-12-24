import { CategoryStatus } from 'src/common/enums';
export declare enum CategorySortBy {
    DISPLAY_ORDER = "displayOrder",
    NAME = "name",
    CREATED_AT = "createdAt"
}
export declare enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}
export declare class GetCategoriesRequestDto {
    tenantId: string;
    status?: CategoryStatus;
    search?: string;
    sortBy?: CategorySortBy;
    sortOrder?: SortOrder;
    productApiKey: string;
}
