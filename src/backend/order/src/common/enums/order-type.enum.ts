/**
 * Order Type Enum
 *
 * Defines the type of order
 * Currently only DINE_IN is supported based on project requirements
 */
export enum OrderType {
	/** Dine-in order (customer orders at table via QR code) */
	DINE_IN = 'DINE_IN',

	/** Reserved for future: Takeaway order */
	TAKEAWAY = 'TAKEAWAY',

	/** Reserved for future: Delivery order */
	DELIVERY = 'DELIVERY',
}
