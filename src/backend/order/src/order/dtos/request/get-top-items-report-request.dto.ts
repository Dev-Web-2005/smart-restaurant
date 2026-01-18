import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsDateString,
	IsNumber,
	Min,
	Max,
} from 'class-validator';

/**
 * DTO for top revenue items report request
 *
 * Returns best-selling items ranked by revenue or quantity
 */
export class GetTopItemsReportRequestDto {
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
	 * Number of top items to return (default: 10, max: 50)
	 */
	@IsNumber()
	@IsOptional()
	@Min(1)
	@Max(50)
	limit?: number;

	/**
	 * Include only specific payment statuses
	 * Default: 'PAID' - only count paid orders
	 */
	@IsString()
	@IsOptional()
	paymentStatus?: string;
}
