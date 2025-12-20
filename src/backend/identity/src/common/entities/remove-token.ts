import { Column, Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class RemoveToken {
	@PrimaryColumn()
	token: string;

	@Column({ nullable: false, type: 'varchar', length: 20 })
	tokenType: 'access' | 'refresh';

	@Column({ nullable: false, type: 'timestamp' })
	expiryDate: Date;

	@CreateDateColumn({ type: 'timestamp' })
	createdAt: Date;

	@Column({ nullable: true, type: 'varchar', length: 255 })
	userId?: string;
}
