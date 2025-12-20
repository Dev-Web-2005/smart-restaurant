import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { MenuCategory } from './menu-category.entity';
import { ModifierOption } from './modifier-option.entity';

@Entity()
export class MenuItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	tenantId: string;

	@Column()
	categoryId: string;

	@Column()
	name: string;

	@Column({ nullable: true })
	description: string;

	@Column({ nullable: true })
	imageUrl: string;

	@Column('decimal')
	price: number;

	@Column({ default: 'VND' })
	currency: string;

	@Column({ default: true })
	available: boolean;

	@Column({ default: false })
	published: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@ManyToOne(() => MenuCategory, (category) => category.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'categoryId' })
	category: MenuCategory;

	@OneToMany(() => ModifierOption, (modifier) => modifier.item)
	modifiers: ModifierOption[];
}
