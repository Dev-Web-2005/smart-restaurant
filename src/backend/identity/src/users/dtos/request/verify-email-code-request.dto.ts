export class VerifyEmailCodeRequestDto {
	userId: string;
	code: string;
	identityApiKey?: string;
}
