import { TokenValidationResult } from '@shared/types';

// Re-export TokenValidationResult as ValidateTokenResponseDto for backward compatibility
export class ValidateTokenResponseDto implements TokenValidationResult {
	valid: boolean;
	user?: {
		userId: string;
		username: string;
		email: string;
		roles: string[];
	};
	newAccessToken?: string;
}
