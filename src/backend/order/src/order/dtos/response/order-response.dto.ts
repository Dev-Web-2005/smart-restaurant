import { OrderItemModifier } from '../../../common/entities/order-item.entity';

/**
 * Response DTO for order item
 *
 * NEW: Includes item-level status tracking fields
 */
export class OrderItemResponseDto {
	id: string;
	orderId: string;
	menuItemId: string;
	name: string;
	description: string;
	unitPrice: number;
	quantity: number;
	subtotal: number;
	modifiersTotal: number;
	total: number;
	currency: string;
	status: string; // Item status as string (PENDING, PREPARING, READY, SERVED, etc.)
	modifiers: OrderItemModifier[];
	notes: string;
	rejectionReason?: string; // Reason if item was rejected
	acceptedAt?: Date; // When item was accepted
	preparingAt?: Date; // When preparation started
	readyAt?: Date; // When item became ready
	servedAt?: Date; // When item was served
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Response DTO for order
 * Note: Status fields are returned as strings for client compatibility
 *
 * SIMPLIFIED for Item-Level Status Architecture:
 * - Removed Order-level timestamps: acceptedAt, preparingAt, readyAt, servedAt
 * - Removed rejectionReason (now tracked at OrderItem level)
 * - Order DTO now focuses on session-level data
 */
export class OrderResponseDto {
	id: string;
	tenantId: string;
	tableId: string;
	customerId: string;
	customerName: string;
	orderType: string; // Converted to string from OrderType enum
	status: string; // Converted to string from OrderStatus enum (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
	paymentStatus: string; // Converted to string from PaymentStatus enum
	paymentMethod: string;
	paymentTransactionId: string;
	subtotal: number;
	tax: number;
	discount: number;
	total: number;
	currency: string;
	notes: string;
	waiterId: string;
	completedAt: Date;
	createdAt: Date;
	updatedAt: Date;
	items: OrderItemResponseDto[];
	totalItems: number; // Computed: total number of items
}

/**
 * Paginated response for orders list
 */
export class PaginatedOrdersResponseDto {
	orders: OrderResponseDto[];
	total: number; // Total count
	page: number;
	limit: number;
	totalPages: number;
}
