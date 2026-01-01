/**
 * Order Status Enum
 *
 * Represents the lifecycle of an order from creation to completion
 * Stored as INTEGER in database for performance, mapped to STRING for API.
 * Based on the project requirements workflow:
 * Pending → Accepted/Rejected → Preparing → Ready → Served → Completed
 */
export enum OrderStatus {
	/** Order placed by customer, waiting for waiter acceptance */
	PENDING = 0,

	/** Order accepted by waiter and sent to kitchen */
	ACCEPTED = 1,

	/** Order rejected by waiter */
	REJECTED = 2,

	/** Kitchen is preparing the order */
	PREPARING = 3,

	/** Food is ready for serving */
	READY = 4,

	/** Food has been served to customer */
	SERVED = 5,

	/** Order is completed and paid */
	COMPLETED = 6,

	/** Order was cancelled */
	CANCELLED = 7,
}

/**
 * Map OrderStatus enum values to human-readable strings
 */
export const OrderStatusLabels: Record<OrderStatus, string> = {
	[OrderStatus.PENDING]: 'PENDING',
	[OrderStatus.ACCEPTED]: 'ACCEPTED',
	[OrderStatus.REJECTED]: 'REJECTED',
	[OrderStatus.PREPARING]: 'PREPARING',
	[OrderStatus.READY]: 'READY',
	[OrderStatus.SERVED]: 'SERVED',
	[OrderStatus.COMPLETED]: 'COMPLETED',
	[OrderStatus.CANCELLED]: 'CANCELLED',
};

/**
 * Map strings to OrderStatus enum values
 */
export const OrderStatusFromString: Record<string, OrderStatus> = {
	PENDING: OrderStatus.PENDING,
	pending: OrderStatus.PENDING,
	ACCEPTED: OrderStatus.ACCEPTED,
	accepted: OrderStatus.ACCEPTED,
	REJECTED: OrderStatus.REJECTED,
	rejected: OrderStatus.REJECTED,
	PREPARING: OrderStatus.PREPARING,
	preparing: OrderStatus.PREPARING,
	READY: OrderStatus.READY,
	ready: OrderStatus.READY,
	SERVED: OrderStatus.SERVED,
	served: OrderStatus.SERVED,
	COMPLETED: OrderStatus.COMPLETED,
	completed: OrderStatus.COMPLETED,
	CANCELLED: OrderStatus.CANCELLED,
	cancelled: OrderStatus.CANCELLED,
};

/**
 * Convert OrderStatus enum to string
 */
export function orderStatusToString(status: OrderStatus): string {
	return OrderStatusLabels[status] || 'PENDING';
}

/**
 * Convert string to OrderStatus enum (case-insensitive)
 */
export function orderStatusFromString(status: string | number): OrderStatus {
	if (typeof status === 'number') {
		if (Object.values(OrderStatus).includes(status)) {
			return status as OrderStatus;
		}
		throw new Error(`Invalid order status number: ${String(status)}`);
	}

	const normalized = status?.trim();
	const enumValue = OrderStatusFromString[normalized];

	if (enumValue === undefined) {
		throw new Error(
			`Invalid order status: ${status}. Must be one of: PENDING, ACCEPTED, REJECTED, PREPARING, READY, SERVED, COMPLETED, CANCELLED`,
		);
	}

	return enumValue;
}

/**
 * Valid order status transitions
 * Prevents invalid state changes
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	[OrderStatus.PENDING]: [
		OrderStatus.ACCEPTED,
		OrderStatus.REJECTED,
		OrderStatus.CANCELLED,
	],
	[OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
	[OrderStatus.REJECTED]: [], // Terminal state
	[OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
	[OrderStatus.READY]: [OrderStatus.SERVED],
	[OrderStatus.SERVED]: [OrderStatus.COMPLETED],
	[OrderStatus.COMPLETED]: [], // Terminal state
	[OrderStatus.CANCELLED]: [], // Terminal state
};

/**
 * Validate if a status transition is allowed
 */
export function isValidStatusTransition(
	currentStatus: OrderStatus,
	newStatus: OrderStatus,
): boolean {
	const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus];
	return allowedTransitions.includes(newStatus);
}
