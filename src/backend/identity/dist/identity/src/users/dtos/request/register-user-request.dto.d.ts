export default class RegisterUserRequestDto {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName?: string;
    roles?: string[];
}
