export default class GetAuthorityResponseDto {
    name: string;
    description?: string;
    constructor({ name, description }: {
        name: string;
        description?: string;
    });
}
