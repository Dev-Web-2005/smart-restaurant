export class CategoryResponseDto {
	id: string;
	tenantId: string;
	name: string;
	description?: string;
	published: boolean;
	displayOrder: number;
	createdAt: Date;
}
