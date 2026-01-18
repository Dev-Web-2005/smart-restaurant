export type UserStatusFilter = 'all' | 'active' | 'inactive';

export class GetUsersByRoleRequestDto {
	role: string;
	status?: UserStatusFilter;
	page?: number;
	limit?: number;
	identityApiKey?: string;
}
