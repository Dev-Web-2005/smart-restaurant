/**
 * Event Payload DTO
 *
 * Standard structure for all WebSocket events emitted from server
 */
export interface WebSocketEventPayload<T = any> {
	event: string; // Event name (e.g., 'order.items.new')
	room?: string; // Target room (if specified)
	data: T; // Event-specific data
	timestamp: Date;
	metadata?: {
		tenantId: string;
		sourceService?: string;
		correlationId?: string;
	};
}

/**
 * Order Events
 */
export interface OrderItemsNewEventData {
	orderId: string;
	tableId: string;
	customerName?: string;
	items: Array<{
		id: string;
		name: string;
		quantity: number;
		price: number;
		modifiers?: any[];
	}>;
	priority: number;
	orderType: string;
}

export interface OrderItemsAcceptedEventData {
	orderId: string;
	itemIds: string[];
	waiterId: string;
	waiterName: string;
	acceptedAt: Date;
	estimatedTime?: string;
}

export interface OrderItemsRejectedEventData {
	orderId: string;
	itemIds: string[];
	waiterId: string;
	waiterName: string;
	rejectedAt: Date;
	rejectionReason: string;
}

export interface OrderItemsPreparingEventData {
	orderId: string;
	tableId: string;
	itemIds: string[];
	itemNames: string[];
	startedAt: Date;
	estimatedReadyTime?: Date;
}

export interface OrderItemsReadyEventData {
	orderId: string;
	tableId: string;
	itemIds: string[];
	itemNames: string[];
	readyAt: Date;
	pickupStation?: string;
}

export interface OrderItemsServedEventData {
	orderId: string;
	itemIds: string[];
	servedAt: Date;
	servedBy: string;
}

/**
 * Notification Events
 */
export interface WaiterNotificationEventData {
	notificationId: string;
	orderId: string;
	tableId: string;
	priority: number;
	message: string;
	itemCount: number;
	customerName?: string;
}

/**
 * Payment Events
 */
export interface PaymentRequestedEventData {
	orderId: string;
	tableId: string;
	total: number;
	currency: string;
	requestedAt: Date;
}

export interface PaymentCompletedEventData {
	orderId: string;
	paymentMethod: string;
	paymentTransactionId?: string;
	paidAt: Date;
	total: number;
	currency: string;
}

/**
 * Client-to-Server Events (subscribed messages)
 */
export interface JoinOrderRoomDto {
	orderId: string;
}

export interface LeaveOrderRoomDto {
	orderId: string;
}

export interface SyncMissedEventsDto {
	since: Date; // Timestamp of last received event
}
