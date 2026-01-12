/**
 * Response DTO for order notification
 *
 * PURE ALERT LAYER - Only notification display data
 */
export class OrderNotificationResponseDto {
	id: string;
	orderId: string;
	tableId: string;
	tenantId: string;
	status: string; // UNREAD, READ, ARCHIVED
	notificationType: string;
	priority: number;
	itemIds: string[]; // For display reference only
	metadata: Record<string, any>; // Customer name, item count, etc.
	message: string; // Display message
	readAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Paginated response for notifications list
 */
export class PaginatedNotificationsResponseDto {
	notifications: OrderNotificationResponseDto[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
