import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity()
export class MenuCategory {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	tenantId: string;

	@Column({ nullable: false }) // Đảm bảo TypeORM cũng hiểu là không được null
	name: string;

	@Column({ nullable: true })
	description: string;

	@Column({ default: false })
	published: boolean;

	@Column({ default: 0 })
	displayOrder: number;

	@CreateDateColumn()
	createdAt: Date;

	@OneToMany(() => MenuItem, (item) => item.category)
	items: MenuItem[];
}
