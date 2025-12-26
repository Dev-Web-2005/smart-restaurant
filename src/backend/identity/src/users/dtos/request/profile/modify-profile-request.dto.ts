import { IsOptional } from 'class-validator';

export class ModifyProfileRequestDto {
	@IsOptional()
	userId: string;

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
}
