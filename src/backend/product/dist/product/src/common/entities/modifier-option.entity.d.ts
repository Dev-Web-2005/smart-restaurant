import { MenuItem } from './menu-item.entity';
export declare class ModifierOption {
    id: string;
    itemId: string;
    groupName: string;
    label: string;
    priceDelta: number;
    type: string;
    item: MenuItem;
}
