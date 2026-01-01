import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

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

	@IsEnum(PaymentStatus)
	@IsNotEmpty()
	paymentStatus: PaymentStatus;

	@IsString()
	@IsOptional()
	paymentMethod?: string; // e.g., 'CASH', 'CARD', 'ZALOPAY', 'MOMO'

	@IsString()
	@IsOptional()
	paymentTransactionId?: string; // Payment gateway transaction ID
}
