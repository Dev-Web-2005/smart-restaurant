export class RegisterCustomerResponseDto {
	userId: string;
	username: string;
	email: string;
	roles: string[];
	ownerId?: string;
}
