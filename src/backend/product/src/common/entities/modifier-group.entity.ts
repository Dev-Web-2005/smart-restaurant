import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { ModifierOption } from './modifier-option.entity';
import { MenuItemModifierGroup } from './menu-item-modifier-group.entity';

/**
 * ModifierGroup Entity
 *
 * Represents a reusable group of modifiers (e.g., "Size", "Extras", "Toppings")
 * Can be attached to multiple menu items
 */
@Entity('modifier_groups')
export class ModifierGroup {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	tenantId: string;

	@Column({ nullable: false, length: 100 })
	name: string; // e.g., "Size", "Extras", "Toppings"

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column({ type: 'int', default: 0 })
	displayOrder: number;

	@Column({ type: 'boolean', default: true })
	isActive: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@DeleteDateColumn()
	deletedAt: Date;

	@OneToMany(() => ModifierOption, (option) => option.group, { cascade: true })
	options: ModifierOption[];

	@OneToMany(() => MenuItemModifierGroup, (itemGroup) => itemGroup.modifierGroup)
	menuItemGroups: MenuItemModifierGroup[];
}
