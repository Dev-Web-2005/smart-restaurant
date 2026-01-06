import GetRoleResponseDto from 'src/roles/dtos/response/get-role-response.dto';

export class GetUserResponseDto {
	userId: string;
	username: string;
	email?: string;
	isActive?: boolean;
	isEmailVerified?: boolean;
	roles: GetRoleResponseDto[];
}
