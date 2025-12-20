import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity()
export class ModifierOption {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	itemId: string;

	@Column()
	groupName: string;

	@Column()
	label: string;

	@Column('decimal', { default: 0 })
	priceDelta: number;

	@Column({ default: 'single' })
	type: string;

	@ManyToOne(() => MenuItem, (item) => item.modifiers, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'itemId' })
	item: MenuItem;
}
