import { IsOptional } from 'class-validator';
import RegisterUserRequestDto from 'src/users/dtos/request/register-user-request.dto';

export default class RegisterUserWithProfileRequestDto extends RegisterUserRequestDto {
	@IsOptional()
	identityApiKey?: string;

	@IsOptional()
	userId?: string;

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
	contractEmail?: string;

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
