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
		400
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

	/** Invalid or malformed token */
	static readonly INVALID_TOKEN: ErrorCode = new ErrorCode(
		1006,
		"Invalid or malformed token",
		401
	);

	static readonly NOT_FOUND_RESOURCE: ErrorCode = new ErrorCode(
		1007,
		"Requested resource not found",
		404
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

	static readonly EMAIL_ALREADY_IN_USE: ErrorCode = new ErrorCode(
		2007,
		"Email is already in use",
		409
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

	// ==================== PRODUCT & MENU (3000-3999) ====================

	/** Menu category not found */
	static readonly CATEGORY_NOT_FOUND: ErrorCode = new ErrorCode(
		3001,
		"Category not found",
		404
	);

	/** Category name already exists */
	static readonly CATEGORY_NAME_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		3004,
		"Category name already exists in this restaurant",
		409
	);

	/** Category has active items and cannot be deleted */
	static readonly CATEGORY_HAS_ACTIVE_ITEMS: ErrorCode = new ErrorCode(
		3005,
		"Category has active items and cannot be deleted",
		400
	);

	/** Menu item not found */
	static readonly ITEM_NOT_FOUND: ErrorCode = new ErrorCode(
		3002,
		"Menu item not found",
		404
	);

	/** Modifier group not found */
	static readonly MODIFIER_GROUP_NOT_FOUND: ErrorCode = new ErrorCode(
		3006,
		"Modifier group not found",
		404
	);

	/** Duplicate modifier group name */
	static readonly DUPLICATE_MODIFIER_GROUP_NAME: ErrorCode = new ErrorCode(
		3007,
		"Modifier group with this name already exists",
		409
	);

	/** Modifier option not found */
	static readonly MODIFIER_OPTION_NOT_FOUND: ErrorCode = new ErrorCode(
		3008,
		"Modifier option not found",
		404
	);

	/** Modifier group not attached to menu item */
	static readonly MODIFIER_GROUP_NOT_ATTACHED: ErrorCode = new ErrorCode(
		3009,
		"Modifier group is not attached to this menu item",
		404
	);

	/** Menu item not found (alternative) */
	static readonly MENU_ITEM_NOT_FOUND: ErrorCode = new ErrorCode(
		3010,
		"Menu item not found",
		404
	);

	/** Deprecated: Modifier not found */
	static readonly MODIFIER_NOT_FOUND: ErrorCode = new ErrorCode(
		3003,
		"Modifier not found",
		404
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

	/** Table not found */
	static readonly TABLE_NOT_FOUND: ErrorCode = new ErrorCode(
		4001,
		"Table not found",
		404
	);

	/** Attempting to create table with existing name for same tenant */
	static readonly TABLE_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		4002,
		"Table with this name already exists",
		409
	);

	/** Invalid QR token (expired, malformed, or invalidated) */
	static readonly INVALID_QR_TOKEN: ErrorCode = new ErrorCode(
		4003,
		"QR code token is invalid or expired",
		410
	);

	/** Table is currently occupied/reserved */
	static readonly TABLE_OCCUPIED: ErrorCode = new ErrorCode(
		4004,
		"Table is currently occupied",
		409
	);

	/** QR code generation failed */
	static readonly QR_GENERATION_FAILED: ErrorCode = new ErrorCode(
		4005,
		"Failed to generate QR code",
		500
	);

	/** Floor not found */
	static readonly FLOOR_NOT_FOUND: ErrorCode = new ErrorCode(
		4006,
		"Floor not found",
		404
	);

	/** Attempting to create floor with existing name for same tenant */
	static readonly FLOOR_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		4007,
		"Floor with this name already exists",
		409
	);

	/** Order not found */
	static readonly ORDER_NOT_FOUND: ErrorCode = new ErrorCode(
		4010,
		"Order not found",
		404
	);

	/** Invalid order status transition */
	static readonly INVALID_ORDER_STATUS_TRANSITION: ErrorCode = new ErrorCode(
		4011,
		"Invalid order status transition",
		400
	);

	/** Order already exists for this table session */
	static readonly ORDER_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		4012,
		"An active order already exists for this table",
		409
	);

	/** Cannot modify completed order */
	static readonly ORDER_ALREADY_COMPLETED: ErrorCode = new ErrorCode(
		4013,
		"Cannot modify a completed order",
		400
	);

	/** Order items cannot be empty */
	static readonly ORDER_ITEMS_REQUIRED: ErrorCode = new ErrorCode(
		4014,
		"Order must contain at least one item",
		400
	);

	/** Order item not found */
	static readonly ORDER_ITEM_NOT_FOUND: ErrorCode = new ErrorCode(
		4015,
		"Order item not found",
		404
	);

	static readonly CART_EMPTY: ErrorCode = new ErrorCode(
		4016,
		"Cart is empty",
		400
	);

	// ==================== PAYMENT (5000-5999) ====================
	// Reserved for payment service

	// ==================== NOTIFICATION (6000-6999) ====================
	// Reserved for notification service
	/** Failed to send email */
	static readonly SENDMAIL_FAILED: ErrorCode = new ErrorCode(
		6001,
		"Failed to send email",
		500
	);
	/** Base64 string is undefined or invalid */
	static readonly DONT_CONVERT_BASE64: ErrorCode = new ErrorCode(
		6002,
		"Cannot convert undefined or invalid Base64 string",
		400
	);
	/** Error communicating with notification service */
	static readonly NOTIFICATION_SERVICE_ERROR: ErrorCode = new ErrorCode(
		6003,
		"Notification service error",
		500
	);

	/** Email verification code expired */
	static readonly VERIFICATION_CODE_EXPIRED: ErrorCode = new ErrorCode(
		6004,
		"Verification code has expired",
		400
	);

	/** Email verification code invalid */
	static readonly VERIFICATION_CODE_INVALID: ErrorCode = new ErrorCode(
		6005,
		"Invalid verification code",
		400
	);

	/** Email already verified */
	static readonly EMAIL_ALREADY_VERIFIED: ErrorCode = new ErrorCode(
		6006,
		"Email is already verified",
		400
	);

	/** User has no email to verify */
	static readonly USER_NO_EMAIL: ErrorCode = new ErrorCode(
		6007,
		"User does not have an email address",
		400
	);

	/** User account is inactive */
	static readonly USER_INACTIVE: ErrorCode = new ErrorCode(
		2005,
		"User account is inactive",
		403
	);

	/** Cannot delete user with USER role (restaurant owner) */
	static readonly CANNOT_DELETE_OWNER: ErrorCode = new ErrorCode(
		2006,
		"Cannot delete restaurant owner account",
		403
	);

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
