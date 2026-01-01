/**
 * Order Status Enum
 *
 * Represents the lifecycle of an order from creation to completion
 * Based on the project requirements workflow:
 * Pending → Accepted/Rejected → Preparing → Ready → Served → Completed
 */
export enum OrderStatus {
	/** Order placed by customer, waiting for waiter acceptance */
	PENDING = 'PENDING',

	/** Order accepted by waiter and sent to kitchen */
	ACCEPTED = 'ACCEPTED',

	/** Order rejected by waiter */
	REJECTED = 'REJECTED',

	/** Kitchen is preparing the order */
	PREPARING = 'PREPARING',

	/** Food is ready for serving */
	READY = 'READY',

	/** Food has been served to customer */
	SERVED = 'SERVED',

	/** Order is completed and paid */
	COMPLETED = 'COMPLETED',

	/** Order was cancelled */
	CANCELLED = 'CANCELLED',
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
