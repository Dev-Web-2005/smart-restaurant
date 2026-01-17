import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';

/**
 * Time range types for revenue reports
 */
export enum ReportTimeRange {
	DAILY = 'DAILY',
	WEEKLY = 'WEEKLY',
	MONTHLY = 'MONTHLY',
	CUSTOM = 'CUSTOM',
}

/**
 * DTO for revenue report request
 *
 * Supports different time ranges:
 * - DAILY: Revenue grouped by day
 * - WEEKLY: Revenue grouped by week
 * - MONTHLY: Revenue grouped by month
 * - CUSTOM: Custom date range with flexible grouping
 */
export class GetRevenueReportRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsEnum(ReportTimeRange)
	@IsNotEmpty()
	timeRange: ReportTimeRange;

	/**
	 * Start date (ISO 8601 format: YYYY-MM-DD or full datetime)
	 * Required for CUSTOM range, optional for others
	 */
	@IsDateString()
	@IsOptional()
	startDate?: string;

	/**
	 * End date (ISO 8601 format: YYYY-MM-DD or full datetime)
	 * Required for CUSTOM range, optional for others
	 */
	@IsDateString()
	@IsOptional()
	endDate?: string;

	/**
	 * Include only specific payment statuses
	 * Default: ['PAID'] - only count paid orders
	 */
	@IsString()
	@IsOptional()
	paymentStatus?: string; // PAID, PENDING, etc.
}
