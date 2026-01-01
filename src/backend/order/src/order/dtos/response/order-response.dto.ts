import { OrderItemModifier } from '../../../common/entities/order-item.entity';

/**
 * Response DTO for order item
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
	modifiers: OrderItemModifier[];
	notes: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Response DTO for order
 * Note: Status fields are returned as strings for client compatibility
 */
export class OrderResponseDto {
	id: string;
	tenantId: string;
	tableId: string;
	customerId: string;
	customerName: string;
	orderType: string; // Converted to string from OrderType enum
	status: string; // Converted to string from OrderStatus enum
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
	acceptedAt: Date;
	preparingAt: Date;
	readyAt: Date;
	servedAt: Date;
	completedAt: Date;
	rejectionReason: string;
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
