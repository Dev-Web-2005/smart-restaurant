import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for listing tables with optional filters
 */
export class ListTablesDto {
	@IsString()
	tenantId: string;

	@IsBoolean()
	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	isActive?: boolean;

	@IsString()
	@IsOptional()
	location?: string;

	@IsOptional()
	tableApiKey?: string;
}
