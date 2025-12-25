import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { ModifierGroup } from './modifier-group.entity';

/**
 * MenuItemModifierGroup Entity
 *
 * Join table linking menu items to modifier groups with configuration
 * Allows same modifier group to be attached to multiple items with different settings
 */
@Entity('menu_item_modifier_groups')
export class MenuItemModifierGroup {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	menuItemId: string;

	@Column()
	modifierGroupId: string;

	@Column({ type: 'int', default: 0 })
	displayOrder: number; // Order to show this group for this item

	@Column({ type: 'boolean', default: false })
	isRequired: boolean; // Must customer select at least one option?

	@Column({ type: 'int', default: 0 })
	minSelections: number; // Minimum number of selections (0 = optional)

	@Column({ type: 'int', default: 1 })
	maxSelections: number; // Maximum number of selections (1 = single choice, >1 = multiple)

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@ManyToOne(() => MenuItem, (item) => item.modifierGroups, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'menuItemId' })
	menuItem: MenuItem;

	@ManyToOne(() => ModifierGroup, (group) => group.menuItemGroups, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ name: 'modifierGroupId' })
	modifierGroup: ModifierGroup;
}
