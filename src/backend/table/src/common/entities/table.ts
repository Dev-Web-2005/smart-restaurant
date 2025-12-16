import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { FloorEntity } from './floor';
import { TableStatus } from '../enums/table-status.enum';

@Entity('tables')
@Index(['tenantId', 'name'], { unique: true }) // Unique constraint per tenant
export class TableEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	@Index()
	tenantId: string; // Foreign key logic (multi-tenancy isolation)

	@Column({ type: 'uuid', nullable: true })
	@Index()
	floorId: string; // Foreign key to floor

	@Column({ type: 'varchar', length: 50 })
	name: string; // e.g., "Bàn 1", "VIP 2"

	@Column({ type: 'int', default: 4 })
	capacity: number;

	@Column({
		type: 'varchar',
		default: TableStatus.AVAILABLE,
	})
	status: TableStatus;

	@Column({ type: 'int', nullable: true })
	gridX: number; // X position on floor grid

	@Column({ type: 'int', nullable: true })
	gridY: number; // Y position on floor grid

	@Column({ type: 'boolean', default: true })
	isActive: boolean;

	@ManyToOne(() => FloorEntity, (floor) => floor.tables, { nullable: true })
	@JoinColumn({ name: 'floorId' })
	floor: FloorEntity;

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
