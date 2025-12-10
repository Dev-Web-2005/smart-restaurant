/**
 * Response DTO for table entity
 * Matches OpenAPI spec: Table
 */
export class TableDto {
	id: string;
	tenantId: string;
	name: string;
	capacity: number;
	location?: string;
	isActive: boolean;
	tokenVersion: number;
	createdAt: Date;
	updatedAt: Date;

	constructor(partial: Partial<TableDto>) {
		Object.assign(this, partial);
	}
}
