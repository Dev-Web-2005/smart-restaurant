import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Index,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

/**
 * MenuItemPhoto Entity
 *
 * Stores multiple photos per menu item with support for:
 * - Primary photo designation
 * - Display ordering
 * - Validation metadata (file size, MIME type)
 * - Safe file paths with randomized names
 */
@Entity('menu_item_photos')
@Index(['menuItemId'])
@Index(['menuItemId', 'isPrimary'])
export class MenuItemPhoto {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'menu_item_id' })
	menuItemId: string;

	@Column({ type: 'text' })
	url: string; // Full URL or path to the image file

	@Column({ type: 'text', nullable: true })
	filename: string; // Original filename (for reference)

	@Column({ type: 'boolean', default: false })
	isPrimary: boolean; // Primary photo shown first in guest menu

	@Column({ type: 'int', default: 0 })
	displayOrder: number; // Order for displaying photos

	@Column({ type: 'varchar', length: 50, nullable: true })
	mimeType: string; // e.g., 'image/jpeg', 'image/png', 'image/webp'

	@Column({ type: 'bigint', nullable: true })
	fileSize: number; // File size in bytes

	@CreateDateColumn()
	createdAt: Date;

	@ManyToOne(() => MenuItem, (item) => item.photos, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'menu_item_id' })
	menuItem: MenuItem;
}
