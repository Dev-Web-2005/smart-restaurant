import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

/**
 * DTO for cancelling an order
 *
 * Business Rules:
 * - Can only cancel orders in PENDING or ACCEPTED status
 * - Cannot cancel orders already being prepared or completed
 */
export class CancelOrderRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsUUID()
	@IsNotEmpty()
	tenantId: string;

	@IsUUID()
	@IsNotEmpty()
	orderId: string;

	@IsString()
	@IsOptional()
	reason?: string; // Optional cancellation reason
}
