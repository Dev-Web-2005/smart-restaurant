import GetRoleResponseDto from 'src/roles/dtos/response/get-role-response.dto';
export declare class GetUserResponseDto {
    userId: string;
    username: string;
    email?: string;
    roles: GetRoleResponseDto[];
}
