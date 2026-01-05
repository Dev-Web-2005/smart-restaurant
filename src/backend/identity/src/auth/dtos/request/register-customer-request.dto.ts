import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterCustomerRequestDto {
	@IsNotEmpty({ message: 'username should not be empty' })
	@Length(4, 20, { message: 'username must be between 4 and 20 characters' })
	username: string;

	@IsNotEmpty({ message: 'password should not be empty' })
	@Length(8, 100, { message: 'password must be at least 8 characters long' })
	password: string;

	@IsNotEmpty({ message: 'email should not be empty' })
	@IsEmail({}, { message: 'email must be a valid email address' })
	email: string;

	ownerId?: string;
	identityApiKey?: string;
}
