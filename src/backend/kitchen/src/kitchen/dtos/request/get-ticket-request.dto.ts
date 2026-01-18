import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * Request DTO for getting a single kitchen ticket
 */
export class GetTicketRequestDto {
	@IsNotEmpty()
	@IsString()
	kitchenApiKey: string;

	@IsNotEmpty()
	@IsString()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	ticketId: string;
}
