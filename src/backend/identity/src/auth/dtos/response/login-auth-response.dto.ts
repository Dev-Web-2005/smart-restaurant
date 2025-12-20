export default class LoginAuthResponseDto {
	userId: string;
	username: string;
	email: string;
	roles: string[];
	accessToken: string;
	refreshToken: string;
}
