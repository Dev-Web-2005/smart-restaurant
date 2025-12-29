/**
 * JWT Payload structure
 */
export interface JwtPayload {
	userId: string;
	username: string;
	email: string;
	roles?: string[];
	type?: "access" | "refresh";
	iat?: number;
	exp?: number;
}

/**
 * User information attached to requests
 */
export interface RequestUser {
	userId: string;
	username: string;
	email: string;
	roles?: string[];
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
	page: number;
	limit: number;
	sortBy?: string;
	sortOrder?: "ASC" | "DESC";
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * API Response structure
 */
export class ApiResponse<T = any> {
	code!: number;
	message!: string;
	data?: T;

	constructor(init?: Partial<ApiResponse<T>>) {
		Object.assign(this, init);
	}
}

/**
 * Message pattern
 */
export interface MessagePattern {
	cmd: string;
	data?: any;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
	valid: boolean;
	user?: RequestUser;
	newAccessToken?: string;
}

/**
 * Structure for notification messages
 */
export interface NotificationMessage {
	type: string;
	recipientId?: string;
	payload?: any;
}
