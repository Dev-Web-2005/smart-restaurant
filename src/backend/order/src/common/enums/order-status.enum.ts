/**
 * Order Status Enum
 *
 * Represents the lifecycle of an order session from creation to completion
 * Stored as INTEGER in database for performance, mapped to STRING for API.
 *
 * SIMPLIFIED for Item-Level Status Architecture:
 * - Order status now represents ONLY the overall session state
 * - Detailed preparation states (ACCEPTED, PREPARING, READY, SERVED) moved to OrderItem level
 * - Order maintains only high-level workflow states
 *
 * Status Flow:
 * PENDING → IN_PROGRESS → COMPLETED
 *        ↘ CANCELLED (can cancel at any stage before COMPLETED)
 */
export enum OrderStatus {
	/** Order created, no items accepted yet (initial state) */
	PENDING = 0,

	/** Order session active - at least one item in progress */
	IN_PROGRESS = 1,

	/** Payment completed, order session finished */
	COMPLETED = 2,

	/** Order session cancelled by customer or staff */
	CANCELLED = 3,
}

/**
 * Map OrderStatus enum values to human-readable strings
 */
export const OrderStatusLabels: Record<OrderStatus, string> = {
	[OrderStatus.PENDING]: 'PENDING',
	[OrderStatus.IN_PROGRESS]: 'IN_PROGRESS',
	[OrderStatus.COMPLETED]: 'COMPLETED',
	[OrderStatus.CANCELLED]: 'CANCELLED',
};

/**
 * Map strings to OrderStatus enum values
 */
export const OrderStatusFromString: Record<string, OrderStatus> = {
	PENDING: OrderStatus.PENDING,
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
 * Simplified transitions for session-level status:
 * - PENDING → IN_PROGRESS (when first item starts processing)
 * - PENDING → CANCELLED (cancel before any processing)
 * - IN_PROGRESS → COMPLETED (payment done, all items served)
 * - IN_PROGRESS → CANCELLED (cancel during processing)
 * - COMPLETED, CANCELLED are terminal states
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	[OrderStatus.PENDING]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
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
