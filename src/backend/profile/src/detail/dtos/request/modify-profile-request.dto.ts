import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class ModifyProfileRequestDto {
	@IsNotEmpty({ message: 'userId should not be empty' })
	@Length(20, 50, { message: 'userId must be between 20 and 50 characters' })
	userId: string;

	@IsOptional()
	profileApiKey?: string;

	@IsOptional()
	birthDay?: Date;

	@IsOptional()
	phoneNumber?: string;

	@IsOptional()
	address?: string;

	@IsOptional()
	restaurantName?: string;

	@IsOptional()
	businessAddress?: string;

	@IsOptional()
	contractNumber?: string;

	@IsOptional()
	contractEmail: string;

	@IsOptional()
	cardHolderName?: string;

	@IsOptional()
	accountNumber?: string;

	@IsOptional()
	expirationDate?: string;

	@IsOptional()
	cvv?: string;

	@IsOptional()
	frontImage?: string;

	@IsOptional()
	backImage?: string;

	@IsOptional()
	imageBackground?: string;

	@IsOptional()
	verified?: boolean;
}
