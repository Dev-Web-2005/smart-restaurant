import { IsNotEmpty, IsString, IsUUID, IsOptional, IsArray } from 'class-validator';

/**
 * Request DTO for recalling items (need to remake)
 */
export class RecallItemsRequestDto {
	@IsNotEmpty()
	@IsString()
	kitchenApiKey: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	ticketId: string;

	@IsNotEmpty()
	@IsArray()
	itemIds: string[];

	@IsNotEmpty()
	@IsString()
	reason: string; // Why item needs to be remade
}

/**
 * Request DTO for cancelling items
 */
export class CancelItemsRequestDto {
	@IsNotEmpty()
	@IsString()
	kitchenApiKey: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	ticketId: string;

	@IsNotEmpty()
	@IsArray()
	itemIds: string[];

	@IsOptional()
	@IsString()
	reason?: string;
}

/**
 * Request DTO for cancelling entire ticket
 */
export class CancelTicketRequestDto {
	@IsNotEmpty()
	@IsString()
	kitchenApiKey: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	ticketId: string;

	@IsOptional()
	@IsString()
	reason?: string;
}
