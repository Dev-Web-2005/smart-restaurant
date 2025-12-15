export class FloorDto {
	id: string;
	tenantId: string;
	name: string;
	floorNumber: number;
	gridWidth: number;
	gridHeight: number;
	isActive: boolean;
	description?: string;
	createdAt: Date;
	updatedAt: Date;

	constructor(partial: Partial<FloorDto>) {
		Object.assign(this, partial);
	}
}
