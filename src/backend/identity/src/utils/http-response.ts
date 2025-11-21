export default class HttpResponse {
	code: number;
	message: string;
	data?: any;
	constructor(code: number, message: string, data?: any) {
		this.code = code;
		this.message = message;
		this.data = data;
	}

	toJSON(): string {
		const omitNullData = {};
		for (const key of this.data) {
			if (this.data[key] !== null || this.data[key] !== undefined) {
				omitNullData[key] = this.data[key];
			}
		}

		return JSON.stringify({
			code: this.code,
			message: this.message,
			data: omitNullData,
		});
	}
}
