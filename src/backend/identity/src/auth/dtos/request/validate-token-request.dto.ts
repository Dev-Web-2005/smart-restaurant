import { IsNotEmpty, IsOptional } from 'class-validator';

export class ValidateTokenRequestDto {
	@IsNotEmpty({ message: 'Access token is required' })
	accessToken: string;

	@IsOptional()
	refreshToken?: string;

	@IsOptional()
	identityApiKey?: string;
}
