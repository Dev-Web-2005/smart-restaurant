import { toJSONIgnoreNullsOrUndefined } from 'src/utils/utils';

export default class RegisterResponse {
	userId: string;
	username: string;
	email: string;
	fullName?: string;
	constructor({
		userId,
		username,
		email,
		fullName,
	}: {
		userId: string;
		username: string;
		email: string;
		fullName?: string;
	}) {
		this.userId = userId;
		this.username = username;
		this.email = email;
		this.fullName = fullName;
	}

	toJSON(): Record<string, unknown> {
		return toJSONIgnoreNullsOrUndefined({
			userId: this.userId,
			username: this.username,
			email: this.email,
			fullName: this.fullName,
		});
	}
}
