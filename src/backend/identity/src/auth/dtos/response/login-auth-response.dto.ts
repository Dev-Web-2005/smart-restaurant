export default class LoginAuthResponseDto {
	userId: string;
	username: string;
	email: string;
	roles: string[];
	accessToken: string;
	refreshToken: string;
	ownerId?: string; // For CUSTOMER/STAFF/CHEF - the restaurant owner's userId
}
