/**
 * KitchenTicketPriority Enum
 *
 * Represents the priority level of a kitchen ticket
 * Higher priority tickets should be prepared first (FIFO within same priority)
 *
 * Best Practice: Real-world kitchen operations (expediter workflow)
 */
export enum KitchenTicketPriority {
	/** Normal priority - standard order flow */
	NORMAL = 0,

	/** High priority - VIP table, rush order */
	HIGH = 1,

	/** Urgent priority - remake, complaint resolution */
	URGENT = 2,

	/** Fire priority - Chef calls for immediate preparation */
	FIRE = 3,
}

/**
 * KitchenTicketPriority Labels for display
 */
export const KitchenTicketPriorityLabels: Record<KitchenTicketPriority, string> = {
	[KitchenTicketPriority.NORMAL]: 'NORMAL',
	[KitchenTicketPriority.HIGH]: 'HIGH',
	[KitchenTicketPriority.URGENT]: 'URGENT',
	[KitchenTicketPriority.FIRE]: 'FIRE',
};

/**
 * Parse string to KitchenTicketPriority enum
 */
export const KitchenTicketPriorityFromString: Record<string, KitchenTicketPriority> = {
	NORMAL: KitchenTicketPriority.NORMAL,
	HIGH: KitchenTicketPriority.HIGH,
	URGENT: KitchenTicketPriority.URGENT,
	FIRE: KitchenTicketPriority.FIRE,
};

/**
 * Get color code for priority display on KDS
 */
export function getPriorityColor(priority: KitchenTicketPriority): string {
	switch (priority) {
		case KitchenTicketPriority.FIRE:
			return '#FF0000'; // Red
		case KitchenTicketPriority.URGENT:
			return '#FF6B00'; // Orange
		case KitchenTicketPriority.HIGH:
			return '#FFD700'; // Yellow/Gold
		case KitchenTicketPriority.NORMAL:
		default:
			return '#FFFFFF'; // White
	}
}
