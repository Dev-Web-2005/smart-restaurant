import { MenuItem } from './menu-item.entity';
import { CategoryStatus } from '../enums';
export declare class MenuCategory {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    status: CategoryStatus;
    displayOrder: number;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    items: MenuItem[];
}
