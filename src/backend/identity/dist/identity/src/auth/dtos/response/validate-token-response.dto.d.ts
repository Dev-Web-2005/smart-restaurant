import { TokenValidationResult } from '@shared/types';
export declare class ValidateTokenResponseDto implements TokenValidationResult {
    valid: boolean;
    user?: {
        userId: string;
        username: string;
        email: string;
        roles: string[];
    };
    newAccessToken?: string;
}
