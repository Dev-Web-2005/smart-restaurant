export class ToggleUserStatusRequestDto {
	userId: string;
	isActive: boolean;
	identityApiKey?: string;
}
