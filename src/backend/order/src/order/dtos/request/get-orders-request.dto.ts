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
 * DTO for listing orders with filtering, sorting, and pagination
 */
export class GetOrdersRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsUUID()
	@IsNotEmpty()
	tenantId: string;

	// Filtering
	@IsUUID()
	@IsOptional()
	tableId?: string; // Filter by table

	@IsUUID()
	@IsOptional()
	customerId?: string; // Filter by customer

	@IsString()
	@IsOptional()
	@IsIn([
		'PENDING',
		'ACCEPTED',
		'REJECTED',
		'PREPARING',
		'READY',
		'SERVED',
		'COMPLETED',
		'CANCELLED',
	])
	status?: string; // Filter by status

	@IsString()
	@IsOptional()
	@IsIn(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'])
	paymentStatus?: string; // Filter by payment status

	@IsUUID()
	@IsOptional()
	waiterId?: string; // Filter by waiter

	// Sorting
	@IsString()
	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'total'])
	sortBy?: string; // Field to sort by

	@IsString()
	@IsOptional()
	@IsIn(['ASC', 'DESC'])
	sortOrder?: 'ASC' | 'DESC'; // Sort direction

	// Pagination
	@IsNumber()
	@Min(1)
	@IsOptional()
	page?: number;

	@IsNumber()
	@Min(1)
	@IsOptional()
	limit?: number;
}
