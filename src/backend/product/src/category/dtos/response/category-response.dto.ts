export class CategoryResponseDto {
	id: string;
	tenantId: string;
	name: string;
	description?: string;
	status: string; // Returns "ACTIVE" or "INACTIVE"
	displayOrder: number;
	imageUrl?: string;
	itemCount?: number;
	createdAt: Date;
	updatedAt: Date;
}
