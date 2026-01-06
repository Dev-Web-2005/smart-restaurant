export class GetStaffChefByOwnerRequestDto {
	ownerId: string;
	role?: 'STAFF' | 'CHEF';
	page?: number;
	limit?: number;
	isActive?: boolean;
	identityApiKey?: string;
}
