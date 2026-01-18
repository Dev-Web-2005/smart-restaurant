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
		400,
	);

	/** Access token or refresh token has expired */
	static readonly TOKEN_EXPIRED: ErrorCode = new ErrorCode(
		1002,
		"Token has expired",
		401,
	);

	/** Token has been blacklisted (usually after logout) */
	static readonly TOKEN_ALREADY_REMOVED: ErrorCode = new ErrorCode(
		1003,
		"Token has already been removed",
		400,
	);

	/** User is not authenticated */
	static readonly UNAUTHORIZED: ErrorCode = new ErrorCode(
		1004,
		"Unauthorized access",
		401,
	);

	/** User lacks required permissions for the action */
	static readonly FORBIDDEN: ErrorCode = new ErrorCode(
		1005,
		"Forbidden - Insufficient permissions",
		403,
	);

	/** Invalid or malformed token */
	static readonly INVALID_TOKEN: ErrorCode = new ErrorCode(
		1006,
		"Invalid or malformed token",
		401,
	);

	static readonly NOT_FOUND_RESOURCE: ErrorCode = new ErrorCode(
		1007,
		"Requested resource not found",
		404,
	);

	// ==================== USER & PROFILE (2000-2999) ====================

	/** User not found in database */
	static readonly USER_NOT_FOUND: ErrorCode = new ErrorCode(
		2001,
		"User not found",
		404,
	);

	/** Attempting to create user with existing username/email */
	static readonly USER_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		2002,
		"User with given username or email already exists",
		409,
	);

	/** User profile not found */
	static readonly PROFILE_NOT_FOUND: ErrorCode = new ErrorCode(
		2003,
		"Profile not found",
		404,
	);

	/** Error communicating with profile service */
	static readonly PROFILE_SERVICE_ERROR: ErrorCode = new ErrorCode(
		2004,
		"Profile service error",
		500,
	);

	static readonly EMAIL_ALREADY_IN_USE: ErrorCode = new ErrorCode(
		2007,
		"Email is already in use",
		409,
	);

	/** User account has been deactivated */
	static readonly USER_ACCOUNT_DEACTIVATED: ErrorCode = new ErrorCode(
		2008,
		"Your account has been deactivated. Please contact administrator.",
		403,
	);

	/** Cannot deactivate own account */
	static readonly CANNOT_DEACTIVATE_SELF: ErrorCode = new ErrorCode(
		2009,
		"Cannot deactivate your own account",
		400,
	);

	// ==================== ROLE & AUTHORITY (2100-2199) ====================

	/** Role not found in system */
	static readonly ROLE_NOT_FOUND: ErrorCode = new ErrorCode(
		2101,
		"Role not found",
		404,
	);

	/** Failed to create new role */
	static readonly ROLE_CREATION_FAILED: ErrorCode = new ErrorCode(
		2102,
		"Role creation failed",
		500,
	);

	/** Authority/Permission not found */
	static readonly AUTHORITY_NOT_FOUND: ErrorCode = new ErrorCode(
		2103,
		"Authority not found",
		404,
	);

	/** Failed to create new authority */
	static readonly AUTHORITY_CREATION_FAILED: ErrorCode = new ErrorCode(
		2104,
		"Authority creation failed",
		500,
	);

	// ==================== VALIDATION (2900-2999) ====================

	/** General validation error for request data */
	static readonly VALIDATION_FAILED: ErrorCode = new ErrorCode(
		2901,
		"Validation failed",
		400,
	);

	// ==================== PRODUCT & MENU (3000-3999) ====================

	/** Menu category not found */
	static readonly CATEGORY_NOT_FOUND: ErrorCode = new ErrorCode(
		3001,
		"Category not found",
		404,
	);

	/** Category name already exists */
	static readonly CATEGORY_NAME_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		3004,
		"Category name already exists in this restaurant",
		409,
	);

	/** Category has active items and cannot be deleted */
	static readonly CATEGORY_HAS_ACTIVE_ITEMS: ErrorCode = new ErrorCode(
		3005,
		"Category has active items and cannot be deleted",
		400,
	);

	/** Menu item not found */
	static readonly ITEM_NOT_FOUND: ErrorCode = new ErrorCode(
		3002,
		"Menu item not found",
		404,
	);

	/** Modifier group not found */
	static readonly MODIFIER_GROUP_NOT_FOUND: ErrorCode = new ErrorCode(
		3006,
		"Modifier group not found",
		404,
	);

	/** Duplicate modifier group name */
	static readonly DUPLICATE_MODIFIER_GROUP_NAME: ErrorCode = new ErrorCode(
		3007,
		"Modifier group with this name already exists",
		409,
	);

	/** Modifier option not found */
	static readonly MODIFIER_OPTION_NOT_FOUND: ErrorCode = new ErrorCode(
		3008,
		"Modifier option not found",
		404,
	);

	/** Modifier group not attached to menu item */
	static readonly MODIFIER_GROUP_NOT_ATTACHED: ErrorCode = new ErrorCode(
		3009,
		"Modifier group is not attached to this menu item",
		404,
	);

	/** Menu item not found (alternative) */
	static readonly MENU_ITEM_NOT_FOUND: ErrorCode = new ErrorCode(
		3010,
		"Menu item not found",
		404,
	);

	/** Deprecated: Modifier not found */
	static readonly MODIFIER_NOT_FOUND: ErrorCode = new ErrorCode(
		3003,
		"Modifier not found",
		404,
	);

	/** Deprecated: Use VALIDATION_FAILED instead */
	static readonly ERROR_VALIDATION: ErrorCode = new ErrorCode(
		2902,
		"Validation error",
		400,
	);

	/** Invalid time/date format provided */
	static readonly INVALID_TIME_FORMAT: ErrorCode = new ErrorCode(
		2903,
		"Invalid time or date format",
		400,
	);

	// ==================== CART (4500-4599) ====================

	/** Cart is empty, cannot proceed with checkout */
	static readonly CART_EMPTY: ErrorCode = new ErrorCode(
		4501,
		"Cart is empty",
		400,
	);

	/** Cart item not found */
	static readonly CART_ITEM_NOT_FOUND: ErrorCode = new ErrorCode(
		4502,
		"Cart item not found",
		404,
	);

	/** Invalid cart operation */
	static readonly INVALID_CART_OPERATION: ErrorCode = new ErrorCode(
		4503,
		"Invalid cart operation",
		400,
	);

	/** Cart has expired or been cleared */
	static readonly CART_EXPIRED: ErrorCode = new ErrorCode(
		4504,
		"Cart has expired or been cleared",
		404,
	);

	/** Invalid quantity for cart item */
	static readonly INVALID_CART_QUANTITY: ErrorCode = new ErrorCode(
		4505,
		"Invalid quantity. Must be greater than 0",
		400,
	);

	/** Menu item not available for cart */
	static readonly MENU_ITEM_NOT_AVAILABLE: ErrorCode = new ErrorCode(
		4506,
		"Menu item is not available",
		400,
	);

	/** Table is not available for ordering */
	static readonly TABLE_NOT_AVAILABLE: ErrorCode = new ErrorCode(
		4507,
		"Table is not available for ordering",
		400,
	);

	/** Cart already has an active order */
	static readonly CART_HAS_ACTIVE_ORDER: ErrorCode = new ErrorCode(
		4508,
		"This table already has an active order",
		400,
	);

	// ==================== PRODUCT & MENU (3000-3999) ====================
	// Reserved for product service

	// ==================== ORDER & TABLE (4000-4999) ====================

	/** Table not found */
	static readonly TABLE_NOT_FOUND: ErrorCode = new ErrorCode(
		4001,
		"Table not found",
		404,
	);

	/** Attempting to create table with existing name for same tenant */
	static readonly TABLE_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		4002,
		"Table with this name already exists",
		409,
	);

	/** Invalid QR token (expired, malformed, or invalidated) */
	static readonly INVALID_QR_TOKEN: ErrorCode = new ErrorCode(
		4003,
		"QR code token is invalid or expired",
		410,
	);

	/** Table is currently occupied/reserved */
	static readonly TABLE_OCCUPIED: ErrorCode = new ErrorCode(
		4004,
		"Table is currently occupied",
		409,
	);

	/** QR code generation failed */
	static readonly QR_GENERATION_FAILED: ErrorCode = new ErrorCode(
		4005,
		"Failed to generate QR code",
		500,
	);

	/** Floor not found */
	static readonly FLOOR_NOT_FOUND: ErrorCode = new ErrorCode(
		4006,
		"Floor not found",
		404,
	);

	/** Attempting to create floor with existing name for same tenant */
	static readonly FLOOR_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		4007,
		"Floor with this name already exists",
		409,
	);

	/** Order not found */
	static readonly ORDER_NOT_FOUND: ErrorCode = new ErrorCode(
		4010,
		"Order not found",
		404,
	);

	/** Invalid order status transition */
	static readonly INVALID_ORDER_STATUS_TRANSITION: ErrorCode = new ErrorCode(
		4011,
		"Invalid order status transition",
		400,
	);

	/** Order already exists for this table session */
	static readonly ORDER_ALREADY_EXISTS: ErrorCode = new ErrorCode(
		4012,
		"An active order already exists for this table",
		409,
	);

	/** Cannot modify completed order */
	static readonly ORDER_ALREADY_COMPLETED: ErrorCode = new ErrorCode(
		4013,
		"Cannot modify a completed order",
		400,
	);

	/** Order items cannot be empty */
	static readonly ORDER_ITEMS_REQUIRED: ErrorCode = new ErrorCode(
		4014,
		"Order must contain at least one item",
		400,
	);

	/** Order item not found */
	static readonly ORDER_ITEM_NOT_FOUND: ErrorCode = new ErrorCode(
		4015,
		"Order item not found",
		404,
	);

	/** Invalid status transition for order item */
	static readonly INVALID_STATUS_TRANSITION: ErrorCode = new ErrorCode(
		4016,
		"Invalid status transition",
		400,
	);

	static readonly ORDER_NOT_PAID: ErrorCode = new ErrorCode(
		4017,
		"Order has not been paid",
		400,
	);

	static readonly INVALID_INPUT: ErrorCode = new ErrorCode(
		409,
		"Invalid input provided",
		400,
	);

	// ==================== WAITER & NOTIFICATION (4600-4699) ====================

	/** Waiter notification not found */
	static readonly NOTIFICATION_NOT_FOUND: ErrorCode = new ErrorCode(
		4601,
		"Notification not found",
		404,
	);

	/** Cannot action already processed notification */
	static readonly NOTIFICATION_ALREADY_PROCESSED: ErrorCode = new ErrorCode(
		4602,
		"Notification has already been processed",
		400,
	);

	/** Notification has expired */
	static readonly NOTIFICATION_EXPIRED: ErrorCode = new ErrorCode(
		4603,
		"Notification has expired",
		410,
	);

	/** Invalid notification status */
	static readonly INVALID_NOTIFICATION_STATUS: ErrorCode = new ErrorCode(
		4604,
		"Invalid notification status",
		400,
	);

	/** Waiter not assigned to notification */
	static readonly WAITER_NOT_ASSIGNED: ErrorCode = new ErrorCode(
		4605,
		"Waiter is not assigned to this notification",
		403,
	);

	// ==================== KITCHEN (4700-4799) ====================

	/** Kitchen ticket not found */
	static readonly KITCHEN_TICKET_NOT_FOUND: ErrorCode = new ErrorCode(
		4701,
		"Kitchen ticket not found",
		404,
	);

	/** Kitchen ticket item not found */
	static readonly KITCHEN_TICKET_ITEM_NOT_FOUND: ErrorCode = new ErrorCode(
		4702,
		"Kitchen ticket item not found",
		404,
	);

	/** Invalid kitchen ticket status transition */
	static readonly INVALID_KITCHEN_TICKET_STATUS: ErrorCode = new ErrorCode(
		4703,
		"Invalid kitchen ticket status transition",
		400,
	);

	/** Invalid kitchen item status transition */
	static readonly INVALID_KITCHEN_ITEM_STATUS: ErrorCode = new ErrorCode(
		4704,
		"Invalid kitchen item status transition",
		400,
	);

	/** Kitchen ticket already completed */
	static readonly KITCHEN_TICKET_ALREADY_COMPLETED: ErrorCode = new ErrorCode(
		4705,
		"Kitchen ticket is already completed",
		400,
	);

	/** Kitchen ticket already cancelled */
	static readonly KITCHEN_TICKET_ALREADY_CANCELLED: ErrorCode = new ErrorCode(
		4706,
		"Kitchen ticket is already cancelled",
		400,
	);

	/** Items not ready for bump */
	static readonly KITCHEN_ITEMS_NOT_READY: ErrorCode = new ErrorCode(
		4707,
		"All items must be ready before bumping ticket",
		400,
	);

	/** Recall reason required */
	static readonly KITCHEN_RECALL_REASON_REQUIRED: ErrorCode = new ErrorCode(
		4708,
		"Recall reason is required",
		400,
	);

	/** Kitchen service error */
	static readonly KITCHEN_SERVICE_ERROR: ErrorCode = new ErrorCode(
		4709,
		"Kitchen service error",
		500,
	);

	// ==================== PAYMENT (5000-5999) ====================
	// Reserved for payment service

	// ==================== NOTIFICATION (6000-6999) ====================
	// Reserved for notification service
	/** Failed to send email */
	static readonly SENDMAIL_FAILED: ErrorCode = new ErrorCode(
		6001,
		"Failed to send email",
		500,
	);
	/** Base64 string is undefined or invalid */
	static readonly DONT_CONVERT_BASE64: ErrorCode = new ErrorCode(
		6002,
		"Cannot convert undefined or invalid Base64 string",
		400,
	);
	/** Error communicating with notification service */
	static readonly NOTIFICATION_SERVICE_ERROR: ErrorCode = new ErrorCode(
		6003,
		"Notification service error",
		500,
	);

	/** Email verification code expired */
	static readonly VERIFICATION_CODE_EXPIRED: ErrorCode = new ErrorCode(
		6004,
		"Verification code has expired",
		400,
	);

	/** Email verification code invalid */
	static readonly VERIFICATION_CODE_INVALID: ErrorCode = new ErrorCode(
		6005,
		"Invalid verification code",
		400,
	);

	/** Email already verified */
	static readonly EMAIL_ALREADY_VERIFIED: ErrorCode = new ErrorCode(
		6006,
		"Email is already verified",
		400,
	);

	/** User has no email to verify */
	static readonly USER_NO_EMAIL: ErrorCode = new ErrorCode(
		6007,
		"User does not have an email address",
		400,
	);

	/** User account is inactive */
	static readonly USER_INACTIVE: ErrorCode = new ErrorCode(
		2005,
		"User account is inactive",
		403,
	);

	/** Cannot delete user with USER role (restaurant owner) */
	static readonly CANNOT_DELETE_OWNER: ErrorCode = new ErrorCode(
		2006,
		"Cannot delete restaurant owner account",
		403,
	);

	// ==================== SYSTEM & INFRASTRUCTURE (9000-9999) ====================

	/** Unexpected server error */
	static readonly INTERNAL_SERVER_ERROR: ErrorCode = new ErrorCode(
		9001,
		"Internal server error",
		500,
	);

	/** Service unavailable or degraded */
	static readonly SERVICE_UNAVAILABLE: ErrorCode = new ErrorCode(
		9002,
		"Service temporarily unavailable",
		503,
	);

	/** Database connection or query error */
	static readonly DATABASE_ERROR: ErrorCode = new ErrorCode(
		9003,
		"Database error occurred",
		500,
	);

	// ==================== CONSTRUCTOR ====================

	constructor(
		public readonly code: number,
		public readonly message: string,
		public readonly httpStatus?: number,
	) {
		this.code = code;
		this.message = message;
		this.httpStatus = httpStatus;
	}
}
