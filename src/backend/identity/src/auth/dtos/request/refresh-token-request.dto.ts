import { IsNotEmpty, IsOptional } from 'class-validator';

export class RefreshTokenRequestDto {
	@IsOptional()
	identityApiKey?: string;
}
