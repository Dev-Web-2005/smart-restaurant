import ErrorCode from 'src/exception/error-code';

export default class AppException extends Error {
	private errorCode: ErrorCode;
	constructor(errorCode: ErrorCode) {
		super(errorCode.message);
		this.errorCode = errorCode;
	}
	getErrorCode(): ErrorCode {
		return this.errorCode;
	}
}
