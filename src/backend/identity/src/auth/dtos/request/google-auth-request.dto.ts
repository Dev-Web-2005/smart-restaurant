import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthRequestDto {
	@IsNotEmpty({ message: 'Authorization code is required' })
	@IsString()
	code: string;

	@IsOptional()
	@IsString()
	ownerId?: string;

	identityApiKey?: string;
}
