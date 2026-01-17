import { Controller, Logger } from '@nestjs/common';
import {
	MessagePattern,
	EventPattern,
	Payload,
	Ctx,
	RmqContext,
} from '@nestjs/microservices';
import { OrderService } from './order.service';
import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import {
	CreateOrderRequestDto,
	GetOrderRequestDto,
	GetOrdersRequestDto,
	GetOrderHistoryRequestDto,
	AddItemsToOrderRequestDto,
	UpdateOrderStatusRequestDto,
	UpdateOrderItemsStatusRequestDto,
	CancelOrderRequestDto,
	UpdatePaymentStatusRequestDto,
	GetRevenueReportRequestDto,
	GetTopItemsReportRequestDto,
	GetAnalyticsReportRequestDto,
	GenerateBillRequestDto,
	GeneratePaymentQrRequestDto,
} from './dtos/request';
import { CheckoutCartDto } from '../cart/dtos/request/checkout-cart.dto';

/**
 * OrderController
 *
 * Handles RPC messages for order management
 * Implements CRUD operations and order lifecycle management
 *
 * ITEM-CENTRIC ARCHITECTURE:
 * - Waiter actions operate directly on items via RPC (not through Waiter Service)
 * - Accept/Reject are first-class operations, not notification callbacks
 *
 * RPC Patterns:
 * - orders:create - Create a new order
 * - orders:get - Get a single order by ID
 * - orders:get-all - Get all orders with filtering and pagination
 * - orders:add-items - Add items to an existing order
 * - orders:update-status - Update order status
 * - orders:update-items-status - Update status of specific order items
 * - orders:accept-items - Waiter accepts specific items (NEW - ITEM-CENTRIC)
 * - orders:reject-items - Waiter rejects specific items with reason (NEW - ITEM-CENTRIC)
 * - orders:cancel - Cancel an order
 * - orders:update-payment - Update payment status
 * - orders:checkout - Create order from cart
 * - orders:get-revenue-report - Get revenue report by time range (REPORTS)
 * - orders:get-top-items-report - Get top revenue items report (REPORTS)
 * - orders:get-analytics-report - Get analytics report for dashboard (REPORTS)
 */
@Controller()
export class OrderController {
	private readonly logger = new Logger(OrderController.name);

	constructor(private readonly orderService: OrderService) {}

	/**
	 * Create a new order
	 * RPC Pattern: 'orders:create'
	 *
	 * Business Flow:
	 * 1. Customer scans QR code and places order
	 * 2. System validates items and table
	 * 3. Creates order with PENDING status
	 * 4. Waiter receives notification (via RabbitMQ - to be implemented)
	 */
	@MessagePattern('orders:create')
	async createOrder(dto: CreateOrderRequestDto) {
		return handleRpcCall(async () => {
			const order = await this.orderService.createOrder(dto);
			return new HttpResponse(1000, 'Order created successfully', order);
		});
	}

	/**
	 * Get a single order by ID
	 * RPC Pattern: 'orders:get'
	 */
	@MessagePattern('orders:get')
	async getOrder(dto: GetOrderRequestDto) {
		return handleRpcCall(async () => {
			const order = await this.orderService.getOrder(dto);
			return new HttpResponse(1000, 'Order retrieved successfully', order);
		});
	}

	/**
	 * Get all orders with filtering, sorting, and pagination
	 * RPC Pattern: 'orders:get-all'
	 *
	 * Supports filtering by:
	 * - tableId (orders for a specific table)
	 * - customerId (customer's order history)
	 * - status (PENDING, ACCEPTED, etc.)
	 * - paymentStatus (PENDING, PAID, etc.)
	 * - waiterId (orders assigned to a waiter)
	 */
	@MessagePattern('orders:get-all')
	async getOrders(dto: GetOrdersRequestDto) {
		return handleRpcCall(async () => {
			const result = await this.orderService.getOrders(dto);
			return new HttpResponse(1000, 'Orders retrieved successfully', result);
		});
	}

	/**
	 * Get customer order history
	 * RPC Pattern: 'orders:get-history'
	 *
	 * Returns all past orders for a specific customer account
	 * Only available for logged-in customers (not guest customers)
	 *
	 * Supports filtering by:
	 * - status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
	 * - paymentStatus (PENDING, PAID, etc.)
	 * - pagination (page, limit)
	 * - sorting (createdAt, updatedAt, total)
	 */
	@MessagePattern('orders:get-history')
	async getOrderHistory(dto: GetOrderHistoryRequestDto) {
		return handleRpcCall(async () => {
			const result = await this.orderService.getOrderHistory(dto);
			return new HttpResponse(1000, 'Order history retrieved successfully', result);
		});
	}

	/**
	 * Add items to an existing order
	 * RPC Pattern: 'orders:add-items'
	 *
	 * Business Flow:
	 * 1. Customer adds more items during their meal
	 * 2. Items are added to the existing order (single order per table session)
	 * 3. Order totals are recalculated
	 * 4. Waiter receives notification of new items (via RabbitMQ - to be implemented)
	 */
	@MessagePattern('orders:add-items')
	async addItemsToOrder(dto: AddItemsToOrderRequestDto) {
		return handleRpcCall(async () => {
			const order = await this.orderService.addItemsToOrder(dto);
			return new HttpResponse(1000, 'Items added to order successfully', order);
		});
	}

	/**
	 * Update order status
	 * RPC Pattern: 'orders:update-status'
	 *
	 * Status Transitions:
	 * - PENDING → ACCEPTED (waiter accepts)
	 * - PENDING → REJECTED (waiter rejects)
	 * - ACCEPTED → PREPARING (kitchen starts cooking)
	 * - PREPARING → READY (food is ready)
	 * - READY → SERVED (waiter delivers food)
	 * - SERVED → COMPLETED (payment done)
	 *
	 * Triggers notifications at each step (via RabbitMQ - to be implemented)
	 */
	@MessagePattern('orders:update-status')
	async updateOrderStatus(dto: UpdateOrderStatusRequestDto) {
		return handleRpcCall(async () => {
			const order = await this.orderService.updateOrderStatus(dto);
			return new HttpResponse(1000, 'Order status updated successfully', order);
		});
	}

	/**
	 * Cancel an order
	 * RPC Pattern: 'orders:cancel'
	 *
	 * Business Rules:
	 * - Can only cancel PENDING or ACCEPTED orders
	 * - Cannot cancel orders already in preparation
	 */
	@MessagePattern('orders:cancel')
	async cancelOrder(dto: CancelOrderRequestDto) {
		return handleRpcCall(async () => {
			const order = await this.orderService.cancelOrder(dto);
			return new HttpResponse(1000, 'Order cancelled successfully', order);
		});
	}

	/**
	 * Update order items status (NEW)
	 * RPC Pattern: 'orders:update-items-status'
	 *
	 * Item-Level Status Management:
	 * - Kitchen marks items as PREPARING when they start cooking
	 * - Kitchen marks items as READY when food is cooked
	 * - Waiter marks items as SERVED when delivered to table
	 * - Staff can REJECT items if ingredients unavailable
	 *
	 * Business Rules:
	 * - All itemIds must belong to the specified order
	 * - Must validate status transitions
	 * - Cannot update items in terminal states
	 * - Auto-updates parent Order status based on item statuses
	 */
	@MessagePattern('orders:update-items-status')
	async updateOrderItemsStatus(dto: UpdateOrderItemsStatusRequestDto) {
		return handleRpcCall(async () => {
			const order = await this.orderService.updateOrderItemsStatus(dto);
			return new HttpResponse(1000, 'Order items status updated successfully', order);
		});
	}

	/**
	 * Update payment status
	 * RPC Pattern: 'orders:update-payment'
	 *
	 * Business Flow:
	 * 1. Customer requests bill
	 * 2. Customer selects payment method (Cash, Card, E-wallet)
	 * 3. Payment is processed
	 * 4. Payment status updated
	 * 5. Order marked as COMPLETED
	 */
	@MessagePattern('orders:update-payment')
	async updatePaymentStatus(dto: UpdatePaymentStatusRequestDto) {
		return handleRpcCall(async () => {
			const order = await this.orderService.updatePaymentStatus(dto);
			return new HttpResponse(1000, 'Payment status updated successfully', order);
		});
	}

	/**
	 * Checkout from cart to create order
	 * RPC Pattern: 'orders:checkout'
	 *
	 * Business Flow:
	 * 1. Customer reviews cart items
	 * 2. Customer confirms checkout
	 * 3. Cart items are converted to order items
	 * 4. Order is created with PENDING status
	 * 5. Cart is cleared
	 * 6. Waiter receives notification (via RabbitMQ - to be implemented)
	 */
	@MessagePattern('orders:checkout')
	async checkoutCart(dto: CheckoutCartDto) {
		return handleRpcCall(async () => {
			const order = await this.orderService.createOrderFromCart(dto);
			return new HttpResponse(1000, 'Order created from cart successfully', order);
		});
	}

	/**
	 * MESSAGE PATTERN: Accept order items - ITEM-CENTRIC ARCHITECTURE
	 *
	 * Waiter frontend calls this RPC directly to accept specific items
	 * No need to go through Waiter Service (notification layer)
	 *
	 * Business Flow:
	 * 1. Waiter sees notification (alert from Waiter Service)
	 * 2. Waiter clicks "Accept" on specific items in UI
	 * 3. Frontend calls this RPC directly
	 * 4. Order Service updates items → emits to Kitchen
	 */
	/*
	@MessagePattern('orders:accept-items')
	async acceptItems(@Payload() dto: any) {
		return handleRpcCall(async () => {
			this.logger.log(
				`[RPC] Accepting ${dto.itemIds.length} items from order ${dto.orderId} by waiter ${dto.waiterId}`,
			);
			const result = await this.orderService.acceptItems(dto);
			return new HttpResponse(1000, 'Items accepted successfully', result);
		});
	}
	*/

	/**
	 * MESSAGE PATTERN: Reject order items - ITEM-CENTRIC ARCHITECTURE
	 *
	 * Waiter frontend calls this RPC directly to reject specific items with reason
	 * No need to go through Waiter Service (notification layer)
	 *
	 * Business Flow:
	 * 1. Waiter sees notification (alert from Waiter Service)
	 * 2. Waiter clicks "Reject" on specific items in UI
	 * 3. Frontend calls this RPC with rejection reason
	 * 4. Order Service updates items → emits to Notification Service for customer
	 */
	/*
	@MessagePattern('orders:reject-items')
	async rejectItems(@Payload() dto: any) {
		return handleRpcCall(async () => {
			this.logger.log(
				`[RPC] Rejecting ${dto.itemIds.length} items from order ${dto.orderId} by waiter ${dto.waiterId}: ${dto.rejectionReason}`,
			);
			const result = await this.orderService.rejectItems(dto);
			return new HttpResponse(1000, 'Items rejected successfully', result);
		});
	}/ ==================== REPORT ENDPOINTS ====================

	/**
	 * Get revenue report by time range
	 * RPC Pattern: 'orders:get-revenue-report'
	 *
	 * Returns time-series revenue data for analytics dashboard
	 * Supports DAILY, WEEKLY, MONTHLY, and CUSTOM time ranges
	 */
	@MessagePattern('orders:get-revenue-report')
	async getRevenueReport(dto: GetRevenueReportRequestDto) {
		return handleRpcCall(async () => {
			const report = await this.orderService.getRevenueReport(dto);
			return new HttpResponse(1000, 'Revenue report retrieved successfully', report);
		});
	}

	/**
	 * Get top revenue items report
	 * RPC Pattern: 'orders:get-top-items-report'
	 *
	 * Returns best-selling items ranked by revenue
	 */
	@MessagePattern('orders:get-top-items-report')
	async getTopItemsReport(dto: GetTopItemsReportRequestDto) {
		return handleRpcCall(async () => {
			const report = await this.orderService.getTopItemsReport(dto);
			return new HttpResponse(1000, 'Top items report retrieved successfully', report);
		});
	}

	/**
	 * Get analytics report
	 * RPC Pattern: 'orders:get-analytics-report'
	 *
	 * Returns comprehensive analytics including:
	 * - Daily orders trend
	 * - Peak hours analysis
	 * - Popular items trends
	 */
	@MessagePattern('orders:get-analytics-report')
	async getAnalyticsReport(dto: GetAnalyticsReportRequestDto) {
		return handleRpcCall(async () => {
			const report = await this.orderService.getAnalyticsReport(dto);
			return new HttpResponse(1000, 'Analytics report retrieved successfully', report);
		});
	}

	// ==================== BILL GENERATION ====================

	/**
	 * Generate bill for an order
	 * RPC Pattern: 'orders:generate-bill'
	 *
	 * Creates a comprehensive bill/invoice document for an order.
	 * Contains all order details, itemized breakdown, and payment information.
	 *
	 * Business Use Cases:
	 * - Generate receipt after successful payment
	 * - Customer requests invoice
	 * - Print receipt for records
	 * - Email receipt to customer
	 */
	@MessagePattern('orders:generate-bill')
	async generateBill(dto: any) {
		return handleRpcCall(async () => {
			const bill = await this.orderService.generateBill(dto);
			return new HttpResponse(1000, 'Bill generated successfully', bill);
		});
	}

	/**
	 * Generate payment QR code for an order
	 * RPC Pattern: 'orders:generate-payment-qr'
	 *
	 * Creates a QR code that leads to Stripe payment checkout.
	 * The QR code encodes the Stripe checkout URL for customer payment.
	 *
	 * Business Flow:
	 * 1. Calls payment service to create Stripe checkout session
	 * 2. Receives Stripe checkout URL
	 * 3. Generates QR code encoding the URL
	 * 4. Returns QR code (base64) and payment details
	 *
	 * Use Cases:
	 * - Customer scans QR code to pay for order
	 * - Display QR code on table tablet or waiter device
	 * - Print QR code on bill for contactless payment
	 * - Send QR code via messaging for remote payment
	 */
	@MessagePattern('orders:generate-payment-qr')
	async generatePaymentQr(dto: any) {
		return handleRpcCall(async () => {
			const paymentQr = await this.orderService.generatePaymentQr(dto);
			return new HttpResponse(1000, 'Payment QR code generated successfully', paymentQr);
		});
	}

	// ==================== EVENT HANDLERS ====================
	@EventPattern('payment.get-state')
	async handlePaymentState(data: { orderId: string; state: number }) {
		// Handle payment state update events from Payment Service
		await this.orderService.processPaymentStateUpdate({
			orderId: data.orderId,
			state: data.state,
		});
	}

	/**
	 * EVENT: Handle Dead Letter Queue messages
	 *
	 * Catches messages that failed after max retries
	 */
	@EventPattern('local_order_dlq')
	handleDLQ(@Payload() data: any, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		const xDeath = message.properties.headers['x-death'];
		const failureInfo = xDeath ? xDeath[0] : {};

		this.logger.error('Message dropped to DLQ - Failed permanently', {
			payload: data,
			failureDetails: {
				attempts: failureInfo.count || 0,
				originalQueue: failureInfo.queue || 'unknown',
				originalExchange: failureInfo.exchange || 'unknown',
				reason: failureInfo.reason || 'unknown',
				routingKeys: failureInfo['routing-keys'] || [],
				time: failureInfo.time ? new Date(failureInfo.time.value * 1000) : null,
			},
			messageProperties: {
				messageId: message.properties.messageId,
				timestamp: message.properties.timestamp,
				correlationId: message.properties.correlationId,
			},
			droppedAt: new Date().toISOString(),
		});

		channel.ack(message);
	}
}
