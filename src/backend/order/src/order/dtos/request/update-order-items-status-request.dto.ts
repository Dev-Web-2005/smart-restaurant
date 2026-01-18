import {
	IsString,
	IsNotEmpty,
	IsArray,
	IsUUID,
	IsEnum,
	IsOptional,
} from 'class-validator';
import { OrderItemStatus } from '../../../common/enums/order-item-status.enum';

/**
 * DTO for updating status of specific order items
 *
 * Use Cases:
 * - Kitchen marks items as PREPARING when they start cooking
 * - Kitchen marks items as READY when food is cooked
 * - Waiter marks items as SERVED when delivered to table
 * - Staff can REJECT items if ingredients unavailable
 *
 * Business Rules:
 * - Must validate status transitions (use OrderItemStatusTransitions)
 * - All itemIds must belong to the specified order
 * - Cannot update items in terminal states (SERVED, REJECTED, CANCELLED)
 */
export class UpdateOrderItemsStatusRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsUUID()
	@IsNotEmpty()
	tenantId: string;

	@IsUUID()
	@IsNotEmpty()
	orderId: string;

	@IsArray()
	@IsUUID('4', { each: true })
	itemIds: string[]; // Array of order item IDs to update

	@IsEnum(OrderItemStatus)
	@IsNotEmpty()
	status: OrderItemStatus; // New status for all specified items

	@IsString()
	@IsOptional()
	rejectionReason?: string; // Required if status is REJECTED

	@IsUUID()
	@IsOptional()
	waiterId?: string; // User who performed the action
}
