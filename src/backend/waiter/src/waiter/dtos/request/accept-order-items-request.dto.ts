import {
	IsNotEmpty,
	IsString,
	IsUUID,
	IsArray,
	ArrayNotEmpty,
	IsOptional,
} from 'class-validator';

/**
 * Request DTO for waiter to accept order items
 * Waiter reviews new items and accepts them to send to kitchen
 */
export class AcceptOrderItemsRequestDto {
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
	itemIds: string[]; // List of order item IDs to accept

	@IsNotEmpty()
	@IsUUID()
	waiterId: string; // Waiter who is accepting

	@IsOptional()
	@IsString()
	notes?: string; // Additional notes from waiter
}
