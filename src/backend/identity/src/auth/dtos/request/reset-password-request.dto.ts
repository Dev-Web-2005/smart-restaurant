import { IsNotEmpty, IsString, Length } from 'class-validator';
import { MatchPassword } from 'src/common/decorators/decorator-function/match-password.decorator';

export class ResetPasswordRequestDto {
	@IsNotEmpty({ message: 'resetToken should not be empty' })
	@IsString()
	resetToken: string;

	@IsNotEmpty({ message: 'password should not be empty' })
	@Length(8, 100, { message: 'password must be at least 8 characters long' })
	password: string;

	@IsNotEmpty({ message: 'confirmPassword should not be empty' })
	@Length(8, 100, { message: 'confirmPassword must be at least 8 characters long' })
	@MatchPassword('password', { message: 'confirmPassword do not match password' })
	confirmPassword: string;

	@IsString()
	identityApiKey?: string;
}
