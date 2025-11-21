export default class ErrorCode {
	static readonly USER_NOT_FOUND: ErrorCode = new ErrorCode(1001, 'User not found');

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
