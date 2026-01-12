import {
	IsNotEmpty,
	IsString,
	IsUUID,
	IsArray,
	ArrayNotEmpty,
	MinLength,
} from 'class-validator';

/**
 * Request DTO for waiter to reject order items
 *
 * ITEM-CENTRIC ARCHITECTURE:
 * - Waiter actions operate directly on Order Service
 * - Can reject specific items with reasons
 * - Each item gets its own rejection reason stored in OrderItem entity
 *
 * Business Flow:
 * 1. Waiter sees notification (alert layer)
 * 2. Waiter decides which items to reject
 * 3. Waiter calls orders:reject-items RPC with reason
 * 4. Order Service updates item status → emits to customer notification
 */
export class RejectItemsRequestDto {
	@IsNotEmpty()
	@IsString()
	orderApiKey: string;

	@IsNotEmpty()
	@IsUUID()
	orderId: string;

	@IsNotEmpty()
	@IsArray()
	@ArrayNotEmpty()
	itemIds: string[]; // Specific items to reject (granular control)

	@IsNotEmpty()
	@IsUUID()
	waiterId: string; // Waiter who rejects

	@IsNotEmpty()
	@IsString()
	tenantId: string; // Restaurant identifier

	@IsNotEmpty()
	@IsString()
	@MinLength(5)
	rejectionReason: string; // Required: must provide reason (e.g., "Out of stock")
}
