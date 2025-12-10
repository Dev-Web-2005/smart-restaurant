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
	tenantId: string;

	@IsOptional()
	tableApiKey?: string;
}
