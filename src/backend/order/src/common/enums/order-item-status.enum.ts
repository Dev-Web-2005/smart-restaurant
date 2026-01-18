/**
 * OrderItemStatus Enum
 *
 * Represents the lifecycle status of individual order items
 * Allows granular tracking of each item's preparation and delivery state
 *
 * Flow:
 * PENDING → ACCEPTED → PREPARING → READY → SERVED
 *        ↘ REJECTED
 *        ↘ CANCELLED (can be cancelled at any stage before SERVED)
 */
export enum OrderItemStatus {
	/** Item has been ordered but not yet acknowledged by staff */
	PENDING = 0,

	/** Staff has accepted the item and will prepare it */
	ACCEPTED = 1,

	/** Kitchen/bar is currently preparing the item */
	PREPARING = 2,

	/** Item is ready for pickup/serving */
	READY = 3,

	/** Item has been delivered to the customer */
	SERVED = 4,

	/** Staff rejected the item (e.g., ingredient unavailable) */
	REJECTED = 5,

	/** Item was cancelled (by customer or staff) */
	CANCELLED = 6,
}

/**
 * OrderItemStatus Labels for display
 */
export const OrderItemStatusLabels: Record<OrderItemStatus, string> = {
	[OrderItemStatus.PENDING]: 'PENDING',
	[OrderItemStatus.ACCEPTED]: 'ACCEPTED',
	[OrderItemStatus.PREPARING]: 'PREPARING',
	[OrderItemStatus.READY]: 'READY',
	[OrderItemStatus.SERVED]: 'SERVED',
	[OrderItemStatus.REJECTED]: 'REJECTED',
	[OrderItemStatus.CANCELLED]: 'CANCELLED',
};

export const OrderItemStatusFromString: Record<string, OrderItemStatus> = {
	PENDING: OrderItemStatus.PENDING,
	ACCEPTED: OrderItemStatus.ACCEPTED,
	PREPARING: OrderItemStatus.PREPARING,
	READY: OrderItemStatus.READY,
	SERVED: OrderItemStatus.SERVED,
	REJECTED: OrderItemStatus.REJECTED,
	CANCELLED: OrderItemStatus.CANCELLED,
};

/**
 * Valid status transitions for order items
 */
export const OrderItemStatusTransitions: Record<OrderItemStatus, OrderItemStatus[]> = {
	[OrderItemStatus.PENDING]: [
		OrderItemStatus.ACCEPTED,
		OrderItemStatus.REJECTED,
		OrderItemStatus.CANCELLED,
	],
	[OrderItemStatus.ACCEPTED]: [OrderItemStatus.PREPARING, OrderItemStatus.CANCELLED],
	[OrderItemStatus.PREPARING]: [OrderItemStatus.READY, OrderItemStatus.CANCELLED],
	[OrderItemStatus.READY]: [OrderItemStatus.SERVED, OrderItemStatus.CANCELLED],
	[OrderItemStatus.SERVED]: [], // Terminal state - cannot transition
	[OrderItemStatus.REJECTED]: [], // Terminal state - cannot transition
	[OrderItemStatus.CANCELLED]: [], // Terminal state - cannot transition
};

/**
 * Helper function to check if a status transition is valid
 */
export function isValidOrderItemStatusTransition(
	currentStatus: OrderItemStatus,
	newStatus: OrderItemStatus,
): boolean {
	const allowedTransitions = OrderItemStatusTransitions[currentStatus];
	return allowedTransitions.includes(newStatus);
}
