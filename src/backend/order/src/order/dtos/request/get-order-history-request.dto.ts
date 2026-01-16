import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsIn,
	IsNumber,
	Min,
	IsUUID,
} from 'class-validator';

/**
 * DTO for getting customer order history
 *
 * This endpoint returns all orders linked to a specific customer account
 * Only available for logged-in customers (not guest customers)
 */
export class GetOrderHistoryRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsUUID()
	@IsNotEmpty()
	tenantId: string;

	@IsUUID()
	@IsNotEmpty()
	customerId: string; // Required - customer must be logged in

	// Optional filters
	@IsString()
	@IsOptional()
	@IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
	status?: string; // Filter by order status

	@IsString()
	@IsOptional()
	@IsIn(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'])
	paymentStatus?: string; // Filter by payment status

	// Pagination
	@IsNumber()
	@IsOptional()
	@Min(1)
	page?: number; // Default: 1

	@IsNumber()
	@IsOptional()
	@Min(1)
	limit?: number; // Default: 20

	// Sorting
	@IsString()
	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'total'])
	sortBy?: string; // Default: 'createdAt'

	@IsString()
	@IsOptional()
	@IsIn(['ASC', 'DESC'])
	sortOrder?: 'ASC' | 'DESC'; // Default: 'DESC' (newest first)
}
