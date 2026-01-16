import { IsNotEmpty, IsString, IsUUID, IsOptional, IsNumber } from 'class-validator';

/**
 * Request DTO for updating ticket priority
 */
export class UpdatePriorityRequestDto {
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
	@IsNumber()
	priority: number; // 0=normal, 1=high, 2=urgent, 3=fire
}

/**
 * Request DTO for pausing/resuming ticket timer
 */
export class ToggleTimerRequestDto {
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
	pause: boolean; // true to pause, false to resume
}

/**
 * Request DTO for reassigning ticket to different cook
 */
export class ReassignTicketRequestDto {
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
	@IsUUID()
	newCookId: string;

	@IsOptional()
	@IsString()
	newCookName?: string;
}
