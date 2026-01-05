export class GoogleAuthResponseDto {
	userId: string;
	username: string;
	email: string;
	roles: string[];
	accessToken: string;
	refreshToken: string;
	ownerId?: string;
	isGoogleLogin: boolean;
}
