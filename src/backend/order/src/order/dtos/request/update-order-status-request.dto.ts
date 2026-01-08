import { IsString, IsNotEmpty, IsIn, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for updating order status
 *
 * Business Rules:
 * - Must follow valid status transitions (see ORDER_STATUS_TRANSITIONS)
 * - Rejection requires a reason
 * - Status updates may trigger notifications (to be handled via RabbitMQ)
 */
export class UpdateOrderStatusRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsUUID()
	@IsNotEmpty()
	tenantId: string;

	@IsUUID()
	@IsNotEmpty()
	orderId: string;

	@IsString()
	@IsNotEmpty()
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
	status: string;

	@IsUUID()
	@IsOptional()
	waiterId?: string; // Waiter performing the action

	@IsString()
	@IsOptional()
	rejectionReason?: string; // Required if status is REJECTED
}
