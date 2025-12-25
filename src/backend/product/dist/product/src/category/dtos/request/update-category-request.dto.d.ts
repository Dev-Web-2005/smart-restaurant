import { CategoryStatus } from 'src/common/enums';
export declare class UpdateCategoryRequestDto {
    categoryId: string;
    tenantId: string;
    name?: string;
    description?: string;
    status?: CategoryStatus | string;
    displayOrder?: number;
    productApiKey: string;
}
