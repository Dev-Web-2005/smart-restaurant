import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';

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

	@IsString()
	@IsOptional()
	@MaxLength(255)
	location?: string;

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
