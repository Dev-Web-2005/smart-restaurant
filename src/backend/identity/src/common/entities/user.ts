import { Role } from 'src/common/entities/role';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn('uuid')
	userId: string;

	@Column({ unique: true, nullable: false })
	username: string;

	@Column({ nullable: true })
	email?: string;

	@Column({ nullable: true })
	ownerId?: string;

	@Column({ nullable: false })
	password: string;

	@ManyToMany(() => Role, (role) => role.users, { cascade: true })
	@JoinTable()
	roles: Role[];
}
