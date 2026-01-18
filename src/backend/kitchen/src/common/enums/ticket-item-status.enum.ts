/**
 * KitchenTicketItemStatus Enum
 *
 * Represents the lifecycle status of individual items on a kitchen ticket
 * Allows granular tracking of each item's preparation state
 *
 * Flow:
 * PENDING → PREPARING → READY
 *        ↘ CANCELLED
 *        ↘ RECALLED (pulled back for modification)
 *
 * Best Practice: Real KDS systems like Toast, Lightspeed, Oracle MICROS
 */
export enum KitchenTicketItemStatus {
	/** Item waiting to be prepared */
	PENDING = 0,

	/** Kitchen is actively preparing this item */
	PREPARING = 1,

	/** Item is ready for pickup/serving */
	READY = 2,

	/** Item cancelled (customer request or kitchen issue) */
	CANCELLED = 3,

	/** Item recalled - needs to be remade (burnt, wrong spec, etc.) */
	RECALLED = 4,
}

/**
 * KitchenTicketItemStatus Labels for display
 */
export const KitchenTicketItemStatusLabels: Record<KitchenTicketItemStatus, string> = {
	[KitchenTicketItemStatus.PENDING]: 'PENDING',
	[KitchenTicketItemStatus.PREPARING]: 'PREPARING',
	[KitchenTicketItemStatus.READY]: 'READY',
	[KitchenTicketItemStatus.CANCELLED]: 'CANCELLED',
	[KitchenTicketItemStatus.RECALLED]: 'RECALLED',
};

/**
 * Parse string to KitchenTicketItemStatus enum
 */
export const KitchenTicketItemStatusFromString: Record<string, KitchenTicketItemStatus> =
	{
		PENDING: KitchenTicketItemStatus.PENDING,
		PREPARING: KitchenTicketItemStatus.PREPARING,
		READY: KitchenTicketItemStatus.READY,
		CANCELLED: KitchenTicketItemStatus.CANCELLED,
		RECALLED: KitchenTicketItemStatus.RECALLED,
	};

/**
 * Valid status transitions for ticket items
 */
export const KitchenTicketItemStatusTransitions: Record<
	KitchenTicketItemStatus,
	KitchenTicketItemStatus[]
> = {
	[KitchenTicketItemStatus.PENDING]: [
		KitchenTicketItemStatus.PREPARING,
		KitchenTicketItemStatus.CANCELLED,
	],
	[KitchenTicketItemStatus.PREPARING]: [
		KitchenTicketItemStatus.READY,
		KitchenTicketItemStatus.CANCELLED,
		KitchenTicketItemStatus.RECALLED,
	],
	[KitchenTicketItemStatus.READY]: [
		KitchenTicketItemStatus.CANCELLED,
		KitchenTicketItemStatus.RECALLED,
	],
	[KitchenTicketItemStatus.CANCELLED]: [], // Terminal state
	[KitchenTicketItemStatus.RECALLED]: [
		KitchenTicketItemStatus.PENDING, // Can be re-queued
		KitchenTicketItemStatus.CANCELLED,
	],
};

/**
 * Helper function to check if an item status transition is valid
 */
export function isValidKitchenItemStatusTransition(
	currentStatus: KitchenTicketItemStatus,
	newStatus: KitchenTicketItemStatus,
): boolean {
	const allowedTransitions = KitchenTicketItemStatusTransitions[currentStatus];
	return allowedTransitions.includes(newStatus);
}
