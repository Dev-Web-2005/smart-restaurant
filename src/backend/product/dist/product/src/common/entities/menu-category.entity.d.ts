import { MenuItem } from './menu-item.entity';
export declare class MenuCategory {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    published: boolean;
    displayOrder: number;
    createdAt: Date;
    items: MenuItem[];
}
