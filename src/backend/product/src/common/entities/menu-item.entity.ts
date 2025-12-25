import {
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { MenuCategory } from './menu-category.entity';
import { MenuItemPhoto } from './menu-item-photo.entity';
import { MenuItemModifierGroup } from './menu-item-modifier-group.entity';
import { MenuItemStatus } from '../enums';

@Entity()
export class MenuItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	tenantId: string;

	@Column()
	categoryId: string;

	@Column({ nullable: false, length: 80 })
	name: string;

	@Column({ nullable: true, type: 'text' })
	description: string;

	@Column('decimal', { precision: 12, scale: 2 })
	price: number;

	@Column({ default: 'VND', length: 10 })
	currency: string;

	@Column({ type: 'int', nullable: true })
	prepTimeMinutes: number;

	@Column({ type: 'int', default: MenuItemStatus.AVAILABLE })
	status: MenuItemStatus;

	@Column({ type: 'boolean', default: false })
	isChefRecommended: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@DeleteDateColumn()
	deletedAt: Date;

	@ManyToOne(() => MenuCategory, (category) => category.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'categoryId' })
	category: MenuCategory;

	@OneToMany(() => MenuItemModifierGroup, (modifierGroup) => modifierGroup.menuItem, {
		cascade: true,
	})
	modifierGroups: MenuItemModifierGroup[];

	@OneToMany(() => MenuItemPhoto, (photo) => photo.menuItem, { cascade: true })
	photos: MenuItemPhoto[];
}
