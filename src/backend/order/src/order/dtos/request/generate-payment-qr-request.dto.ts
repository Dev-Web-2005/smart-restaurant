import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO for generating a payment QR code for an order
 *
 * This endpoint generates a QR code that leads to the payment gateway (Stripe).
 * The QR code contains a URL that customers can scan to pay for their order.
 *
 * Business Flow:
 * 1. Customer requests to pay for their order
 * 2. System generates payment session with Stripe via payment service
 * 3. Payment service returns Stripe checkout URL
 * 4. System generates QR code encoding the checkout URL
 * 5. Customer scans QR code and completes payment on Stripe
 * 6. After payment, customer is redirected back to restaurant app
 *
 * Request Fields:
 * - tenantId: UUID of the tenant (restaurant)
 * - orderId: UUID of the order to generate payment QR for
 * - orderApiKey: API key for service authentication
 */
export class GeneratePaymentQrRequestDto {
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
