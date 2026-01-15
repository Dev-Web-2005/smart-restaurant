import { IsNotEmpty, IsString, IsUUID, IsOptional, IsArray } from 'class-validator';

/**
 * Request DTO for marking items as ready
 */
export class MarkItemsReadyRequestDto {
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
}

/**
 * Request DTO for bumping (completing) a ticket
 * All items should be ready before bumping
 */
export class BumpTicketRequestDto {
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
	bumpedBy?: string; // Who bumped the ticket (cook/expo name)
}
