import { OrderItemModifier } from '../../../common/entities/order-item.entity';

/**
 * DTO for bill line item (order item with detailed breakdown)
 *
 * Represents a single item on the bill with all pricing details
 */
export class BillItemDto {
	id: string;
	menuItemId: string;
	name: string;
	description?: string;
	unitPrice: number;
	quantity: number;
	subtotal: number; // unitPrice * quantity (before modifiers)
	modifiers?: OrderItemModifier[]; // Modifiers applied to this item
	modifiersTotal: number; // Total cost of modifiers
	total: number; // Line item total (subtotal + modifiersTotal)
	notes?: string; // Special instructions
	status: string; // Item status (for reference)
	currency: string;
}

/**
 * DTO for bill payment information
 */
export class BillPaymentDto {
	paymentStatus: string; // PENDING, PAID, FAILED, etc.
	paymentMethod?: string; // CASH, CARD, ZALOPAY, MOMO, etc.
	paymentTransactionId?: string; // Transaction ID from payment gateway
	paidAt?: Date; // Timestamp when payment was completed
}

/**
 * DTO for bill summary (pricing breakdown)
 */
export class BillSummaryDto {
	subtotal: number; // Sum of all item subtotals (before modifiers)
	modifiersTotal: number; // Total of all modifier costs
	tax: number; // Tax amount
	discount: number; // Discount amount
	total: number; // Final total amount
	currency: string; // Currency code (USD, VND, etc.)
	totalItems: number; // Total number of items ordered
	totalQuantity: number; // Total quantity across all items
}

/**
 * DTO for bill restaurant/tenant information
 */
export class BillTenantInfoDto {
	tenantId: string;
	// These would come from tenant service in a full implementation
	// For now, we'll keep it simple with just the ID
}

/**
 * DTO for bill order information
 */
export class BillOrderInfoDto {
	orderId: string;
	tableId: string;
	customerId?: string;
	customerName?: string;
	orderType: string; // DINE_IN, TAKEOUT, DELIVERY
	status: string; // Order status
	notes?: string; // Order notes
	waiterId?: string; // Waiter who handled the order
	createdAt: Date; // When order was created
	completedAt?: Date; // When order was completed
	generatedAt: Date; // When bill was generated
}

/**
 * Complete Bill Response DTO
 *
 * This is a comprehensive bill/invoice document containing:
 * - Restaurant/tenant information
 * - Order metadata (table, customer, timestamps)
 * - Itemized list of all ordered items with pricing
 * - Summary with subtotal, taxes, discounts, and total
 * - Payment information
 *
 * Use Cases:
 * - Customer receipt generation
 * - Invoice for payment confirmation
 * - Tax/accounting documentation
 * - Order history reference
 * - Printing physical receipts
 *
 * Frontend Integration:
 * - Can be rendered as PDF receipt
 * - Can be displayed in modal/page
 * - Can be emailed to customer
 * - Suitable for thermal printer formatting
 */
export class BillResponseDto {
	// Tenant information
	tenant: BillTenantInfoDto;

	// Order information
	order: BillOrderInfoDto;

	// Itemized list
	items: BillItemDto[];

	// Pricing summary
	summary: BillSummaryDto;

	// Payment details
	payment: BillPaymentDto;

	// Metadata
	billNumber: string; // Unique bill identifier (can be order ID or custom format)
	generatedAt: Date; // Timestamp when bill was generated
}
