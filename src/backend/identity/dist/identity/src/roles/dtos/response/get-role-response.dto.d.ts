import GetAuthorityResponseDto from 'src/authorities/dtos/response/get-authority-response.dto';
export default class GetRoleResponseDto {
    name: string;
    description?: string;
    authorities: GetAuthorityResponseDto[];
}
