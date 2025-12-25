"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ErrorCode {
    code;
    message;
    httpStatus;
    static LOGIN_FAILED = new ErrorCode(1001, "Username or password is incorrect", 400);
    static TOKEN_EXPIRED = new ErrorCode(1002, "Token has expired", 401);
    static TOKEN_ALREADY_REMOVED = new ErrorCode(1003, "Token has already been removed", 400);
    static UNAUTHORIZED = new ErrorCode(1004, "Unauthorized access", 401);
    static FORBIDDEN = new ErrorCode(1005, "Forbidden - Insufficient permissions", 403);
    static USER_NOT_FOUND = new ErrorCode(2001, "User not found", 404);
    static USER_ALREADY_EXISTS = new ErrorCode(2002, "User with given username or email already exists", 409);
    static PROFILE_NOT_FOUND = new ErrorCode(2003, "Profile not found", 404);
    static PROFILE_SERVICE_ERROR = new ErrorCode(2004, "Profile service error", 500);
    static ROLE_NOT_FOUND = new ErrorCode(2101, "Role not found", 404);
    static ROLE_CREATION_FAILED = new ErrorCode(2102, "Role creation failed", 500);
    static AUTHORITY_NOT_FOUND = new ErrorCode(2103, "Authority not found", 404);
    static AUTHORITY_CREATION_FAILED = new ErrorCode(2104, "Authority creation failed", 500);
    static VALIDATION_FAILED = new ErrorCode(2901, "Validation failed", 400);
    static CATEGORY_NOT_FOUND = new ErrorCode(3001, "Category not found", 404);
    static CATEGORY_NAME_ALREADY_EXISTS = new ErrorCode(3004, "Category name already exists in this restaurant", 409);
    static CATEGORY_HAS_ACTIVE_ITEMS = new ErrorCode(3005, "Category has active items and cannot be deleted", 400);
    static ITEM_NOT_FOUND = new ErrorCode(3002, "Menu item not found", 404);
    static MODIFIER_NOT_FOUND = new ErrorCode(3003, "Modifier not found", 404);
    static ERROR_VALIDATION = new ErrorCode(2902, "Validation error", 400);
    static INVALID_TIME_FORMAT = new ErrorCode(2903, "Invalid time format", 400);
    static TABLE_NOT_FOUND = new ErrorCode(4001, "Table not found", 404);
    static TABLE_ALREADY_EXISTS = new ErrorCode(4002, "Table with this name already exists", 409);
    static INVALID_QR_TOKEN = new ErrorCode(4003, "QR code token is invalid or expired", 410);
    static TABLE_OCCUPIED = new ErrorCode(4004, "Table is currently occupied", 409);
    static QR_GENERATION_FAILED = new ErrorCode(4005, "Failed to generate QR code", 500);
    static FLOOR_NOT_FOUND = new ErrorCode(4006, "Floor not found", 404);
    static FLOOR_ALREADY_EXISTS = new ErrorCode(4007, "Floor with this name already exists", 409);
    static INTERNAL_SERVER_ERROR = new ErrorCode(9001, "Internal server error", 500);
    static SERVICE_UNAVAILABLE = new ErrorCode(9002, "Service temporarily unavailable", 503);
    static DATABASE_ERROR = new ErrorCode(9003, "Database error occurred", 500);
    constructor(code, message, httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
exports.default = ErrorCode;
//# sourceMappingURL=error-code.js.map