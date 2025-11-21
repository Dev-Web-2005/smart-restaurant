import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
	fullName?: string;
}
