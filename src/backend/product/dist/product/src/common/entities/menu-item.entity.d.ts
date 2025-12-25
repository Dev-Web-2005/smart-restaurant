import { MenuCategory } from './menu-category.entity';
import { ModifierOption } from './modifier-option.entity';
import { MenuItemPhoto } from './menu-item-photo.entity';
import { MenuItemStatus } from '../enums';
export declare class MenuItem {
    id: string;
    tenantId: string;
    categoryId: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    prepTimeMinutes: number;
    status: MenuItemStatus;
    isChefRecommended: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    category: MenuCategory;
    modifiers: ModifierOption[];
    photos: MenuItemPhoto[];
}
