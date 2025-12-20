export default class CreateRoleRequestDto {
    name: string;
    description?: string;
    authorities?: string[];
    identityApiKey?: string;
}
