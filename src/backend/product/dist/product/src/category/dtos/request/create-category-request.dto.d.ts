import { CategoryStatus } from 'src/common/enums';
export declare class CreateCategoryRequestDto {
    tenantId: string;
    name: string;
    description?: string;
    status?: CategoryStatus | string;
    displayOrder?: number;
    imageUrl?: string;
    productApiKey: string;
}
