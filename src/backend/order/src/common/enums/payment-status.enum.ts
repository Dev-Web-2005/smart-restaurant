/**
 * Payment Status Enum
 *
 * Tracks the payment state of an order
 */
export enum PaymentStatus {
	/** Payment not yet initiated */
	PENDING = 'PENDING',

	/** Payment is being processed */
	PROCESSING = 'PROCESSING',

	/** Payment completed successfully */
	PAID = 'PAID',

	/** Payment failed */
	FAILED = 'FAILED',

	/** Payment was refunded */
	REFUNDED = 'REFUNDED',
}
