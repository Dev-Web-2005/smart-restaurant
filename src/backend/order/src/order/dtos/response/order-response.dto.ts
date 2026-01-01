import { OrderStatus } from '../../../common/enums/order-status.enum';
import { OrderType } from '../../../common/enums/order-type.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
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
 */
export class OrderResponseDto {
	id: string;
	tenantId: string;
	tableId: string;
	customerId: string;
	customerName: string;
	orderType: OrderType;
	status: OrderStatus;
	paymentStatus: PaymentStatus;
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
