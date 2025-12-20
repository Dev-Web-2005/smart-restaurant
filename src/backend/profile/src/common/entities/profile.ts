import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export default class Profile {
	@PrimaryColumn()
	userId: string;

	@Column({ nullable: true, type: 'timestamp' })
	birthDay: Date;

	@Column({ nullable: true })
	phoneNumber: string;

	@Column({ nullable: true })
	address: string;

	@Column({ nullable: true })
	restaurantName: string;

	@Column({ nullable: true })
	businessAddress: string;

	@Column({ nullable: true })
	contractNumber: string;

	@Column({ nullable: true })
	contractEmail: string;

	@Column({ nullable: true })
	cardHolderName: string;

	@Column({ nullable: true })
	accountNumber: string;

	@Column({ nullable: true })
	expirationDate: string;

	@Column({ nullable: true })
	cvv: string;

	@Column({ nullable: true })
	frontImage: string;

	@Column({ nullable: true })
	backImage: string;

	@Column({ nullable: false, type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;

	@Column({
		nullable: false,
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
		onUpdate: 'CURRENT_TIMESTAMP',
	})
	updatedAt: Date;

	@Column({ nullable: false, default: false })
	verified: boolean;
}
