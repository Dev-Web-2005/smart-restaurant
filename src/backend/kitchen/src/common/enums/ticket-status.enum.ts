/**
 * KitchenTicketStatus Enum
 *
 * Represents the lifecycle status of a kitchen ticket (order ticket)
 * A ticket groups order items for coordinated preparation
 *
 * Flow:
 * PENDING → IN_PROGRESS → READY → COMPLETED
 *        ↘ CANCELLED
 *
 * Best Practice: Based on Toast POS, Square Kitchen Display System (KDS)
 */
export enum KitchenTicketStatus {
	/** Ticket received, waiting to be picked up by kitchen */
	PENDING = 0,

	/** Kitchen is actively preparing items on this ticket */
	IN_PROGRESS = 1,

	/** All items on ticket are ready for serving */
	READY = 2,

	/** Ticket completed - all items served */
	COMPLETED = 3,

	/** Ticket cancelled */
	CANCELLED = 4,
}

/**
 * KitchenTicketStatus Labels for display
 */
export const KitchenTicketStatusLabels: Record<KitchenTicketStatus, string> = {
	[KitchenTicketStatus.PENDING]: 'PENDING',
	[KitchenTicketStatus.IN_PROGRESS]: 'IN_PROGRESS',
	[KitchenTicketStatus.READY]: 'READY',
	[KitchenTicketStatus.COMPLETED]: 'COMPLETED',
	[KitchenTicketStatus.CANCELLED]: 'CANCELLED',
};

/**
 * Parse string to KitchenTicketStatus enum
 */
export const KitchenTicketStatusFromString: Record<string, KitchenTicketStatus> = {
	PENDING: KitchenTicketStatus.PENDING,
	IN_PROGRESS: KitchenTicketStatus.IN_PROGRESS,
	READY: KitchenTicketStatus.READY,
	COMPLETED: KitchenTicketStatus.COMPLETED,
	CANCELLED: KitchenTicketStatus.CANCELLED,
};

/**
 * Valid status transitions for kitchen tickets
 */
export const KitchenTicketStatusTransitions: Record<
	KitchenTicketStatus,
	KitchenTicketStatus[]
> = {
	[KitchenTicketStatus.PENDING]: [
		KitchenTicketStatus.IN_PROGRESS,
		KitchenTicketStatus.CANCELLED,
	],
	[KitchenTicketStatus.IN_PROGRESS]: [
		KitchenTicketStatus.READY,
		KitchenTicketStatus.CANCELLED,
	],
	[KitchenTicketStatus.READY]: [
		KitchenTicketStatus.COMPLETED,
		KitchenTicketStatus.CANCELLED,
	],
	[KitchenTicketStatus.COMPLETED]: [], // Terminal state
	[KitchenTicketStatus.CANCELLED]: [], // Terminal state
};

/**
 * Helper function to check if a ticket status transition is valid
 */
export function isValidKitchenTicketStatusTransition(
	currentStatus: KitchenTicketStatus,
	newStatus: KitchenTicketStatus,
): boolean {
	const allowedTransitions = KitchenTicketStatusTransitions[currentStatus];
	return allowedTransitions.includes(newStatus);
}
