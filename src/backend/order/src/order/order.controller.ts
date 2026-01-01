import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrderService } from './order.service';
import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import {
	CreateOrderRequestDto,
	GetOrderRequestDto,
	GetOrdersRequestDto,
	AddItemsToOrderRequestDto,
	UpdateOrderStatusRequestDto,
	CancelOrderRequestDto,
	UpdatePaymentStatusRequestDto,
} from './dtos/request';

/**
 * OrderController
 *
 * Handles RPC messages for order management
 * Implements CRUD operations and order lifecycle management
 *
 * RPC Patterns:
 * - orders:create - Create a new order
 * - orders:get - Get a single order by ID
 * - orders:get-all - Get all orders with filtering and pagination
 * - orders:add-items - Add items to an existing order
 * - orders:update-status - Update order status (PENDING → ACCEPTED → PREPARING → READY → SERVED → COMPLETED)
 * - orders:cancel - Cancel an order
 * - orders:update-payment - Update payment status
 */
@Controller()
export class OrderController {
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
}
