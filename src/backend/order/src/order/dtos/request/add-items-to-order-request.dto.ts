import {
	IsString,
	IsNotEmpty,
	IsArray,
	ValidateNested,
	IsOptional,
	IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-request.dto';

/**
 * DTO for adding items to an existing order
 *
 * Business Rules:
 * - Can only add items to orders in PENDING or ACCEPTED status
 * - Cannot add items to completed/cancelled orders
 * - Items are added to the existing order (single order per table session)
 */
export class AddItemsToOrderRequestDto {
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
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	items: CreateOrderItemDto[];

	@IsString()
	@IsOptional()
	notes?: string; // Additional notes for the new items
}
