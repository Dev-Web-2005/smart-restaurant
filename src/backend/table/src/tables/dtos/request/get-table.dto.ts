import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for fetching a single table by ID
 */
export class GetTableDto {
	@IsUUID()
	tableId: string;

	@IsString()
	tenantId: string;

	@IsOptional()
	tableApiKey?: string;

	@IsOptional()
	@IsBoolean()
	includeFloor?: boolean; // Whether to include floor relationship
}
