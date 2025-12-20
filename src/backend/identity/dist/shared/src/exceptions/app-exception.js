"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppException extends Error {
    errorCode;
    constructor(errorCode) {
        super(errorCode.message);
        this.errorCode = errorCode;
        this.name = "AppException";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppException);
        }
    }
    getErrorCode() {
        return this.errorCode;
    }
    getHttpStatus() {
        return this.errorCode.httpStatus || 500;
    }
    getCode() {
        return this.errorCode.code;
    }
    getMessage() {
        return this.errorCode.message;
    }
    toJSON() {
        return {
            code: this.errorCode.code,
            message: this.errorCode.message,
            httpStatus: this.errorCode.httpStatus,
        };
    }
}
exports.default = AppException;
//# sourceMappingURL=app-exception.js.map