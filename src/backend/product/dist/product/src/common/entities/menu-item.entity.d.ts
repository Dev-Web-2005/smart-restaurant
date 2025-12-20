import { MenuCategory } from './menu-category.entity';
import { ModifierOption } from './modifier-option.entity';
export declare class MenuItem {
    id: string;
    tenantId: string;
    categoryId: string;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    currency: string;
    available: boolean;
    published: boolean;
    createdAt: Date;
    category: MenuCategory;
    modifiers: ModifierOption[];
}
