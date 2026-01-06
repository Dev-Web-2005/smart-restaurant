import { IsNotEmpty, IsOptional } from 'class-validator';

export class CheckEmailRequestDto {
	@IsNotEmpty({ message: 'email must not be empty' })
	email: string;

	@IsOptional()
	identityApiKey?: string;
}
