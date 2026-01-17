import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO for generating a bill for a paid order
 *
 * This endpoint generates a detailed bill/invoice for an order.
 * The bill contains all order information, itemized breakdown, and payment details.
 *
 * Business Rules:
 * - Order must exist in the system
 * - Order must belong to the specified tenant
 * - Typically used after successful payment
 *
 * Request Fields:
 * - tenantId: UUID of the tenant
 * - orderId: UUID of the order to generate bill for
 * - orderApiKey: API key for service authentication
 */
export class GenerateBillRequestDto {
	@IsNotEmpty()
	@IsString()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsString()
	@IsUUID()
	orderId: string;

	@IsNotEmpty()
	@IsString()
	orderApiKey: string;
}
