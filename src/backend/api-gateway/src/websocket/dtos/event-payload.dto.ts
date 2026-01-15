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
	tenantId: string;
	customerName?: string;
	items: any[]; // ✅ FULL OrderItem objects from database
	orderType: string;
	notes?: string;
	createdAt: Date;
}

export interface OrderItemsAcceptedEventData {
	orderId: string;
	tableId: string;
	items: any[]; // ✅ FULL OrderItem objects
	updatedAt: Date;
	status: string;
	updatedBy?: string;
}

export interface OrderItemsRejectedEventData {
	orderId: string;
	tableId: string;
	items: any[]; // ✅ FULL OrderItem objects
	updatedAt: Date;
	status: string;
	updatedBy?: string;
	rejectionReason?: string;
}

export interface OrderItemsPreparingEventData {
	orderId: string;
	tableId: string;
	items: any[]; // ✅ FULL OrderItem objects
	updatedAt: Date;
	status: string;
	updatedBy?: string;
}

export interface OrderItemsReadyEventData {
	orderId: string;
	tableId: string;
	items: any[]; // ✅ FULL OrderItem objects
	updatedAt: Date;
	status: string;
	updatedBy?: string;
}

export interface OrderItemsServedEventData {
	orderId: string;
	tableId: string;
	items: any[]; // ✅ FULL OrderItem objects
	updatedAt: Date;
	status: string;
	updatedBy?: string;
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
