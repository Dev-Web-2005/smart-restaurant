import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Order, OrderItem } from '../common/entities';
import {
	OrderStatus,
	isValidStatusTransition,
	OrderType,
	PaymentStatus,
	orderStatusToString,
	orderTypeToString,
	paymentStatusToString,
	orderStatusFromString,
	orderTypeFromString,
	paymentStatusFromString,
	OrderItemStatus,
	OrderItemStatusLabels,
	isValidOrderItemStatusTransition,
	OrderItemStatusFromString,
} from '../common/enums';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import {
	CreateOrderRequestDto,
	GetOrderRequestDto,
	GetOrdersRequestDto,
	AddItemsToOrderRequestDto,
	UpdateOrderStatusRequestDto,
	UpdateOrderItemsStatusRequestDto,
	CancelOrderRequestDto,
	UpdatePaymentStatusRequestDto,
	CreateOrderItemDto,
} from './dtos/request';
import {
	OrderResponseDto,
	PaginatedOrdersResponseDto,
	OrderItemResponseDto,
} from './dtos/response';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { firstValueFrom } from 'rxjs';
import { CartService } from 'src/cart/cart.service';

@Injectable()
export class OrderService {
	private readonly logger = new Logger(OrderService.name);

	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		@InjectRepository(OrderItem)
		private readonly orderItemRepository: Repository<OrderItem>,
		private readonly cartService: CartService,
		@Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
		private readonly configService: ConfigService,
		@Inject('WAITER_SERVICE') private readonly waiterClient: ClientProxy,
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
				status: Not(In([OrderStatus.COMPLETED, OrderStatus.CANCELLED])),
			},
		});

		if (existingOrder) {
			// In production, you might want to add items to existing order instead
			throw new AppException(ErrorCode.ORDER_ALREADY_EXISTS);
		}

		// Convert string status to enum
		const orderType = dto.orderType
			? orderTypeFromString(dto.orderType)
			: OrderType.DINE_IN;

		// Create order
		const order = this.orderRepository.create({
			tenantId: dto.tenantId,
			tableId: dto.tableId,
			customerId: dto.customerId,
			customerName: dto.customerName,
			orderType: orderType,
			status: OrderStatus.PENDING,
			paymentStatus: PaymentStatus.PENDING,
			notes: dto.notes,
			currency: 'VND',
			subtotal: 0,
			tax: 0,
			discount: 0,
			total: 0,
		});

		await this.orderRepository.save(order); // Save to get ID (otherwise FK fails)

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
	 * Checkout from Cart Service to create Order
	 *
	 * **ORDER SESSION PATTERN** (Phiên đơn hàng):
	 * - 1 bàn chỉ có 1 order active tại 1 thời điểm
	 * - Checkout lần đầu → Tạo order mới
	 * - Checkout lần sau → Append items vào order cũ (gọi thêm món)
	 *
	 * Business Rules:
	 * - Cart must not be empty
	 * - Check if active order exists → Append items (không tạo mới)
	 * - Fetch REAL pricing from Product Service (security)
	 * - Emit kitchen notification ONLY for new items
	 * - Clear cart after successful checkout
	 */
	async createOrderFromCart(dto: {
		orderApiKey: string;
		customerId?: string;
		customerName?: string;
		tenantId: string;
		tableId: string;
		orderType?: string;
		notes?: string;
	}): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		// 1. Lấy data từ Redis (Cart)
		const cart = await this.cartService.getCart({
			orderApiKey: dto.orderApiKey,
			tenantId: dto.tenantId,
			tableId: dto.tableId,
		});

		if (!cart.items || cart.items.length === 0) {
			throw new AppException(ErrorCode.CART_EMPTY);
		}

		// 2. CHECK & APPEND Logic - Kiểm tra order session hiện tại
		let currentOrder: Order;
		let isNewOrder = false;

		const existingOrder = await this.orderRepository.findOne({
			where: {
				tenantId: dto.tenantId,
				tableId: dto.tableId,
				status: Not(In([OrderStatus.COMPLETED, OrderStatus.CANCELLED])),
			},
			relations: ['items'], // Load existing items for append scenario
		});

		if (existingOrder) {
			// **TRƯỜNG HỢP B: ĐÃ CÓ ORDER ACTIVE - APPEND ITEMS**
			this.logger.log(
				`Found existing order ${existingOrder.id} for table ${dto.tableId}. Will append new items.`,
			);
			currentOrder = existingOrder;

			// Update order status to IN_PROGRESS if appending items. P/s: No, only update when items start being prepared (update in updateOrderItemsStatus)
			// if (currentOrder.status === OrderStatus.PENDING) {
			// 	currentOrder.status = OrderStatus.IN_PROGRESS;
			// }

			// Merge notes if provided
			if (dto.notes) {
				currentOrder.notes = currentOrder.notes
					? `${currentOrder.notes}\n---\n${dto.notes}`
					: dto.notes;
			}
		} else {
			// **TRƯỜNG HỢP A: CHƯA CÓ ORDER - TẠO MỚI**
			this.logger.log(
				`No active order found for table ${dto.tableId}. Creating new order.`,
			);
			isNewOrder = true;

			const orderType = dto.orderType
				? orderTypeFromString(dto.orderType)
				: OrderType.DINE_IN;

			currentOrder = this.orderRepository.create({
				tenantId: dto.tenantId,
				tableId: dto.tableId,
				customerId: dto.customerId,
				customerName: dto.customerName,
				orderType: orderType,
				status: OrderStatus.PENDING,
				paymentStatus: PaymentStatus.PENDING,
				notes: dto.notes,
				currency: 'VND',
				subtotal: 0,
				tax: 0,
				discount: 0,
				total: 0,
			});

			// Save order first to get ID for foreign key
			await this.orderRepository.save(currentOrder);
		}

		// 3. Validate cart items và fetch REAL pricing từ Product Service
		// Loop CHỈ 1 LẦN duy nhất với orderId chính xác
		const newOrderItems: OrderItem[] = [];

		for (const cartItem of cart.items) {
			// Fetch REAL menu item details from Product Service
			const menuItemResponse = await firstValueFrom(
				this.productClient.send('menu-items:get', {
					productApiKey: this.configService.get<string>('PRODUCT_API_KEY'),
					tenantId: dto.tenantId,
					menuItemId: cartItem.menuItemId,
				}),
			);

			// Extract real menu item data
			const menuItem = menuItemResponse.data;

			// Check if menu item is still available
			if (!menuItem || menuItem.status !== 'AVAILABLE') {
				this.logger.error(
					`Menu item ${cartItem.name} (ID: ${cartItem.menuItemId}) is no longer available`,
				);
				throw new AppException(ErrorCode.MENU_ITEM_NOT_AVAILABLE);
			}

			// Fetch REAL modifier pricing from Product Service
			let modifiersTotal = 0;
			const validatedModifiers = [];

			if (cartItem.modifiers && cartItem.modifiers.length > 0) {
				for (const modDto of cartItem.modifiers) {
					// Fetch modifier group details
					const modifierGroupResponse = await firstValueFrom(
						this.productClient.send('modifier-groups:get', {
							productApiKey: this.configService.get<string>('PRODUCT_API_KEY'),
							tenantId: dto.tenantId,
							modifierGroupId: modDto.modifierGroupId,
						}),
					);

					// Fetch modifier option details (REAL price)
					const modifierOptionResponse = await firstValueFrom(
						this.productClient.send('modifier-options:get', {
							productApiKey: this.configService.get<string>('PRODUCT_API_KEY'),
							tenantId: dto.tenantId,
							modifierGroupId: modDto.modifierGroupId,
							modifierOptionId: modDto.modifierOptionId,
						}),
					);

					const modifierGroup = modifierGroupResponse.data;
					const modifierOption = modifierOptionResponse.data;

					const orderItemModifier = {
						modifierGroupId: modDto.modifierGroupId,
						modifierGroupName: modifierGroup.name,
						modifierOptionId: modDto.modifierOptionId,
						optionName: modifierOption.label,
						price: modifierOption.priceDelta, // REAL price from Product Service
						currency: 'VND',
					};

					validatedModifiers.push(orderItemModifier);
					modifiersTotal += orderItemModifier.price * cartItem.quantity;
				}
			}

			// Calculate totals using REAL prices
			const realUnitPrice = menuItem.price; // REAL price from Product Service
			const subtotal = realUnitPrice * cartItem.quantity;
			const total = subtotal + modifiersTotal;

			// Tạo OrderItem với orderId ĐÚNG ngay từ đầu (không cần gán lại sau!)
			const orderItem = this.orderItemRepository.create({
				orderId: currentOrder.id, // ✅ Đã có ID chính xác
				menuItemId: cartItem.menuItemId,
				name: menuItem.name, // Use real name from Product Service
				description: menuItem.description,
				unitPrice: realUnitPrice, // REAL price, not from cart
				quantity: cartItem.quantity,
				subtotal: subtotal,
				modifiersTotal: modifiersTotal,
				total: total,
				modifiers: validatedModifiers,
				notes: cartItem.notes,
				currency: 'VND',
				status: OrderItemStatus.PENDING, // Set initial item status
			});

			newOrderItems.push(orderItem);
		}

		// 4. Append items và save
		if (isNewOrder) {
			currentOrder.items = newOrderItems;
		} else {
			// Append to existing items
			currentOrder.items = [...currentOrder.items, ...newOrderItems];
		}

		// 5. Calculate totals and save
		this.calculateOrderTotals(currentOrder);
		const finalOrder = await this.orderRepository.save(currentOrder);

		// Clear cart after successful checkout
		await this.cartService.clearCart(dto.tenantId, dto.tableId);

		this.logger.log(
			`Checkout success: Order ${finalOrder.id} | Table ${dto.tableId} | ${isNewOrder ? 'NEW' : 'APPENDED'} | Items added: ${newOrderItems.length} | Total items: ${finalOrder.items.length}`,
		);

		// DONE: Emit RabbitMQ event CHỈ CHO CÁC MÓN MỚI
		// Để tránh bếp nấu lại các món cũ!
		if (newOrderItems.length > 0) {
			this.waiterClient.emit('order.new_items', {
				waiterApiKey: this.configService.get<string>('WAITER_API_KEY'),
				orderId: finalOrder.id,
				tenantId: dto.tenantId,
				tableId: dto.tableId,
				items: newOrderItems, // Only new items
			});
		}

		return this.mapToOrderResponse(finalOrder);
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
			const statusEnum = orderStatusFromString(dto.status);
			queryBuilder.andWhere('order.status = :status', { status: statusEnum });
		}

		if (dto.paymentStatus) {
			const paymentStatusEnum = paymentStatusFromString(dto.paymentStatus);
			queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
				paymentStatus: paymentStatusEnum,
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
	 * SIMPLIFIED for Item-Level Status Architecture:
	 * - Order status now only supports: PENDING → IN_PROGRESS → COMPLETED or CANCELLED
	 * - Detailed status tracking moved to OrderItem level
	 * - This method is primarily used for payment completion and cancellation
	 *
	 * Business Rules:
	 * - Must follow valid status transitions
	 * - Updates corresponding timestamps
	 * - COMPLETED requires payment to be processed
	 */
	async updateOrderStatus(dto: UpdateOrderStatusRequestDto): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		// Convert string status to enum
		const newStatus = orderStatusFromString(dto.status);

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
		if (!isValidStatusTransition(order.status, newStatus)) {
			this.logger.error(
				`Invalid status transition from ${orderStatusToString(order.status)} to ${orderStatusToString(newStatus)} for order ${order.id}`,
			);
			throw new AppException(ErrorCode.INVALID_ORDER_STATUS_TRANSITION);
		}

		// Update status and timestamps
		order.status = newStatus;

		switch (newStatus) {
			case OrderStatus.IN_PROGRESS:
				// Auto-set when items start processing
				break;
			case OrderStatus.COMPLETED:
				order.completedAt = new Date();
				break;
			case OrderStatus.CANCELLED:
				// Timestamp set via CreatedAt/UpdatedAt
				break;
		}

		const updatedOrder = await this.orderRepository.save(order);

		this.logger.log(
			`Order ${order.id} status updated to ${orderStatusToString(newStatus)}`,
		);

		// TODO: Send notification via RabbitMQ

		return this.mapToOrderResponse(updatedOrder);
	}

	/**
	 * Update status of specific order items
	 *
	 * NEW METHOD: Item-level status management
	 *
	 * Business Rules:
	 * - All itemIds must belong to the specified order
	 * - Must validate status transitions (PENDING → ACCEPTED → PREPARING → READY → SERVED)
	 * - Cannot update items in terminal states (SERVED, REJECTED, CANCELLED)
	 * - If status is REJECTED, rejectionReason is required
	 * - Auto-update parent Order status based on item statuses:
	 *   - If all items are SERVED → Order can be marked for payment
	 *   - If any items are in progress → Order status = IN_PROGRESS
	 *
	 * Use Cases:
	 * - Kitchen marks items as PREPARING when they start cooking
	 * - Kitchen marks items as READY when food is cooked
	 * - Waiter marks items as SERVED when delivered to table
	 * - Staff can REJECT items if ingredients unavailable
	 */
	async updateOrderItemsStatus(
		dto: UpdateOrderItemsStatusRequestDto,
	): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		// 1. Fetch order with items
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

		// 2. Validate that all itemIds belong to this order
		const orderItemIds = order.items.map((item) => item.id);
		const invalidItemIds = dto.itemIds.filter((id) => !orderItemIds.includes(id));

		if (invalidItemIds.length > 0) {
			this.logger.error(
				`Items ${invalidItemIds.join(', ')} do not belong to order ${dto.orderId}`,
			);
			throw new AppException(ErrorCode.INVALID_CART_OPERATION);
		}

		// 3. Validate rejection reason if status is REJECTED
		const dtoStatus = OrderItemStatusFromString[dto.status];

		if (dtoStatus === OrderItemStatus.REJECTED && !dto.rejectionReason) {
			this.logger.error('Rejection reason is required when rejecting items');
			throw new AppException(ErrorCode.INVALID_CART_OPERATION);
		}

		// 4. Update each item status
		const updatedItems: OrderItem[] = [];
		const now = new Date();

		for (const itemId of dto.itemIds) {
			const item = order.items.find((i) => i.id === itemId);

			if (!item) {
				continue; // Should not happen due to validation above
			}

			// Validate status transition
			if (!isValidOrderItemStatusTransition(item.status, dtoStatus)) {
				this.logger.error(
					`Cannot transition item ${item.name} from ${OrderItemStatusLabels[item.status]} to ${OrderItemStatusLabels[dtoStatus]}`,
				);
				throw new AppException(ErrorCode.INVALID_ORDER_STATUS_TRANSITION);
			}

			// Update item status
			item.status = dtoStatus;

			// Update rejection reason if provided
			if (dto.rejectionReason) {
				item.rejectionReason = dto.rejectionReason;
			}

			// Update timestamps based on status
			switch (dtoStatus) {
				case OrderItemStatus.ACCEPTED:
					item.acceptedAt = now;
					break;
				case OrderItemStatus.PREPARING:
					item.preparingAt = now;
					break;
				case OrderItemStatus.READY:
					item.readyAt = now;
					break;
				case OrderItemStatus.SERVED:
					item.servedAt = now;
					break;
			}

			updatedItems.push(item);
		}

		// 5. Save updated items
		await this.orderItemRepository.save(updatedItems);

		// 6. Auto-update parent Order status based on item statuses
		const allItems = order.items;
		const allServed = allItems.every((item) => item.status === OrderItemStatus.SERVED);
		const anyInProgress = allItems.some((item) =>
			[
				OrderItemStatus.ACCEPTED,
				OrderItemStatus.PREPARING,
				OrderItemStatus.READY,
			].includes(item.status),
		);

		if (allServed) {
			// All items served → order can proceed to payment
			// Note: Order status will be COMPLETED when payment is done
			this.logger.log(`Order ${order.id}: All items served. Ready for payment.`);
		} else if (anyInProgress && order.status === OrderStatus.PENDING) {
			// Some items in progress → mark order as active
			order.status = OrderStatus.IN_PROGRESS;
			await this.orderRepository.save(order);

			this.logger.log(
				`Order ${order.id}: Items in progress. Order status updated to IN_PROGRESS.`,
			);
		}

		this.logger.log(
			`Updated ${updatedItems.length} items to status ${OrderItemStatusLabels[dto.status]} for order ${dto.orderId}`,
		);

		// TODO: Send notification via RabbitMQ for kitchen/waiter
		// this.notificationClient.emit('order-items.status-updated', {
		//   orderId: order.id,
		//   tenantId: order.tenantId,
		//   tableId: order.tableId,
		//   itemIds: dto.itemIds,
		//   newStatus: OrderItemStatusLabels[dto.status],
		//   updatedBy: dto.waiterId,
		// });

		return this.mapToOrderResponse(order);
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

		// Check if order can be cancelled (only PENDING and IN_PROGRESS)
		if (![OrderStatus.PENDING, OrderStatus.IN_PROGRESS].includes(order.status)) {
			this.logger.error(
				`Cannot cancel order ${order.id} with status ${orderStatusToString(order.status)}`,
			);
			throw new AppException(ErrorCode.INVALID_ORDER_STATUS_TRANSITION);
		}

		order.status = OrderStatus.CANCELLED;

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

		// Convert string status to enum
		const newPaymentStatus = paymentStatusFromString(dto.paymentStatus);

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

		order.paymentStatus = newPaymentStatus;

		if (dto.paymentMethod) {
			order.paymentMethod = dto.paymentMethod;
		}

		if (dto.paymentTransactionId) {
			order.paymentTransactionId = dto.paymentTransactionId;
		}

		// If payment is successful, mark order as completed
		if (
			newPaymentStatus === PaymentStatus.PAID &&
			order.status === OrderStatus.IN_PROGRESS
		) {
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
			// DONE: Fetch menu item details from product service
			const getMenuItemRequest = {
				productApiKey: this.configService.get<string>('PRODUCT_API_KEY'),
				tenantId: order.tenantId,
				menuItemId: itemDto.menuItemId,
			};

			const menuItemResponse = await firstValueFrom(
				this.productClient.send('menu-items:get', getMenuItemRequest),
			);

			// Extract data from HttpResponse structure
			const menuItem = menuItemResponse.data;

			// Calculate modifiers total
			let modifiersTotal = 0;
			const modifiers = [];

			if (itemDto.modifiers && itemDto.modifiers.length > 0) {
				// DONE: Fetch modifier details from product service
				for (const modDto of itemDto.modifiers) {
					// const modifierSnapshot = {
					// 	modifierGroupId: modDto.modifierGroupId,
					// 	modifierGroupName: 'Modifier Group', // Fetch from product service
					// 	modifierOptionId: modDto.modifierOptionId,
					// 	optionName: 'Modifier Option', // Fetch from product service
					// 	price: 5000, // Fetch from product service
					// 	currency: 'VND',
					// };
					const modifierGroupResponse = await firstValueFrom(
						this.productClient.send('modifier-groups:get', {
							productApiKey: this.configService.get<string>('PRODUCT_API_KEY'),
							tenantId: order.tenantId,
							modifierGroupId: modDto.modifierGroupId,
						}),
					);
					const modifierOptionResponse = await firstValueFrom(
						this.productClient.send('modifier-options:get', {
							productApiKey: this.configService.get<string>('PRODUCT_API_KEY'),
							tenantId: order.tenantId,
							modifierGroupId: modDto.modifierGroupId,
							modifierOptionId: modDto.modifierOptionId,
						}),
					);

					// Extract data from HttpResponse structures
					const modifierGroup = modifierGroupResponse.data;
					const modifierOption = modifierOptionResponse.data;

					const orderItemModifier = {
						modifierGroupId: modDto.modifierGroupId,
						modifierGroupName: modifierGroup.name,
						modifierOptionId: modDto.modifierOptionId,
						optionName: modifierOption.label,
						price: modifierOption.priceDelta,
						currency: 'VND',
					};

					modifiers.push(orderItemModifier);
					modifiersTotal += orderItemModifier.price * itemDto.quantity;
				}
			}

			const subtotal = menuItem.price * itemDto.quantity;
			const total = subtotal + modifiersTotal;

			const orderItem = this.orderItemRepository.create({
				order: order,
				menuItemId: itemDto.menuItemId,
				name: menuItem.name,
				description: menuItem.description,
				unitPrice: menuItem.price,
				quantity: itemDto.quantity,
				subtotal: subtotal,
				modifiersTotal: modifiersTotal,
				total: total,
				currency: 'VND',
				status: OrderItemStatus.PENDING, // Set initial item status
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
	/**
	 * Helper: Calculate order totals
	 * Note: DecimalToNumberTransformer ensures all values are already numbers
	 */
	private calculateOrderTotals(order: Order): void {
		let subtotal = 0;

		for (const item of order.items) {
			subtotal += item.total; // Already a number thanks to transformer
		}

		// Calculate tax from environment variable (e.g., 0.1 = 10% VAT)
		const taxRate = this.configService.get<number>('TAX_RATE', 0.1);
		const tax = subtotal * taxRate;

		// Round to 2 decimal places to avoid floating point errors
		order.subtotal = Number(subtotal.toFixed(2));
		order.tax = Number(tax.toFixed(2));
		order.total = Number((subtotal + tax - order.discount).toFixed(2));
	}

	/**
	 * Accept order items - ITEM-CENTRIC ARCHITECTURE
	 *
	 * Direct waiter action on specific items
	 * This is called by waiter frontend directly, not through Waiter Service
	 *
	 * Business Flow:
	 * 1. Validate items belong to the order
	 * 2. Update items to ACCEPTED status
	 * 3. Emit to Kitchen Service for preparation
	 * 4. Track waiter and timestamp
	 *
	 * @param dto - Accept items request from waiter
	 * @returns Updated order with accepted items
	 */
	async acceptItems(dto: {
		orderApiKey: string;
		orderId: string;
		itemIds: string[];
		waiterId: string;
		tenantId: string;
	}): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		this.logger.log(
			`Waiter ${dto.waiterId} accepting ${dto.itemIds.length} items from order ${dto.orderId}`,
		);

		// Find order
		const order = await this.orderRepository.findOne({
			where: { id: dto.orderId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!order) {
			throw new AppException(ErrorCode.ORDER_NOT_FOUND);
		}

		// Find items to accept
		const itemsToAccept = order.items.filter((item) => dto.itemIds.includes(item.id));

		if (itemsToAccept.length === 0) {
			throw new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND);
		}

		// Validate all items can be accepted
		for (const item of itemsToAccept) {
			if (item.status !== OrderItemStatus.PENDING) {
				throw new AppException({
					...ErrorCode.INVALID_STATUS_TRANSITION,
					message: `Item ${item.id} (${item.name}) is ${OrderItemStatusLabels[item.status]}, cannot accept`,
				});
			}
		}

		// Update items to ACCEPTED
		await this.orderItemRepository.update(
			{ id: In(dto.itemIds) },
			{
				status: OrderItemStatus.ACCEPTED,
				acceptedAt: new Date(),
			},
		);

		// Assign waiter to order if not already assigned
		if (!order.waiterId) {
			order.waiterId = dto.waiterId;
			await this.orderRepository.save(order);
		}

		// Emit to Kitchen Service for preparation
		const kitchenApiKey = this.configService.get<string>('KITCHEN_API_KEY');
		this.waiterClient.emit('kitchen.prepare_items', {
			kitchenApiKey,
			orderId: dto.orderId,
			tableId: order.tableId,
			tenantId: dto.tenantId,
			waiterId: dto.waiterId,
			items: itemsToAccept.map((item) => ({
				id: item.id,
				menuItemId: item.menuItemId,
				name: item.name,
				quantity: item.quantity,
				modifiers: item.modifiers,
				notes: item.notes,
			})),
		});

		this.logger.log(
			`Accepted ${itemsToAccept.length} items from order ${dto.orderId}, sent to kitchen`,
		);

		// Reload order with updated items
		const updatedOrder = await this.orderRepository.findOne({
			where: { id: dto.orderId },
			relations: ['items'],
		});

		return this.mapToOrderResponse(updatedOrder);
	}

	/**
	 * Reject order items - ITEM-CENTRIC ARCHITECTURE
	 *
	 * Direct waiter action to reject specific items with reason
	 * This is called by waiter frontend directly, not through Waiter Service
	 *
	 * Business Flow:
	 * 1. Validate items belong to the order
	 * 2. Update items to REJECTED status with reason
	 * 3. Track waiter and timestamp
	 * 4. Emit notification to customer (future: Notification Service)
	 *
	 * @param dto - Reject items request from waiter
	 * @returns Updated order with rejected items
	 */
	async rejectItems(dto: {
		orderApiKey: string;
		orderId: string;
		itemIds: string[];
		waiterId: string;
		tenantId: string;
		rejectionReason: string;
	}): Promise<OrderResponseDto> {
		this.validateApiKey(dto.orderApiKey);

		this.logger.log(
			`Waiter ${dto.waiterId} rejecting ${dto.itemIds.length} items from order ${dto.orderId}: ${dto.rejectionReason}`,
		);

		// Find order
		const order = await this.orderRepository.findOne({
			where: { id: dto.orderId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!order) {
			throw new AppException(ErrorCode.ORDER_NOT_FOUND);
		}

		// Find items to reject
		const itemsToReject = order.items.filter((item) => dto.itemIds.includes(item.id));

		if (itemsToReject.length === 0) {
			throw new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND);
		}

		// Validate all items can be rejected
		for (const item of itemsToReject) {
			if (item.status !== OrderItemStatus.PENDING) {
				throw new AppException({
					...ErrorCode.INVALID_STATUS_TRANSITION,
					message: `Item ${item.id} (${item.name}) is ${OrderItemStatusLabels[item.status]}, cannot reject`,
				});
			}
		}

		// Update items to REJECTED with reason
		await this.orderItemRepository.update(
			{ id: In(dto.itemIds) },
			{
				status: OrderItemStatus.REJECTED,
				rejectionReason: dto.rejectionReason,
			},
		);

		// Assign waiter to order if not already assigned
		if (!order.waiterId) {
			order.waiterId = dto.waiterId;
			await this.orderRepository.save(order);
		}

		this.logger.log(
			`Rejected ${itemsToReject.length} items from order ${dto.orderId} (Reason: ${dto.rejectionReason})`,
		);

		// TODO: Emit notification to customer about rejected items
		// this.notificationClient.emit('customer.items_rejected', {...})

		// Reload order with updated items
		const updatedOrder = await this.orderRepository.findOne({
			where: { id: dto.orderId },
			relations: ['items'],
		});

		return this.mapToOrderResponse(updatedOrder);
	}

	/**
	 * Helper: Map Order entity to OrderResponseDto
	 * Note: DecimalToNumberTransformer ensures all numeric fields are already numbers
	 */
	private mapToOrderResponse(order: Order): OrderResponseDto {
		return {
			id: order.id,
			tenantId: order.tenantId,
			tableId: order.tableId,
			customerId: order.customerId,
			customerName: order.customerName,
			orderType: orderTypeToString(order.orderType),
			status: orderStatusToString(order.status),
			paymentStatus: paymentStatusToString(order.paymentStatus),
			paymentMethod: order.paymentMethod,
			paymentTransactionId: order.paymentTransactionId,
			subtotal: order.subtotal,
			tax: order.tax,
			discount: order.discount,
			total: order.total,
			currency: order.currency,
			notes: order.notes,
			waiterId: order.waiterId,
			completedAt: order.completedAt,
			createdAt: order.createdAt,
			updatedAt: order.updatedAt,
			items: order.items?.map((item) => this.mapToOrderItemResponse(item)) || [],
			totalItems: order.totalItems,
		};
	}

	/**
	 * Helper: Map OrderItem entity to OrderItemResponseDto
	 * Note: DecimalToNumberTransformer ensures all numeric fields are already numbers
	 * NEW: Includes item-level status and timestamps
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
			status: OrderItemStatusLabels[item.status] || 'PENDING',
			modifiers: item.modifiers,
			notes: item.notes,
			rejectionReason: item.rejectionReason,
			acceptedAt: item.acceptedAt,
			preparingAt: item.preparingAt,
			readyAt: item.readyAt,
			servedAt: item.servedAt,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}
}
