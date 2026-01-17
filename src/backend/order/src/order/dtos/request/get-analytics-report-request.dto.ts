import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

/**
 * DTO for analytics report request
 *
 * Returns chart-friendly data for:
 * - Orders per day/hour
 * - Peak hours analysis
 * - Popular items trends
 * - Revenue trends
 */
export class GetAnalyticsReportRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	/**
	 * Start date (ISO 8601 format: YYYY-MM-DD or full datetime)
	 */
	@IsDateString()
	@IsOptional()
	startDate?: string;

	/**
	 * End date (ISO 8601 format: YYYY-MM-DD or full datetime)
	 */
	@IsDateString()
	@IsOptional()
	endDate?: string;

	/**
	 * Include only specific payment statuses
	 * Default: 'PAID' - only count paid orders
	 */
	@IsString()
	@IsOptional()
	paymentStatus?: string;
}
