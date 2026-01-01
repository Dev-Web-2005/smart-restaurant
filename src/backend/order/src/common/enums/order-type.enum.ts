/**
 * Order Type Enum
 *
 * Defines the type of order
 * Stored as INTEGER in database for performance, mapped to STRING for API.
 * Currently only DINE_IN is supported based on project requirements
 */
export enum OrderType {
	/** Dine-in order (customer orders at table via QR code) */
	DINE_IN = 0,

	/** Reserved for future: Takeaway order */
	TAKEAWAY = 1,

	/** Reserved for future: Delivery order */
	DELIVERY = 2,
}

/**
 * Map OrderType enum values to human-readable strings
 */
export const OrderTypeLabels: Record<OrderType, string> = {
	[OrderType.DINE_IN]: 'DINE_IN',
	[OrderType.TAKEAWAY]: 'TAKEAWAY',
	[OrderType.DELIVERY]: 'DELIVERY',
};

/**
 * Map strings to OrderType enum values
 */
export const OrderTypeFromString: Record<string, OrderType> = {
	DINE_IN: OrderType.DINE_IN,
	dine_in: OrderType.DINE_IN,
	'dine-in': OrderType.DINE_IN,
	TAKEAWAY: OrderType.TAKEAWAY,
	takeaway: OrderType.TAKEAWAY,
	DELIVERY: OrderType.DELIVERY,
	delivery: OrderType.DELIVERY,
};

/**
 * Convert OrderType enum to string
 */
export function orderTypeToString(type: OrderType): string {
	return OrderTypeLabels[type] || 'DINE_IN';
}

/**
 * Convert string to OrderType enum (case-insensitive)
 */
export function orderTypeFromString(type: string | number): OrderType {
	if (typeof type === 'number') {
		if (Object.values(OrderType).includes(type)) {
			return type as OrderType;
		}
		throw new Error(`Invalid order type number: ${String(type)}`);
	}

	const normalized = type?.trim();
	const enumValue = OrderTypeFromString[normalized];

	if (enumValue === undefined) {
		throw new Error(
			`Invalid order type: ${type}. Must be one of: DINE_IN, TAKEAWAY, DELIVERY`,
		);
	}

	return enumValue;
}
