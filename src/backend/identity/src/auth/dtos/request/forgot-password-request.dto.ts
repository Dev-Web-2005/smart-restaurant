import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordRequestDto {
	@IsNotEmpty({ message: 'email should not be empty' })
	@IsEmail({}, { message: 'email must be a valid email address' })
	email: string;

	@IsString()
	identityApiKey?: string;
}
