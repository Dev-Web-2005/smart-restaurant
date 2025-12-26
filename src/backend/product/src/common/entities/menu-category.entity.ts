import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { CategoryStatus } from '../enums';

@Entity()
export class MenuCategory {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	tenantId: string;

	@Column({ nullable: false, length: 50 })
	name: string;

	@Column({ nullable: true, type: 'text' })
	description: string;

	@Column({ type: 'int', default: CategoryStatus.ACTIVE })
	status: CategoryStatus;

	@Column({ type: 'int', default: 0 })
	displayOrder: number;

	@Column({ nullable: true, type: 'text' })
	imageUrl: string;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	@DeleteDateColumn()
	deletedAt: Date;

	@OneToMany(() => MenuItem, (item) => item.category)
	items: MenuItem[];
}
