export interface JwtPayload {
    userId: string;
    username: string;
    email: string;
    roles?: string[];
    type?: "access" | "refresh";
    iat?: number;
    exp?: number;
}
export interface RequestUser {
    userId: string;
    username: string;
    email: string;
    roles?: string[];
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class ApiResponse<T = any> {
    code: number;
    message: string;
    data?: T;
    constructor(init?: Partial<ApiResponse<T>>);
}
export interface MessagePattern {
    cmd: string;
    data?: any;
}
export interface TokenValidationResult {
    valid: boolean;
    user?: RequestUser;
    newAccessToken?: string;
}
