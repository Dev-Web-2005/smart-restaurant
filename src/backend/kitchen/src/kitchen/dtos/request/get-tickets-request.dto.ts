import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * Request DTO for getting kitchen tickets
 */
export class GetTicketsRequestDto {
	@IsNotEmpty()
	@IsString()
	kitchenApiKey: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsOptional()
	@IsString()
	status?: string; // PENDING, IN_PROGRESS, READY, COMPLETED, CANCELLED

	@IsOptional()
	@IsString()
	tableId?: string;

	@IsOptional()
	@IsString()
	station?: string; // Filter by kitchen station

	@IsOptional()
	@IsNumber()
	priority?: number;

	@IsOptional()
	@IsNumber()
	page?: number;

	@IsOptional()
	@IsNumber()
	limit?: number;

	@IsOptional()
	@IsString()
	sortBy?: string; // createdAt, priority, elapsedSeconds

	@IsOptional()
	@IsString()
	sortOrder?: 'ASC' | 'DESC';
}
