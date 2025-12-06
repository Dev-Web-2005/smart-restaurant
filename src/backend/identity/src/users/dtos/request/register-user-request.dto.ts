import {
	IsArray,
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
} from 'class-validator';
import { MatchPassword } from 'src/common/decorators/decorator-function/match-password.decorator';

export default class RegisterUserRequestDto {
	@IsNotEmpty({ message: 'username should not be empty' })
	@Length(4, 20, { message: 'username must be between 4 and 20 characters' })
	username: string;

	@IsNotEmpty({ message: 'email should not be empty' })
	@IsEmail({}, { message: 'email must be a valid email address' })
	email: string;

	@IsNotEmpty({ message: 'password should not be empty' })
	@Length(8, 100, { message: 'password must be at least 8 characters long' })
	password: string;

	@IsNotEmpty({ message: 'confirmPassword should not be empty' })
	@Length(8, 100, { message: 'confirmPassword must be at least 8 characters long' })
	@MatchPassword('password', { message: 'confirmPassword do not match password' })
	confirmPassword: string;

	@IsOptional()
	@IsString()
	fullName?: string;

	@IsOptional()
	@IsArray()
	roles?: string[];
}
