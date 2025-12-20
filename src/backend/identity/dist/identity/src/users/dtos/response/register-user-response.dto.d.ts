import GetRoleResponseDto from 'src/roles/dtos/response/get-role-response.dto';
export default class RegisterUserResponseDto {
    userId: string;
    username: string;
    email?: string;
    fullName?: string;
    roles?: GetRoleResponseDto[];
}
