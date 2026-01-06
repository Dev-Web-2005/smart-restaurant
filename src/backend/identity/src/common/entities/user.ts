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

	@Column({ nullable: false })
	password: string;

	@Column({ nullable: true })
	ownerId?: string;

	@Column({ default: false })
	isGoogleLogin: boolean;

	@Column({ default: true })
	isActive: boolean;

	@Column({ default: false })
	isEmailVerified: boolean;

	@Column({ nullable: true })
	restaurantQrToken?: string;

	@Column({ default: 0 })
	restaurantQrVersion: number;

	@Column({ nullable: true, type: 'timestamptz' })
	restaurantQrGeneratedAt?: Date;

	@ManyToMany(() => Role, (role) => role.users, { cascade: true })
	@JoinTable()
	roles: Role[];
}
