import { Role } from 'src/common/entities/role';
import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

@Entity()
export class Authority {
	@PrimaryColumn()
	name: number;

	@Column({ nullable: true })
	description?: string;

	@Column({ nullable: false, type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@ManyToMany(() => Role, (role) => role.authorities)
	@JoinTable()
	roles: Role[];
}
