/**
 * Centralized Error Code Registry for Smart Restaurant
 *
 * Error Code Ranges:
 * - 1001-1999: Authentication & Authorization
 * - 2000-2999: User & Profile Management
 * - 3000-3999: Product & Menu
 * - 4000-4999: Order & Table Management
 * - 5000-5999: Payment
 * - 6000-6999: Notification
 * - 9000-9999: System & Infrastructure
 */
export default class ErrorCode {
  // code 1000 is successful api

  // ==================== AUTHENTICATION & AUTHORIZATION (1001-1999) ====================

  /** Invalid credentials provided during login */
  static readonly LOGIN_FAILED: ErrorCode = new ErrorCode(
    1001,
    "Username or password is incorrect",
    401
  );

  /** Access token or refresh token has expired */
  static readonly TOKEN_EXPIRED: ErrorCode = new ErrorCode(
    1002,
    "Token has expired",
    401
  );

  /** Token has been blacklisted (usually after logout) */
  static readonly TOKEN_ALREADY_REMOVED: ErrorCode = new ErrorCode(
    1003,
    "Token has already been removed",
    400
  );

  /** User is not authenticated */
  static readonly UNAUTHORIZED: ErrorCode = new ErrorCode(
    1004,
    "Unauthorized access",
    401
  );

  /** User lacks required permissions for the action */
  static readonly FORBIDDEN: ErrorCode = new ErrorCode(
    1005,
    "Forbidden - Insufficient permissions",
    403
  );

  // ==================== USER & PROFILE (2000-2999) ====================

  /** User not found in database */
  static readonly USER_NOT_FOUND: ErrorCode = new ErrorCode(
    2001,
    "User not found",
    404
  );

  /** Attempting to create user with existing username/email */
  static readonly USER_ALREADY_EXISTS: ErrorCode = new ErrorCode(
    2002,
    "User with given username or email already exists",
    409
  );

  /** User profile not found */
  static readonly PROFILE_NOT_FOUND: ErrorCode = new ErrorCode(
    2003,
    "Profile not found",
    404
  );

  /** Error communicating with profile service */
  static readonly PROFILE_SERVICE_ERROR: ErrorCode = new ErrorCode(
    2004,
    "Profile service error",
    500
  );

  // ==================== ROLE & AUTHORITY (2100-2199) ====================

  /** Role not found in system */
  static readonly ROLE_NOT_FOUND: ErrorCode = new ErrorCode(
    2101,
    "Role not found",
    404
  );

  /** Failed to create new role */
  static readonly ROLE_CREATION_FAILED: ErrorCode = new ErrorCode(
    2102,
    "Role creation failed",
    500
  );

  /** Authority/Permission not found */
  static readonly AUTHORITY_NOT_FOUND: ErrorCode = new ErrorCode(
    2103,
    "Authority not found",
    404
  );

  /** Failed to create new authority */
  static readonly AUTHORITY_CREATION_FAILED: ErrorCode = new ErrorCode(
    2104,
    "Authority creation failed",
    500
  );

  // ==================== VALIDATION (2900-2999) ====================

  /** General validation error for request data */
  static readonly VALIDATION_FAILED: ErrorCode = new ErrorCode(
    2901,
    "Validation failed",
    400
  );

  /** Deprecated: Use VALIDATION_FAILED instead */
  static readonly ERROR_VALIDATION: ErrorCode = new ErrorCode(
    2902,
    "Validation error",
    400
  );

  /** Invalid time/date format provided */
  static readonly INVALID_TIME_FORMAT: ErrorCode = new ErrorCode(
    2903,
    "Invalid time format",
    400
  );

  // ==================== PRODUCT & MENU (3000-3999) ====================
  // Reserved for product service

  // ==================== ORDER & TABLE (4000-4999) ====================
  // Reserved for order and table services

  // ==================== PAYMENT (5000-5999) ====================
  // Reserved for payment service

  // ==================== NOTIFICATION (6000-6999) ====================
  // Reserved for notification service

  // ==================== SYSTEM & INFRASTRUCTURE (9000-9999) ====================

  /** Unexpected server error */
  static readonly INTERNAL_SERVER_ERROR: ErrorCode = new ErrorCode(
    9001,
    "Internal server error",
    500
  );

  /** Service unavailable or degraded */
  static readonly SERVICE_UNAVAILABLE: ErrorCode = new ErrorCode(
    9002,
    "Service temporarily unavailable",
    503
  );

  /** Database connection or query error */
  static readonly DATABASE_ERROR: ErrorCode = new ErrorCode(
    9003,
    "Database error occurred",
    500
  );

  // ==================== CONSTRUCTOR ====================

  constructor(
    public readonly code: number,
    public readonly message: string,
    public readonly httpStatus?: number
  ) {
    this.code = code;
    this.message = message;
    this.httpStatus = httpStatus;
  }
}
