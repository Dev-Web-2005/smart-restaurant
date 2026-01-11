/**
 * Order Status Enum
 *
 * Represents the lifecycle of an order session from creation to completion
 * Stored as INTEGER in database for performance, mapped to STRING for API.
 * 
 * Note: With item-level status tracking, Order status represents the overall session state:
 * - PENDING: Order created, waiting for first item acceptance
 * - IN_PROGRESS: At least one item is being prepared/served
 * - COMPLETED: All items served and payment completed
 * - CANCELLED: Entire order session cancelled
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

	/** Order session is active with items in various states */
	IN_PROGRESS = 8,

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
	[OrderStatus.IN_PROGRESS]: 'IN_PROGRESS',
	[OrderStatus.COMPLETED]: 'COMPLETED',
	[OrderStatus.CANCELLED]: 'CANCELLED',
};

/**
 * Map strings to OrderStatus enum values
 */
export const OrderStatusFromString: Record<string, OrderStatus> = {
	PENDING: OrderStatus.PENDING,
	ACCEPTED: OrderStatus.ACCEPTED,
	REJECTED: OrderStatus.REJECTED,
	PREPARING: OrderStatus.PREPARING,
	READY: OrderStatus.READY,
	SERVED: OrderStatus.SERVED,
	IN_PROGRESS: OrderStatus.IN_PROGRESS,
	COMPLETED: OrderStatus.COMPLETED,
	CANCELLED: OrderStatus.CANCELLED,
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
 * 
 * Note: With item-level status, Order transitions are simplified:
 * - PENDING: Initial state when order is created
 * - IN_PROGRESS: When items are being prepared/served
 * - COMPLETED: When payment is done
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	[OrderStatus.PENDING]: [
		OrderStatus.ACCEPTED,
		OrderStatus.REJECTED,
		OrderStatus.IN_PROGRESS,
		OrderStatus.CANCELLED,
	],
	[OrderStatus.ACCEPTED]: [
		OrderStatus.PREPARING,
		OrderStatus.IN_PROGRESS,
		OrderStatus.CANCELLED,
	],
	[OrderStatus.REJECTED]: [], // Terminal state
	[OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
	[OrderStatus.READY]: [OrderStatus.SERVED, OrderStatus.IN_PROGRESS],
	[OrderStatus.SERVED]: [OrderStatus.COMPLETED, OrderStatus.IN_PROGRESS],
	[OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
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
