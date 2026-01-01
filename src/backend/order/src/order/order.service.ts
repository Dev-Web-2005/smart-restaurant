import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderItem } from '../common/entities';
import {
	OrderStatus,
	isValidStatusTransition,
	OrderType,
	PaymentStatus,
} from '../common/enums';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import {
	CreateOrderRequestDto,
	GetOrderRequestDto,
	GetOrdersRequestDto,
	AddItemsToOrderRequestDto,
	UpdateOrderStatusRequestDto,
	CancelOrderRequestDto,
	UpdatePaymentStatusRequestDto,
	CreateOrderItemDto,
} from './dtos/request';
import {
	OrderResponseDto,
	PaginatedOrdersResponseDto,
	OrderItemResponseDto,
} from './dtos/response';

@Injectable()
export class OrderService {
	private readonly logger = new Logger(OrderService.name);

	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		@InjectRepository(OrderItem)
		private readonly orderItemRepository: Repository<OrderItem>,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Validate API key
	 */
	private validateApiKey(providedKey: string): void {
		const validKey = this.configService.get<string>('ORDER_API_KEY');
		if (providedKey !== validKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
	}

	/**
	 * Create a new order
	 *
	 * Business Rules:
	 * - Order must have at least one item
	 * - Check if active order already exists for table (optional: merge or reject)
	 * - Validates menu items exist (this should call product service in real implementation)
	 * - Calculates totals including modifiers
	 */
	async createOrder(dto: CreateOrderRequestDto): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		// Validate at least one item
		if (!dto.items || dto.items.length === 0) {
			throw new AppException(ErrorCode.ORDER_ITEMS_REQUIRED);
		}

		// Check for existing active order on this table
		const existingOrder = await this.orderRepository.findOne({
			where: {
				tenantId: dto.tenantId,
				tableId: dto.tableId,
				status: In([
					OrderStatus.PENDING,
					OrderStatus.ACCEPTED,
					OrderStatus.PREPARING,
					OrderStatus.READY,
					OrderStatus.SERVED,
				]),
			},
		});

		if (existingOrder) {
			// In production, you might want to add items to existing order instead
			throw new AppException(ErrorCode.ORDER_ALREADY_EXISTS);
		}

		// Create order
		const order = this.orderRepository.create({
			tenantId: dto.tenantId,
			tableId: dto.tableId,
			customerId: dto.customerId,
			customerName: dto.customerName,
			orderType: dto.orderType || OrderType.DINE_IN,
			status: OrderStatus.PENDING,
			paymentStatus: PaymentStatus.PENDING,
			notes: dto.notes,
			currency: 'VND',
			subtotal: 0,
			tax: 0,
			discount: 0,
			total: 0,
		});

		// Create order items
		// In real implementation, fetch menu item details from product service
		const items = await this.createOrderItems(order, dto.items);
		order.items = items;

		// Calculate totals
		this.calculateOrderTotals(order);

		// Save order with items
		const savedOrder = await this.orderRepository.save(order);

		this.logger.log(
			`Order created: ${savedOrder.id} for table ${dto.tableId} with ${items.length} items`,
		);

		return this.mapToOrderResponse(savedOrder);
	}

	/**
	 * Get a single order by ID
	 */
	async getOrder(dto: GetOrderRequestDto): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		const order = await this.orderRepository.findOne({
			where: {
				id: dto.orderId,
				tenantId: dto.tenantId,
			},
			relations: ['items'],
		});

		if (!order) {
			throw new AppException(ErrorCode.ORDER_NOT_FOUND);
		}

		return this.mapToOrderResponse(order);
	}

	/**
	 * Get orders with filtering, sorting, and pagination
	 */
	async getOrders(dto: GetOrdersRequestDto): Promise<PaginatedOrdersResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		const page = dto.page || 1;
		const limit = dto.limit || 20;
		const skip = (page - 1) * limit;

		// Build query
		const queryBuilder = this.orderRepository
			.createQueryBuilder('order')
			.leftJoinAndSelect('order.items', 'items')
			.where('order.tenantId = :tenantId', { tenantId: dto.tenantId });

		// Apply filters
		if (dto.tableId) {
			queryBuilder.andWhere('order.tableId = :tableId', { tableId: dto.tableId });
		}

		if (dto.customerId) {
			queryBuilder.andWhere('order.customerId = :customerId', {
				customerId: dto.customerId,
			});
		}

		if (dto.status) {
			queryBuilder.andWhere('order.status = :status', { status: dto.status });
		}

		if (dto.paymentStatus) {
			queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
				paymentStatus: dto.paymentStatus,
			});
		}

		if (dto.waiterId) {
			queryBuilder.andWhere('order.waiterId = :waiterId', { waiterId: dto.waiterId });
		}

		// Apply sorting
		const sortBy = dto.sortBy || 'createdAt';
		const sortOrder = dto.sortOrder || 'DESC';
		queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

		// Get total count and paginated results
		const [orders, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

		return {
			orders: orders.map((order) => this.mapToOrderResponse(order)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Add items to an existing order
	 *
	 * Business Rules:
	 * - Can only add to orders in PENDING or ACCEPTED status
	 * - Recalculates order totals
	 */
	async addItemsToOrder(dto: AddItemsToOrderRequestDto): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		// Validate items
		if (!dto.items || dto.items.length === 0) {
			throw new AppException(ErrorCode.ORDER_ITEMS_REQUIRED);
		}

		// Find order
		const order = await this.orderRepository.findOne({
			where: {
				id: dto.orderId,
				tenantId: dto.tenantId,
			},
			relations: ['items'],
		});

		if (!order) {
			throw new AppException(ErrorCode.ORDER_NOT_FOUND);
		}

		// Check if order is editable
		if (!order.isEditable) {
			throw new AppException(ErrorCode.ORDER_ALREADY_COMPLETED);
		}

		// Create new items
		const newItems = await this.createOrderItems(order, dto.items);

		// Add new items to existing items
		order.items = [...order.items, ...newItems];

		// Recalculate totals
		this.calculateOrderTotals(order);

		// Save order
		const updatedOrder = await this.orderRepository.save(order);

		this.logger.log(`Added ${newItems.length} items to order ${order.id}`);

		return this.mapToOrderResponse(updatedOrder);
	}

	/**
	 * Update order status
	 *
	 * Business Rules:
	 * - Must follow valid status transitions
	 * - Updates corresponding timestamps
	 * - REJECTED requires a reason
	 */
	async updateOrderStatus(dto: UpdateOrderStatusRequestDto): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		const order = await this.orderRepository.findOne({
			where: {
				id: dto.orderId,
				tenantId: dto.tenantId,
			},
			relations: ['items'],
		});

		if (!order) {
			throw new AppException(ErrorCode.ORDER_NOT_FOUND);
		}

		// Validate status transition
		if (!isValidStatusTransition(order.status, dto.status)) {
			throw new AppException(ErrorCode.INVALID_ORDER_STATUS_TRANSITION);
		}

		// Validate rejection reason
		if (dto.status === OrderStatus.REJECTED && !dto.rejectionReason) {
			throw new AppException(ErrorCode.VALIDATION_FAILED);
		}

		// Update status and timestamps
		order.status = dto.status;

		switch (dto.status) {
			case OrderStatus.ACCEPTED:
				order.acceptedAt = new Date();
				order.waiterId = dto.waiterId;
				break;
			case OrderStatus.REJECTED:
				order.rejectionReason = dto.rejectionReason;
				break;
			case OrderStatus.PREPARING:
				order.preparingAt = new Date();
				break;
			case OrderStatus.READY:
				order.readyAt = new Date();
				break;
			case OrderStatus.SERVED:
				order.servedAt = new Date();
				break;
			case OrderStatus.COMPLETED:
				order.completedAt = new Date();
				break;
		}

		const updatedOrder = await this.orderRepository.save(order);

		this.logger.log(
			`Order ${order.id} status updated from ${order.status} to ${dto.status}`,
		);

		// TODO: Send notification via RabbitMQ

		return this.mapToOrderResponse(updatedOrder);
	}

	/**
	 * Cancel an order
	 *
	 * Business Rules:
	 * - Can only cancel PENDING or ACCEPTED orders
	 */
	async cancelOrder(dto: CancelOrderRequestDto): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		const order = await this.orderRepository.findOne({
			where: {
				id: dto.orderId,
				tenantId: dto.tenantId,
			},
			relations: ['items'],
		});

		if (!order) {
			throw new AppException(ErrorCode.ORDER_NOT_FOUND);
		}

		// Check if order can be cancelled
		if (![OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(order.status)) {
			throw new AppException(ErrorCode.INVALID_ORDER_STATUS_TRANSITION);
		}

		order.status = OrderStatus.CANCELLED;
		order.rejectionReason = dto.reason || 'Cancelled by user';

		const updatedOrder = await this.orderRepository.save(order);

		this.logger.log(`Order ${order.id} cancelled`);

		return this.mapToOrderResponse(updatedOrder);
	}

	/**
	 * Update payment status
	 *
	 * Business Rules:
	 * - Order should be in SERVED status before payment
	 * - When PAID, order status moves to COMPLETED
	 */
	async updatePaymentStatus(
		dto: UpdatePaymentStatusRequestDto,
	): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		const order = await this.orderRepository.findOne({
			where: {
				id: dto.orderId,
				tenantId: dto.tenantId,
			},
			relations: ['items'],
		});

		if (!order) {
			throw new AppException(ErrorCode.ORDER_NOT_FOUND);
		}

		order.paymentStatus = dto.paymentStatus;

		if (dto.paymentMethod) {
			order.paymentMethod = dto.paymentMethod;
		}

		if (dto.paymentTransactionId) {
			order.paymentTransactionId = dto.paymentTransactionId;
		}

		// If payment is successful, mark order as completed
		if (dto.paymentStatus === PaymentStatus.PAID && order.status === OrderStatus.SERVED) {
			order.status = OrderStatus.COMPLETED;
			order.completedAt = new Date();
		}

		const updatedOrder = await this.orderRepository.save(order);

		this.logger.log(`Order ${order.id} payment status updated to ${dto.paymentStatus}`);

		return this.mapToOrderResponse(updatedOrder);
	}

	/**
	 * Helper: Create order items from DTOs
	 * In real implementation, this should fetch menu item details from product service
	 */
	private async createOrderItems(
		order: Order,
		itemDtos: CreateOrderItemDto[],
	): Promise<OrderItem[]> {
		const items: OrderItem[] = [];

		for (const itemDto of itemDtos) {
			// TODO: Fetch menu item details from product service
			// For now, using mock data
			const menuItemSnapshot = {
				id: itemDto.menuItemId,
				name: 'Menu Item Name', // Should fetch from product service
				description: 'Menu item description',
				price: 100000, // Should fetch from product service
			};

			// Calculate modifiers total
			let modifiersTotal = 0;
			const modifiers = [];

			if (itemDto.modifiers && itemDto.modifiers.length > 0) {
				// TODO: Fetch modifier details from product service
				for (const modDto of itemDto.modifiers) {
					const modifierSnapshot = {
						modifierGroupId: modDto.modifierGroupId,
						modifierGroupName: 'Modifier Group', // Fetch from product service
						modifierOptionId: modDto.modifierOptionId,
						optionName: 'Modifier Option', // Fetch from product service
						price: 5000, // Fetch from product service
						currency: 'VND',
					};

					modifiers.push(modifierSnapshot);
					modifiersTotal += modifierSnapshot.price * itemDto.quantity;
				}
			}

			const subtotal = menuItemSnapshot.price * itemDto.quantity;
			const total = subtotal + modifiersTotal;

			const orderItem = this.orderItemRepository.create({
				order: order,
				menuItemId: itemDto.menuItemId,
				name: menuItemSnapshot.name,
				description: menuItemSnapshot.description,
				unitPrice: menuItemSnapshot.price,
				quantity: itemDto.quantity,
				subtotal: subtotal,
				modifiersTotal: modifiersTotal,
				total: total,
				currency: 'VND',
				modifiers: modifiers,
				notes: itemDto.notes,
			});

			items.push(orderItem);
		}

		return items;
	}

	/**
	 * Helper: Calculate order totals
	 */
	private calculateOrderTotals(order: Order): void {
		let subtotal = 0;

		for (const item of order.items) {
			subtotal += item.total;
		}

		// Calculate tax (e.g., 10% VAT)
		const taxRate = 0.1;
		const tax = subtotal * taxRate;

		order.subtotal = subtotal;
		order.tax = tax;
		order.total = subtotal + tax - order.discount;
	}

	/**
	 * Helper: Map Order entity to OrderResponseDto
	 */
	private mapToOrderResponse(order: Order): OrderResponseDto {
		return {
			id: order.id,
			tenantId: order.tenantId,
			tableId: order.tableId,
			customerId: order.customerId,
			customerName: order.customerName,
			orderType: order.orderType,
			status: order.status,
			paymentStatus: order.paymentStatus,
			paymentMethod: order.paymentMethod,
			paymentTransactionId: order.paymentTransactionId,
			subtotal: order.subtotal,
			tax: order.tax,
			discount: order.discount,
			total: order.total,
			currency: order.currency,
			notes: order.notes,
			waiterId: order.waiterId,
			acceptedAt: order.acceptedAt,
			preparingAt: order.preparingAt,
			readyAt: order.readyAt,
			servedAt: order.servedAt,
			completedAt: order.completedAt,
			rejectionReason: order.rejectionReason,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			items: order.items?.map((item) => this.mapToOrderItemResponse(item)) || [],
			totalItems: order.totalItems,
		};
	}

	/**
	 * Helper: Map OrderItem entity to OrderItemResponseDto
	 */
	private mapToOrderItemResponse(item: OrderItem): OrderItemResponseDto {
		return {
			id: item.id,
			orderId: item.orderId,
			menuItemId: item.menuItemId,
			name: item.name,
			description: item.description,
			unitPrice: item.unitPrice,
			quantity: item.quantity,
			subtotal: item.subtotal,
			modifiersTotal: item.modifiersTotal,
			total: item.total,
			currency: item.currency,
			modifiers: item.modifiers,
			notes: item.notes,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}
}
