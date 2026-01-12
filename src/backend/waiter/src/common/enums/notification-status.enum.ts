/**
 * NotificationStatus Enum
 *
 * PURE ALERT LAYER - Notifications are just "doorbells", not business logic holders
 *
 * Best Practice Architecture:
 * - Notification = Alert mechanism (like Toast POS, Square Restaurant)
 * - Item Actions = Separate business operations on Order Service
 *
 * Lifecycle:
 * UNREAD → READ → ARCHIVED
 */
export enum NotificationStatus {
	UNREAD = 0, // Notification not yet viewed by waiter
	READ = 1, // Waiter has viewed the notification
	ARCHIVED = 2, // Notification archived (dismissed or order completed)
}

/**
 * Map NotificationStatus enum to string representation
 */
export const NotificationStatusString: Record<NotificationStatus, string> = {
	[NotificationStatus.UNREAD]: 'UNREAD',
	[NotificationStatus.READ]: 'READ',
	[NotificationStatus.ARCHIVED]: 'ARCHIVED',
};

/**
 * Parse string to NotificationStatus enum
 */
export function parseNotificationStatus(status: string): NotificationStatus {
	const upperStatus = status?.toUpperCase();
	switch (upperStatus) {
		case 'UNREAD':
			return NotificationStatus.UNREAD;
		case 'READ':
			return NotificationStatus.READ;
		case 'ARCHIVED':
			return NotificationStatus.ARCHIVED;
		default:
			throw new Error(`Invalid notification status: ${status}`);
	}
}
