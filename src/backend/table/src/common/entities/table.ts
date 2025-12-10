import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from 'typeorm';

@Entity('tables')
@Index(['tenantId', 'name'], { unique: true }) // Unique constraint per tenant
export class TableEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	@Index()
	tenantId: string; // Foreign key logic (multi-tenancy isolation)

	@Column({ type: 'varchar', length: 50 })
	name: string; // e.g., "Bàn 1", "VIP 2"

	@Column({ type: 'int', default: 4 })
	capacity: number;

	@Column({ type: 'varchar', nullable: true })
	location: string; // e.g., "Tầng 1", "Sân vườn"

	@Column({ type: 'boolean', default: true })
	isActive: boolean;

	/**
	 * CRITICAL: Token versioning for QR code invalidation
	 * Increment this when regenerating QR codes to invalidate old ones
	 */
	@Column({ type: 'int', default: 1 })
	tokenVersion: number;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
