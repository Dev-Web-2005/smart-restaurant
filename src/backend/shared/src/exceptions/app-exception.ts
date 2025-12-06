import ErrorCode from "./error-code";

/**
 * Base Exception class for Smart Restaurant services
 * Wraps ErrorCode for consistent error handling across all microservices
 */
export default class AppException extends Error {
  private errorCode: ErrorCode;

  constructor(errorCode: ErrorCode) {
    super(errorCode.message);
    this.errorCode = errorCode;
    this.name = "AppException";

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppException);
    }
  }

  getErrorCode(): ErrorCode {
    return this.errorCode;
  }

  /**
   * Get HTTP status code from error
   */
  getHttpStatus(): number {
    return this.errorCode.httpStatus || 500;
  }

  /**
   * Get error code number
   */
  getCode(): number {
    return this.errorCode.code;
  }

  /**
   * Get error message
   */
  getMessage(): string {
    return this.errorCode.message;
  }

  /**
   * Convert to JSON format for API responses
   */
  toJSON() {
    return {
      code: this.errorCode.code,
      message: this.errorCode.message,
      httpStatus: this.errorCode.httpStatus,
    };
  }
}
