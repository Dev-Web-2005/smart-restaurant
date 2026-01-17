import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity('menu_item_reviews')
export class MenuItemReview {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', name: 'tenant_id' })
	tenantId: string;

	@Column({ type: 'uuid', name: 'menu_item_id' })
	menuItemId: string;

	@Column({ type: 'uuid', name: 'user_id' })
	userId: string;

	@Column({ type: 'varchar', length: 255, name: 'user_name' })
	userName: string;

	@Column({ type: 'int' })
	rating: number; // 1-5 stars

	@Column({ type: 'text', nullable: true })
	comment: string;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;

	// Relations
	@ManyToOne(() => MenuItem)
	@JoinColumn({ name: 'menu_item_id' })
	menuItem: MenuItem;
}
