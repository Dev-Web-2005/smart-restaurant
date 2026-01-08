import { IsString, IsNotEmpty, IsIn, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for updating payment status
 *
 * Business Rules:
 * - Order must be in SERVED status before payment
 * - Payment gateway transaction ID should be recorded
 */
export class UpdatePaymentStatusRequestDto {
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
	@IsNotEmpty()
	@IsIn(['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED'])
	paymentStatus: string;

	@IsString()
	@IsOptional()
	paymentMethod?: string; // e.g., 'CASH', 'CARD', 'ZALOPAY', 'MOMO'

	@IsString()
	@IsOptional()
	paymentTransactionId?: string; // Payment gateway transaction ID
}
