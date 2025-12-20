import { Authority } from 'src/common/entities/authority';
import { User } from 'src/common/entities/user';
import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';

@Entity()
export class Role {
	@PrimaryColumn()
	name: number;

	@Column({ nullable: true })
	description?: string;

	@Column({ nullable: false, type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@ManyToMany(() => User, (user) => user.roles)
	users: User[];

	@ManyToMany(() => Authority, (authority) => authority.roles, { cascade: true })
	@JoinTable()
	authorities: Authority[];
}
