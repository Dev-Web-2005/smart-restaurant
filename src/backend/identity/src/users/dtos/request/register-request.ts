import { toJSONIgnoreNullsOrUndefined } from 'src/utils/utils';

export default class RegisterRequest {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
	fullName?: string;
	constructor({
		username,
		email,
		password,
		confirmPassword,
		fullName,
	}: {
		username: string;
		email: string;
		password: string;
		confirmPassword: string;
		fullName?: string;
	}) {
		this.username = username;
		this.email = email;
		this.password = password;
		this.confirmPassword = confirmPassword;
		this.fullName = fullName;
	}

	toJSON(): Record<string, unknown> {
		return toJSONIgnoreNullsOrUndefined({
			username: this.username,
			email: this.email,
			password: this.password,
			confirmPassword: this.confirmPassword,
			fullName: this.fullName,
		});
	}
}
