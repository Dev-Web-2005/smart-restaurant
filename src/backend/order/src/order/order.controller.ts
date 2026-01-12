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
	AddItemsToOrderRequestDto,
	UpdateOrderStatusRequestDto,
	UpdateOrderItemsStatusRequestDto,
	CancelOrderRequestDto,
	UpdatePaymentStatusRequestDto,
} from './dtos/request';
import { CheckoutCartDto } from '../cart/dtos/request/checkout-cart.dto';

/**
 * OrderController
 *
 * Handles RPC messages for order management
 * Implements CRUD operations and order lifecycle management
 *
 * NEW: Item-level status management
 * - orders:update-items-status - Update status of specific order items
 *
 * RPC Patterns:
 * - orders:create - Create a new order
 * - orders:get - Get a single order by ID
 * - orders:get-all - Get all orders with filtering and pagination
 * - orders:add-items - Add items to an existing order
 * - orders:update-status - Update order status (PENDING → ACCEPTED → PREPARING → READY → SERVED → COMPLETED)
 * - orders:update-items-status - Update status of specific order items (NEW)
 * - orders:cancel - Cancel an order
 * - orders:update-payment - Update payment status
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
	 * EVENT: Handle items accepted by waiter
	 *
	 * Triggered when waiter accepts order items
	 * Flow: Waiter Service -> RabbitMQ -> Order Service (this handler)
	 *
	 * Actions:
	 * 1. Update order items status to ACCEPTED
	 * 2. Record waiter ID and timestamp
	 */
	@EventPattern('order.items_accepted_by_waiter')
	async handleItemsAcceptedByWaiter(
		@Payload()
		data: {
			orderId: string;
			itemIds: string[];
			waiterId: string;
			acceptedAt: Date;
		},
		@Ctx() context: RmqContext,
	) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[EVENT] Items accepted by waiter ${data.waiterId} for order ${data.orderId}`,
			);

			await this.orderService.updateOrderItemsStatus({
				orderApiKey: process.env.ORDER_API_KEY,
				orderId: data.orderId,
				itemIds: data.itemIds,
				status: 'ACCEPTED',
			});

			this.logger.log(
				`[EVENT] Updated ${data.itemIds.length} items to ACCEPTED status for order ${data.orderId}`,
			);

			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[EVENT] Failed to handle items accepted: ${error.message}`,
				error.stack,
			);

			// Retry logic
			const xDeath = message.properties.headers['x-death'];
			const retryCount = xDeath ? xDeath[0].count : 0;
			const maxRetries = parseInt(process.env.LIMIT_REQUEUE) || 10;

			if (retryCount < maxRetries) {
				this.logger.warn(
					`[EVENT] Rejecting message for retry (attempt ${retryCount + 1}/${maxRetries})`,
				);
				channel.nack(message, false, false);
			} else {
				this.logger.error(`[EVENT] Max retries reached. Sending to DLQ.`);
				channel.nack(message, false, false);
			}
		}
	}

	/**
	 * EVENT: Handle items rejected by waiter
	 *
	 * Triggered when waiter rejects order items (e.g., ingredient unavailable)
	 * Flow: Waiter Service -> RabbitMQ -> Order Service (this handler)
	 *
	 * Actions:
	 * 1. Update order items status to REJECTED
	 * 2. Record waiter ID, reason, and timestamp
	 * 3. Notify customer (future enhancement)
	 */
	@EventPattern('order.items_rejected_by_waiter')
	async handleItemsRejectedByWaiter(
		@Payload()
		data: {
			orderId: string;
			itemIds: string[];
			waiterId: string;
			rejectionReason: string;
			rejectedAt: Date;
		},
		@Ctx() context: RmqContext,
	) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		try {
			this.logger.log(
				`[EVENT] Items rejected by waiter ${data.waiterId} for order ${data.orderId}: ${data.rejectionReason}`,
			);

			await this.orderService.updateOrderItemsStatus({
				orderApiKey: process.env.ORDER_API_KEY,
				orderId: data.orderId,
				itemIds: data.itemIds,
				status: 'REJECTED',
				rejectionReason: data.rejectionReason,
			});

			this.logger.log(
				`[EVENT] Updated ${data.itemIds.length} items to REJECTED status for order ${data.orderId}`,
			);

			// TODO: Send notification to customer about rejection
			// this.notificationClient.emit('notification.order_items_rejected', {...});

			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`[EVENT] Failed to handle items rejected: ${error.message}`,
				error.stack,
			);

			// Retry logic
			const xDeath = message.properties.headers['x-death'];
			const retryCount = xDeath ? xDeath[0].count : 0;
			const maxRetries = parseInt(process.env.LIMIT_REQUEUE) || 10;

			if (retryCount < maxRetries) {
				this.logger.warn(
					`[EVENT] Rejecting message for retry (attempt ${retryCount + 1}/${maxRetries})`,
				);
				channel.nack(message, false, false);
			} else {
				this.logger.error(`[EVENT] Max retries reached. Sending to DLQ.`);
				channel.nack(message, false, false);
			}
		}
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
