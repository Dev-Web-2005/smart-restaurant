import { FloorDto } from 'src/floors/dtos/response/floor.dto';
import { TableStatus } from 'src/common/enums/table-status.enum';

/**
 * Response DTO for table entity with floor information
 */
export class TableWithFloorDto {
	id: string;
	tenantId: string;
	name: string;
	capacity: number;
	status: TableStatus;
	floorId?: string;
	gridX?: number;
	gridY?: number;
	isActive: boolean;
	tokenVersion: number;
	createdAt: Date;
	updatedAt: Date;
	floor?: FloorDto; // Populated floor information

	constructor(partial: Partial<TableWithFloorDto>) {
		Object.assign(this, partial);
	}
}
