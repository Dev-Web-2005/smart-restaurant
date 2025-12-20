import GetAuthorityResponseDto from 'src/authorities/dtos/response/get-authority-response.dto';
export default class CreateRoleResponseDto {
    name: string;
    description: string;
    authorities: GetAuthorityResponseDto[];
}
