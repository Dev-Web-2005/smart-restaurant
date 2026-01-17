/**
 * DTO for payment QR code response
 *
 * Contains the generated QR code and payment information.
 * The QR code encodes the Stripe checkout URL for the customer to pay.
 *
 * Response Structure:
 * - qrCode: Base64-encoded PNG image of the QR code
 * - paymentUrl: The Stripe checkout URL (also encoded in QR code)
 * - orderId: Order ID for reference
 * - amount: Total amount to be paid
 * - currency: Currency code (e.g., "usd")
 * - expiresAt: When the payment session expires (optional)
 *
 * Frontend Usage:
 * - Display QR code as image: <img src="data:image/png;base64,{qrCode}" />
 * - Provide fallback link for manual payment: <a href="{paymentUrl}">Pay Now</a>
 * - Show amount and currency to customer
 * - Handle QR code expiration
 */
export class PaymentQrResponseDto {
	qrCode: string; // Base64-encoded PNG image
	paymentUrl: string; // Stripe checkout URL
	orderId: string; // Order ID reference
	amount: number; // Total amount (in cents for USD)
	currency: string; // Currency code
	sessionId?: string; // Stripe session ID (for reference)
	expiresAt?: Date; // When the payment session expires
}
