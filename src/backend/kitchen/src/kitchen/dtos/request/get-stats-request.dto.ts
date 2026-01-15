import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * Request DTO for getting kitchen statistics
 */
export class GetKitchenStatsRequestDto {
	@IsNotEmpty()
	@IsString()
	kitchenApiKey: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsOptional()
	@IsString()
	dateFrom?: string; // ISO date string

	@IsOptional()
	@IsString()
	dateTo?: string; // ISO date string

	@IsOptional()
	@IsString()
	station?: string; // Filter by station
}
