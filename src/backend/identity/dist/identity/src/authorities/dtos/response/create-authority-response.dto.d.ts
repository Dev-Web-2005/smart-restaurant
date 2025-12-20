export default class CreateAuthorityResponseDto {
    name: string;
    description?: string;
    constructor({ name, description }: {
        name: string;
        description?: string;
    });
}
