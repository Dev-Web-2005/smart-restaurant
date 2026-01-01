import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../../../common/enums/order-status.enum';

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

	@IsEnum(OrderStatus)
	@IsNotEmpty()
	status: OrderStatus;

	@IsUUID()
	@IsOptional()
	waiterId?: string; // Waiter performing the action

	@IsString()
	@IsOptional()
	rejectionReason?: string; // Required if status is REJECTED
}
