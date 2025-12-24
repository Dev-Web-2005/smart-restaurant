import { CategoryStatus } from 'src/common/enums';
export declare class CreateCategoryRequestDto {
    tenantId: string;
    name: string;
    description?: string;
    status?: CategoryStatus;
    displayOrder?: number;
    productApiKey: string;
}
