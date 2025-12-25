import { CategoryStatus } from 'src/common/enums';
export declare class UpdateCategoryStatusRequestDto {
    categoryId: string;
    tenantId: string;
    status: CategoryStatus | string;
    productApiKey: string;
}
