import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleLoginRequestDto {
	@IsNotEmpty({ message: 'Google ID token is required' })
	@IsString()
	idToken: string; // Google ID token from frontend

	@IsOptional()
	@IsString()
	ownerId?: string; // Optional - for restaurant-specific login
}
