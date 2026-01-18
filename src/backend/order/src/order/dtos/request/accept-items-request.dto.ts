import { IsNotEmpty, IsString, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

/**
 * Request DTO for waiter to accept order items
 *
 * ITEM-CENTRIC ARCHITECTURE:
 * - Waiter actions operate directly on Order Service
 * - Can accept specific items, not entire notifications
 * - Notifications are decoupled from business logic
 *
 * Business Flow:
 * 1. Waiter sees notification (alert layer)
 * 2. Waiter decides which items to accept
 * 3. Waiter calls orders:accept-items RPC directly
 * 4. Order Service updates item status → emits to Kitchen
 */
export class AcceptItemsRequestDto {
	@IsNotEmpty()
	@IsString()
	orderApiKey: string;

	@IsNotEmpty()
	@IsUUID()
	orderId: string;

	@IsNotEmpty()
	@IsArray()
	@ArrayNotEmpty()
	itemIds: string[]; // Specific items to accept (granular control)

	@IsNotEmpty()
	@IsUUID()
	waiterId: string; // Waiter who accepts

	@IsNotEmpty()
	@IsString()
	tenantId: string; // Restaurant identifier
}
