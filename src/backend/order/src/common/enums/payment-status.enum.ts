/**
 * Payment Status Enum
 *
 * Tracks the payment state of an order
 * Stored as INTEGER in database for performance, mapped to STRING for API.
 */
export enum PaymentStatus {
	/** Payment not yet initiated */
	PENDING = 0,

	/** Payment is being processed */
	PROCESSING = 1,

	/** Payment completed successfully */
	PAID = 2,

	/** Payment failed */
	FAILED = 3,

	/** Payment was refunded */
	REFUNDED = 4,
}

/**
 * Map PaymentStatus enum values to human-readable strings
 */
export const PaymentStatusLabels: Record<PaymentStatus, string> = {
	[PaymentStatus.PENDING]: 'PENDING',
	[PaymentStatus.PROCESSING]: 'PROCESSING',
	[PaymentStatus.PAID]: 'PAID',
	[PaymentStatus.FAILED]: 'FAILED',
	[PaymentStatus.REFUNDED]: 'REFUNDED',
};

/**
 * Map strings to PaymentStatus enum values
 */
export const PaymentStatusFromString: Record<string, PaymentStatus> = {
	PENDING: PaymentStatus.PENDING,
	pending: PaymentStatus.PENDING,
	PROCESSING: PaymentStatus.PROCESSING,
	processing: PaymentStatus.PROCESSING,
	PAID: PaymentStatus.PAID,
	paid: PaymentStatus.PAID,
	FAILED: PaymentStatus.FAILED,
	failed: PaymentStatus.FAILED,
	REFUNDED: PaymentStatus.REFUNDED,
	refunded: PaymentStatus.REFUNDED,
};

/**
 * Convert PaymentStatus enum to string
 */
export function paymentStatusToString(status: PaymentStatus): string {
	return PaymentStatusLabels[status] || 'PENDING';
}

/**
 * Convert string to PaymentStatus enum (case-insensitive)
 */
export function paymentStatusFromString(status: string | number): PaymentStatus {
	if (typeof status === 'number') {
		if (Object.values(PaymentStatus).includes(status)) {
			return status as PaymentStatus;
		}
		throw new Error(`Invalid payment status number: ${String(status)}`);
	}

	const normalized = status?.trim();
	const enumValue = PaymentStatusFromString[normalized];

	if (enumValue === undefined) {
		throw new Error(
			`Invalid payment status: ${status}. Must be one of: PENDING, PROCESSING, PAID, FAILED, REFUNDED`,
		);
	}

	return enumValue;
}
