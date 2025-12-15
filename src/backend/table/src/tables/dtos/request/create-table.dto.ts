import { IsString, IsInt, IsOptional, Min, MaxLength, IsEnum } from 'class-validator';
import { TableStatus } from 'src/common/enums/table-status.enum';

/**
 * DTO for creating a new table
 * Matches OpenAPI spec: TableCreate
 */
export class CreateTableDto {
	@IsString()
	@MaxLength(50)
	name: string;

	@IsInt()
	@Min(1)
	capacity: number;

	@IsEnum(TableStatus)
	@IsOptional()
	status?: TableStatus;

	@IsString()
	@IsOptional()
	floorId?: string;

	@IsInt()
	@IsOptional()
	@Min(0)
	gridX?: number;

	@IsInt()
	@IsOptional()
	@Min(0)
	gridY?: number;

	@IsString()
	tenantId: string;

	@IsOptional()
	tableApiKey?: string;
}
