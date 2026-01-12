/**
 * NotificationStatus Enum
 *
 * Tracks the lifecycle of order notifications sent to waiters
 */
export enum NotificationStatus {
	PENDING = 0, // Notification received, waiting for waiter action
	VIEWED = 1, // Waiter has viewed the notification
	ACCEPTED = 2, // Waiter accepted the order items
	REJECTED = 3, // Waiter rejected the order items
	EXPIRED = 4, // Notification expired (timeout or superseded)
}

/**
 * Map NotificationStatus enum to string representation
 */
export const NotificationStatusString: Record<NotificationStatus, string> = {
	[NotificationStatus.PENDING]: 'PENDING',
	[NotificationStatus.VIEWED]: 'VIEWED',
	[NotificationStatus.ACCEPTED]: 'ACCEPTED',
	[NotificationStatus.REJECTED]: 'REJECTED',
	[NotificationStatus.EXPIRED]: 'EXPIRED',
};

/**
 * Parse string to NotificationStatus enum
 */
export function parseNotificationStatus(status: string): NotificationStatus {
	const upperStatus = status?.toUpperCase();
	switch (upperStatus) {
		case 'PENDING':
			return NotificationStatus.PENDING;
		case 'VIEWED':
			return NotificationStatus.VIEWED;
		case 'ACCEPTED':
			return NotificationStatus.ACCEPTED;
		case 'REJECTED':
			return NotificationStatus.REJECTED;
		case 'EXPIRED':
			return NotificationStatus.EXPIRED;
		default:
			throw new Error(`Invalid notification status: ${status}`);
	}
}
