import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export default class LoginAuthRequestDto {
	@IsNotEmpty({ message: 'username should not be empty' })
	@Length(4, 20, { message: 'username must be between 4 and 20 characters' })
	username: string;

	@IsNotEmpty({ message: 'password should not be empty' })
	@Length(8, 100, { message: 'password must be at least 8 characters long' })
	password: string;

	@IsOptional()
	identityApiKey?: string;
}
