import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateEmailRequestDto {
	@IsNotEmpty({ message: 'username must not be empty' })
	username: string;

	@IsNotEmpty({ message: 'newEmail must not be empty' })
	@IsEmail({}, { message: 'newEmail must be a valid email address' })
	newEmail: string;

	@IsOptional()
	identityApiKey?: string;
}
