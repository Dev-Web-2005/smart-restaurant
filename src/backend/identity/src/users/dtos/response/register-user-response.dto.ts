import GetRoleResponseDto from 'src/roles/dtos/response/get-role-response.dto';
import ChefAccountResponseDto from 'src/users/dtos/response/chef-account-response.dto';
export default class RegisterUserResponseDto {
	userId: string;
	username: string;
	email?: string;
	fullName?: string;
	chefAccount?: ChefAccountResponseDto;
	roles?: GetRoleResponseDto[];
}
