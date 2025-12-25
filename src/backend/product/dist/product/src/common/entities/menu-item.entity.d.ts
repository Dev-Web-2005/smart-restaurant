import { MenuCategory } from './menu-category.entity';
import { MenuItemPhoto } from './menu-item-photo.entity';
import { MenuItemModifierGroup } from './menu-item-modifier-group.entity';
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
    modifierGroups: MenuItemModifierGroup[];
    photos: MenuItemPhoto[];
}
