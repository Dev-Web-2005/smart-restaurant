import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	OneToMany,
} from 'typeorm';
import { TableEntity } from './table';

@Entity('floors')
@Index(['tenantId', 'name'], { unique: true }) // Unique constraint per tenant
export class FloorEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	@Index()
	tenantId: string; // Foreign key logic (multi-tenancy isolation)

	@Column({ type: 'varchar', length: 50 })
	name: string; // e.g., "Tầng 1", "Tầng 2", "Sân vườn"

	@Column({ type: 'int', default: 1 })
	floorNumber: number; // Floor ordering/numbering

	@Column({ type: 'int', default: 10 })
	gridWidth: number; // Grid width for layout (number of columns)

	@Column({ type: 'int', default: 10 })
	gridHeight: number; // Grid height for layout (number of rows)

	@Column({ type: 'boolean', default: true })
	isActive: boolean;

	@Column({ type: 'text', nullable: true })
	description: string; // Optional description

	@OneToMany(() => TableEntity, (table) => table.floor)
	tables: TableEntity[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
