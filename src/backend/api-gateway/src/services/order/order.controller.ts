import {
	Body,
	Controller,
	Get,
	Inject,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';
import Role from 'src/common/guards/check-role/check-role.guard';

/**
 * Order Controller - API Gateway
 *
 * Handles all order-related REST API endpoints and proxies to Order Service
 * Implements multi-tenant isolation and authentication
 *
 * Endpoints:
 * - POST   /tenants/:tenantId/orders - Create a new order
 * - GET    /tenants/:tenantId/orders - Get all orders (paginated)
 * - GET    /tenants/:tenantId/orders/:orderId - Get order by ID
 * - POST   /tenants/:tenantId/orders/:orderId/items - Add items to order
 * - PATCH  /tenants/:tenantId/orders/:orderId/status - Update order status
 * - PATCH  /tenants/:tenantId/orders/:orderId/cancel - Cancel order
 * - PATCH  /tenants/:tenantId/orders/:orderId/payment - Update payment status
 * - POST   /tenants/:tenantId/orders/:orderId/accept-items - Waiter accepts specific items (ITEM-CENTRIC)
 * - POST   /tenants/:tenantId/orders/:orderId/reject-items - Waiter rejects specific items (ITEM-CENTRIC)
 */
@Controller()
export class OrderController {
	constructor(
		@Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Create a new order
	 * POST /tenants/:tenantId/orders
	 *
	 * Body:
	 * {
	 *   "tableId": "uuid",
	 *   "customerId": "uuid",
	 *   "customerName": "John Doe",
	 *   "items": [
	 *     {
	 *       "menuItemId": "uuid",
	 *       "quantity": 2,
	 *       "modifiers": [
	 *         {
	 *           "optionId": "uuid",
	 *           "name": "Extra Cheese",
	 *           "price": 10000
	 *         }
	 *       ],
	 *       "notes": "No onions"
	 *     }
	 *   ],
	 *   "notes": "Allergic to peanuts"
	 * }
	 */
	@Post('tenants/:tenantId/orders')
	// @UseGuards(AuthGuard)
	createOrder(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.orderClient.send('orders:create', {
			...data,
			tenantId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Get all orders (paginated)
	 * GET /tenants/:tenantId/orders
	 *
	 * Query params:
	 * - page: number (default: 1)
	 * - limit: number (default: 20)
	 * - status: string (PENDING, ACCEPTED, PREPARING, READY, SERVED, COMPLETED, CANCELLED)
	 * - tableId: uuid
	 * - customerId: uuid
	 * - paymentStatus: string (PENDING, PROCESSING, PAID, FAILED, REFUNDED)
	 *
	 * NOTE: Auth temporarily disabled to allow customer/guest access via tableId
	 * TODO: Implement proper table-based authentication or separate public endpoint
	 */
	@Get('tenants/:tenantId/orders')
	// @UseGuards(AuthGuard, Role('USER', 'STAFF', 'KITCHEN'))
	getOrders(
		@Param('tenantId') tenantId: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
		@Query('status') status?: string,
		@Query('tableId') tableId?: string,
		@Query('customerId') customerId?: string,
		@Query('paymentStatus') paymentStatus?: string,
	) {
		return this.orderClient.send('orders:get-all', {
			tenantId,
			page: page ? +page : 1,
			limit: limit ? +limit : 20,
			status,
			tableId,
			customerId,
			paymentStatus,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Get order by ID
	 * GET /tenants/:tenantId/orders/:orderId
	 */
	@Get('tenants/:tenantId/orders/:orderId')
	// @UseGuards(AuthGuard)
	getOrder(@Param('tenantId') tenantId: string, @Param('orderId') orderId: string) {
		return this.orderClient.send('orders:get', {
			tenantId,
			orderId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Add items to an existing order
	 * POST /tenants/:tenantId/orders/:orderId/items
	 *
	 * Body:
	 * {
	 *   "items": [
	 *     {
	 *       "menuItemId": "uuid",
	 *       "quantity": 1,
	 *       "modifiers": [...],
	 *       "notes": "Extra spicy"
	 *     }
	 *   ]
	 * }
	 */
	@Post('tenants/:tenantId/orders/:orderId/items')
	// @UseGuards(AuthGuard)
	addItemsToOrder(
		@Param('tenantId') tenantId: string,
		@Param('orderId') orderId: string,
		@Body() data: any,
	) {
		return this.orderClient.send('orders:add-items', {
			...data,
			tenantId,
			orderId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Update order status
	 * PATCH /tenants/:tenantId/orders/:orderId/status
	 *
	 * SIMPLIFIED for Item-Level Status Architecture:
	 * - Order status now only supports: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
	 * - Detailed preparation states moved to OrderItem level
	 * - This endpoint primarily used for payment completion and cancellation
	 *
	 * Body:
	 * {
	 *   "status": "IN_PROGRESS",  // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
	 *   "waiterId": "uuid"  // Optional
	 * }
	 */
	@Patch('tenants/:tenantId/orders/:orderId/status')
	@UseGuards(AuthGuard, Role('USER', 'STAFF', 'KITCHEN'))
	updateOrderStatus(
		@Param('tenantId') tenantId: string,
		@Param('orderId') orderId: string,
		@Body() data: any,
	) {
		return this.orderClient.send('orders:update-status', {
			...data,
			tenantId,
			orderId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Update order items status
	 * PATCH /tenants/:tenantId/orders/:orderId/items-status
	 *
	 * NEW: Item-level status management
	 * Allows kitchen/waiter to update individual item statuses
	 *
	 * Use Cases:
	 * - Kitchen marks items as PREPARING when they start cooking
	 * - Kitchen marks items as READY when food is cooked
	 * - Waiter marks items as SERVED when delivered to table
	 * - Staff can REJECT items if ingredients unavailable
	 *
	 * Body:
	 * {
	 *   "itemIds": ["uuid1", "uuid2"],  // Array of order item IDs
	 *   "status": "PREPARING",  // PENDING | ACCEPTED | PREPARING | READY | SERVED | REJECTED | CANCELLED
	 *   "rejectionReason": "Out of stock",  // Required if status = REJECTED
	 *   "waiterId": "uuid"  // Optional
	 * }
	 */
	@Patch('tenants/:tenantId/orders/:orderId/items-status')
	@UseGuards(AuthGuard, Role('USER', 'STAFF', 'KITCHEN'))
	updateOrderItemsStatus(
		@Param('tenantId') tenantId: string,
		@Param('orderId') orderId: string,
		@Body() data: any,
	) {
		return this.orderClient.send('orders:update-items-status', {
			...data,
			tenantId,
			orderId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Cancel order
	 * PATCH /tenants/:tenantId/orders/:orderId/cancel
	 *
	 * Body:
	 * {
	 *   "reason": "Customer requested cancellation"
	 * }
	 */
	@Patch('tenants/:tenantId/orders/:orderId/cancel')
	// @UseGuards(AuthGuard)
	cancelOrder(
		@Param('tenantId') tenantId: string,
		@Param('orderId') orderId: string,
		@Body() data: any,
	) {
		return this.orderClient.send('orders:cancel', {
			...data,
			tenantId,
			orderId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Update payment status
	 * PATCH /tenants/:tenantId/orders/:orderId/payment
	 *
	 * Body:
	 * {
	 *   "paymentStatus": "PAID",
	 *   "paymentMethod": "ZALOPAY",
	 *   "paymentTransactionId": "ZALO123456789"
	 * }
	 */
	@Patch('tenants/:tenantId/orders/:orderId/payment')
	@UseGuards(AuthGuard, Role('USER', 'STAFF'))
	updatePaymentStatus(
		@Param('tenantId') tenantId: string,
		@Param('orderId') orderId: string,
		@Body() data: any,
	) {
		return this.orderClient.send('orders:update-payment', {
			...data,
			tenantId,
			orderId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Accept specific order items (ITEM-CENTRIC ARCHITECTURE)
	 * POST /tenants/:tenantId/orders/:orderId/accept-items
	 *
	 * Body:
	 * {
	 *   "itemIds": ["uuid1", "uuid2"],
	 *   "waiterId": "uuid"
	 * }
	 *
	 * Business Flow:
	 * - Waiter accepts specific items (granular control)
	 * - Items status updated to ACCEPTED
	 * - Kitchen receives notification for accepted items
	 */
	// DO NOT USE THIS ENDPOINT FOR NOW, USE ORDER ITEMS STATUS UPDATE INSTEAD
	@Post('tenants/:tenantId/orders/:orderId/accept-items')
	@UseGuards(AuthGuard, Role('USER', 'STAFF'))
	acceptOrderItems(
		@Param('tenantId') tenantId: string,
		@Param('orderId') orderId: string,
		@Body() data: any,
	) {
		return this.orderClient.send('orders:accept-items', {
			...data,
			tenantId,
			orderId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}

	/**
	 * Reject specific order items (ITEM-CENTRIC ARCHITECTURE)
	 * POST /tenants/:tenantId/orders/:orderId/reject-items
	 *
	 * Body:
	 * {
	 *   "itemIds": ["uuid1", "uuid2"],
	 *   "waiterId": "uuid",
	 *   "rejectionReason": "Out of stock - will be available tomorrow"
	 * }
	 *
	 * Business Flow:
	 * - Waiter rejects specific items with reason
	 * - Items status updated to REJECTED
	 * - Customer receives notification with rejection reason
	 */
	// DO NOT USE THIS ENDPOINT FOR NOW, USE ORDER ITEMS STATUS UPDATE INSTEAD
	@Post('tenants/:tenantId/orders/:orderId/reject-items')
	@UseGuards(AuthGuard, Role('USER', 'STAFF'))
	rejectOrderItems(
		@Param('tenantId') tenantId: string,
		@Param('orderId') orderId: string,
		@Body() data: any,
	) {
		return this.orderClient.send('orders:reject-items', {
			...data,
			tenantId,
			orderId,
			orderApiKey: this.configService.get('ORDER_API_KEY'),
		});
	}
}
