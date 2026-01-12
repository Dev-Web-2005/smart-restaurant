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
 * Waiter can reject items if ingredients unavailable, table request, etc.
 */
export class RejectOrderItemsRequestDto {
	@IsNotEmpty()
	@IsString()
	waiterApiKey: string;

	@IsNotEmpty()
	@IsUUID()
	notificationId: string;

	@IsNotEmpty()
	@IsUUID()
	orderId: string;

	@IsNotEmpty()
	@IsArray()
	@ArrayNotEmpty()
	itemIds: string[]; // List of order item IDs to reject

	@IsNotEmpty()
	@IsUUID()
	waiterId: string; // Waiter who is rejecting

	@IsNotEmpty()
	@IsString()
	@MinLength(5)
	rejectionReason: string; // Required: must provide reason (e.g., "Ingredient out of stock")
}
