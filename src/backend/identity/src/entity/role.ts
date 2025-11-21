import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Role {
	@PrimaryColumn()
	name: number;

	@Column({ nullable: true })
	description?: string;
}
