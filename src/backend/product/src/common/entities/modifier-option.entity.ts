import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { ModifierGroup } from './modifier-group.entity';

/**
 * ModifierOption Entity
 *
 * Individual options within a modifier group
 * Example: In "Size" group, options could be "Small", "Medium", "Large"
 */
@Entity('modifier_options')
export class ModifierOption {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	modifierGroupId: string;

	@Column({ nullable: false, length: 100 })
	label: string; // e.g., "Small", "Medium", "Large"

	@Column('decimal', { precision: 10, scale: 2, default: 0 })
	priceDelta: number; // Price adjustment (+2.00, -1.00, 0.00)

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

	@ManyToOne(() => ModifierGroup, (group) => group.options, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'modifierGroupId' })
	group: ModifierGroup;
}
