import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsEnum,
	IsNumber,
	Min,
	IsUUID,
} from 'class-validator';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

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

	@IsEnum(OrderStatus)
	@IsOptional()
	status?: OrderStatus; // Filter by status

	@IsEnum(PaymentStatus)
	@IsOptional()
	paymentStatus?: PaymentStatus; // Filter by payment status

	@IsUUID()
	@IsOptional()
	waiterId?: string; // Filter by waiter

	// Sorting
	@IsEnum(['createdAt', 'updatedAt', 'total'])
	@IsOptional()
	sortBy?: string; // Field to sort by

	@IsEnum(['ASC', 'DESC'])
	@IsOptional()
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
