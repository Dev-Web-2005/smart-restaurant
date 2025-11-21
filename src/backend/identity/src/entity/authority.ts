import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Authority {
	@PrimaryColumn()
	name: number;

	@Column({ nullable: true })
	description?: string;
}
