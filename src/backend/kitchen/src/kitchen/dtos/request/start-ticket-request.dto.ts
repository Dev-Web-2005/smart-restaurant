import { IsNotEmpty, IsString, IsUUID, IsOptional, IsArray } from 'class-validator';

/**
 * Request DTO for starting preparation of a ticket
 * Moves ticket from PENDING → IN_PROGRESS
 */
export class StartTicketRequestDto {
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
	@IsUUID()
	cookId?: string; // Cook claiming the ticket

	@IsOptional()
	@IsString()
	cookName?: string;
}

/**
 * Request DTO for starting preparation of specific items
 * Allows granular item-level tracking
 */
export class StartItemsRequestDto {
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
	@IsUUID()
	cookId?: string;

	@IsOptional()
	@IsString()
	cookName?: string;
}
