import ErrorCode from "./error-code";
export default class AppException extends Error {
    private errorCode;
    constructor(errorCode: ErrorCode);
    getErrorCode(): ErrorCode;
    getHttpStatus(): number;
    getCode(): number;
    getMessage(): string;
    toJSON(): {
        code: number;
        message: string;
        httpStatus: number;
    };
}
