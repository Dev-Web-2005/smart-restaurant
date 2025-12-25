import { ModifierGroup } from './modifier-group.entity';
export declare class ModifierOption {
    id: string;
    modifierGroupId: string;
    label: string;
    priceDelta: number;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    group: ModifierGroup;
}
