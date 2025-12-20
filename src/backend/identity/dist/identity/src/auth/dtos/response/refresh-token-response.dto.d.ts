export declare class RefreshTokenResponseDto {
    accessToken: string;
    userId: string;
    username: string;
    email: string;
    roles?: string[];
    constructor(partial: Partial<RefreshTokenResponseDto>);
}
