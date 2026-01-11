import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	UseGuards,
	Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';

/**
 * Cart Controller - API Gateway
 *
 * Handles cart-related REST API endpoints and proxies to Order Service
 * Implements multi-tenant isolation and table-based cart management
 *
 * Design Pattern: "Naive Frontend, Secure Backend"
 * - Frontend sends price/data WITHOUT validation
 * - Cart stores data in Redis for display only
 * - Checkout validates EVERYTHING with Product Service
 * - NEVER trust cart prices for order creation
 *
 * Endpoints:
 * - POST   /tenants/:tenantId/tables/:tableId/cart/items - Add item to cart
 * - GET    /tenants/:tenantId/tables/:tableId/cart - Get cart
 * - PATCH  /tenants/:tenantId/tables/:tableId/cart/items/:itemKey - Update item quantity
 * - DELETE /tenants/:tenantId/tables/:tableId/cart/items/:itemKey - Remove item
 * - DELETE /tenants/:tenantId/tables/:tableId/cart - Clear cart
 * - POST   /tenants/:tenantId/tables/:tableId/cart/checkout - Checkout (create/append order)
 */
@Controller()
export class CartController {
	constructor(
		@Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Add item to cart
	 * POST /tenants/:tenantId/tables/:tableId/cart/items
	 *
	 * SECURITY NOTE:
	 * - Accepts price from frontend WITHOUT validation
	 * - Price stored in Redis for display only
	 * - Real pricing fetched during checkout
	 *
	 * Body:
	 * {
	 *   "menuItemId": "550e8400-e29b-41d4-a716-446655440000",
	 *   "name": "Cappuccino",
	 *   "quantity": 2,
	 *   "price": 45000,  // Base price without modifiers
	 *   "modifiers": [
	 *     {
	 *       "modifierGroupId": "uuid",
	 *       "modifierOptionId": "uuid",
	 *       "name": "Extra Shot",
	 *       "price": 10000  // Additional price for this modifier
	 *     },
	 *     {
	 *       "modifierGroupId": "uuid",
	 *       "modifierOptionId": "uuid",
	 *       "name": "Oat Milk",
	 *       "price": 5000
	 *     }
	 *   ],
	 *   "notes": "Extra hot"
	 * }
	 *
	 * Total Calculation:
	 * - Subtotal = price * quantity = 45,000 * 2 = 90,000
	 * - Modifiers Total = (10,000 + 5,000) * 2 = 30,000
	 * - Item Total = 90,000 + 30,000 = 120,000
	 */
	@Post('tenants/:tenantId/tables/:tableId/cart/items')
	@UseGuards(AuthGuard)
	async addToCart(
		@Param('tenantId') tenantId: string,
		@Param('tableId') tableId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.orderClient.send('cart:add', {
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				tableId,
				customerId: data.customerId,
				menuItemId: data.menuItemId,
				name: data.name,
				quantity: data.quantity,
				price: data.price,
				modifiers: data.modifiers,
				notes: data.notes,
			}),
		);
	}

	/**
	 * Get cart
	 * GET /tenants/:tenantId/tables/:tableId/cart
	 *
	 * Returns:
	 * {
	 *   "code": 1000,
	 *   "message": "Get cart success",
	 *   "data": {
	 *     "items": [
	 *       {
	 *         "itemKey": "abc123...",
	 *         "menuItemId": "uuid",
	 *         "name": "Cappuccino",
	 *         "quantity": 2,
	 *         "price": 45000,  // Base price per unit
	 *         "subtotal": 90000,  // price * quantity
	 *         "modifiersTotal": 30000,  // (10000 + 5000) * 2
	 *         "total": 120000,  // subtotal + modifiersTotal
	 *         "modifiers": [
	 *           {
	 *             "modifierGroupId": "uuid",
	 *             "modifierOptionId": "uuid",
	 *             "name": "Extra Shot",
	 *             "price": 10000
	 *           }
	 *         ],
	 *         "notes": "Extra hot"
	 *       }
	 *     ],
	 *     "totalPrice": 120000,  // Sum of all item totals
	 *     "totalItems": 2
	 *   }
	 * }
	 */
	@Get('tenants/:tenantId/tables/:tableId/cart')
	@UseGuards(AuthGuard)
	async getCart(@Param('tenantId') tenantId: string, @Param('tableId') tableId: string) {
		return firstValueFrom(
			this.orderClient.send('cart:get', {
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				tableId,
			}),
		);
	}

	/**
	 * Update cart item quantity
	 * PATCH /tenants/:tenantId/tables/:tableId/cart/items/:itemKey
	 *
	 * IMPORTANT: Use itemKey (not menuItemId) to identify items
	 * - Same menuItemId with different modifiers = different itemKeys
	 * - Example: Coffee + Sugar ≠ Coffee + No Sugar
	 *
	 * Body:
	 * {
	 *   "quantity": 3
	 * }
	 */
	@Patch('tenants/:tenantId/tables/:tableId/cart/items/:itemKey')
	@UseGuards(AuthGuard)
	async updateCartItemQuantity(
		@Param('tenantId') tenantId: string,
		@Param('tableId') tableId: string,
		@Param('itemKey') itemKey: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.orderClient.send('cart:update-quantity', {
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				tableId,
				itemKey,
				quantity: data.quantity,
			}),
		);
	}

	/**
	 * Remove item from cart
	 * DELETE /tenants/:tenantId/tables/:tableId/cart/items/:itemKey
	 */
	@Delete('tenants/:tenantId/tables/:tableId/cart/items/:itemKey')
	@UseGuards(AuthGuard)
	async removeCartItem(
		@Param('tenantId') tenantId: string,
		@Param('tableId') tableId: string,
		@Param('itemKey') itemKey: string,
	) {
		return firstValueFrom(
			this.orderClient.send('cart:remove-item', {
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				tableId,
				itemKey,
			}),
		);
	}

	/**
	 * Clear entire cart
	 * DELETE /tenants/:tenantId/tables/:tableId/cart
	 */
	@Delete('tenants/:tenantId/tables/:tableId/cart')
	@UseGuards(AuthGuard)
	async clearCart(
		@Param('tenantId') tenantId: string,
		@Param('tableId') tableId: string,
	) {
		return firstValueFrom(
			this.orderClient.send('cart:clear', {
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				tableId,
			}),
		);
	}

	/**
	 * Checkout from cart - Create or append to order
	 * POST /tenants/:tenantId/tables/:tableId/cart/checkout
	 *
	 * ORDER SESSION PATTERN:
	 * - First checkout → Creates NEW order
	 * - Subsequent checkouts → APPENDS items to existing order
	 * - 1 table = 1 active order until payment completed
	 *
	 * SECURITY: Fetches REAL pricing from Product Service
	 * - Validates menu items are ACTIVE
	 * - Fetches current prices (ignores cart prices)
	 * - Validates modifiers and calculates totals
	 * - Prevents price manipulation attacks
	 *
	 * Body:
	 * {
	 *   "customerId": "uuid",
	 *   "customerName": "John Doe",
	 *   "orderType": "DINE_IN",
	 *   "notes": "Allergic to peanuts"
	 * }
	 *
	 * Returns:
	 * {
	 *   "code": 1000,
	 *   "message": "Checkout success",
	 *   "data": {
	 *     "id": "order-uuid",
	 *     "status": "PENDING",
	 *     "items": [...],
	 *     "total": 145000,
	 *     ...
	 *   }
	 * }
	 */
	@Post('tenants/:tenantId/tables/:tableId/cart/checkout')
	@UseGuards(AuthGuard)
	async checkoutCart(
		@Param('tenantId') tenantId: string,
		@Param('tableId') tableId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.orderClient.send('orders:checkout', {
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				tableId,
				customerId: data.customerId,
				customerName: data.customerName,
				orderType: data.orderType || 'DINE_IN',
				notes: data.notes,
			}),
		);
	}
}
