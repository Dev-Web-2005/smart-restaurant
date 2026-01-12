/**
 * Response DTO for order notification
 */
export class OrderNotificationResponseDto {
	id: string;
	orderId: string;
	tableId: string;
	tenantId: string;
	waiterId: string;
	status: string;
	notificationType: string;
	priority: number;
	itemIds: string[];
	metadata: Record<string, any>;
	notes: string;
	rejectionReason: string;
	viewedAt: Date;
	respondedAt: Date;
	expiresAt: Date;
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

/**
 * Response DTO for accept/reject actions
 */
export class WaiterActionResponseDto {
	success: boolean;
	message: string;
	notificationId: string;
	orderId: string;
	itemIds: string[];
	action: 'ACCEPTED' | 'REJECTED';
	timestamp: Date;
}
