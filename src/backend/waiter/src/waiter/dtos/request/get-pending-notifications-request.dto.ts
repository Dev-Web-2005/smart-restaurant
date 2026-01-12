import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

/**
 * Request DTO for getting pending notifications
 * Waiter dashboard uses this to fetch unhandled orders
 */
export class GetPendingNotificationsRequestDto {
	@IsNotEmpty()
	@IsString()
	waiterApiKey: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsOptional()
	@IsString()
	waiterId?: string; // Filter by specific waiter

	@IsOptional()
	@IsString()
	tableId?: string; // Filter by specific table

	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	limit?: number;
}
