import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SetPasswordRequestDto {
	@IsNotEmpty({ message: 'userId is required' })
	@IsString()
	userId: string;

	@IsNotEmpty({ message: 'password is required' })
	@Length(8, 100, { message: 'password must be at least 8 characters long' })
	password: string;

	identityApiKey?: string;
}
