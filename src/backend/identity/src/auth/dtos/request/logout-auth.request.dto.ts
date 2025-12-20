import { IsNotEmpty, IsOptional } from 'class-validator';

export class LogoutAuthRequestDto {
	@IsNotEmpty({ message: 'Access token is required' })
	accessToken: string;

	@IsOptional()
	refreshToken?: string; // Lấy từ cookie

	@IsNotEmpty({ message: 'User ID is required' })
	userId: string;

	@IsOptional()
	identityApiKey?: string;
}
