import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AddToCartDto } from './dtos/request/add-to-cart.dto';
import { UpdateCartItemQuantityDto } from './dtos/request/update-cart-item-quantity.dto';
import { GetCartDto } from './dtos/request/get-cart.dto';
import { RemoveCartItemDto } from './dtos/request/remove-cart-item.dto';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import * as crypto from 'crypto';

// Định nghĩa Interface cho Giỏ hàng trong Redis
interface CartItem {
	itemKey: string; // Unique key: hash(menuItemId + modifiers)
	menuItemId: string;
	name: string;
	quantity: number;
	price: number;
	subtotal: number;
	modifiers: any[];
	notes?: string;
}

interface Cart {
	items: CartItem[];
	totalPrice: number;
	totalItems: number;
}

@Injectable()
export class CartService {
	private readonly logger = new Logger(CartService.name);

	constructor(
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private readonly configService: ConfigService,
		@Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
	) {}

	/**
	 * Validate API key for cart operations
	 * Security: All cart operations should be authenticated
	 */
	private validateApiKey(providedKey: string): void {
		const validKey = this.configService.get<string>('ORDER_API_KEY');
		if (providedKey !== validKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
	}

	// Helper: Tạo key cho Redis
	private getCartKey(tenantId: string, tableId: string): string {
		return `cart:${tenantId}:${tableId}`;
	}

	/**
	 * Helper: Generate unique item key based on menuItemId + modifiers
	 * This ensures items with different modifiers are treated as separate items
	 *
	 * Example:
	 * - Coffee + Sugar = hash(coffee-id + [sugar])
	 * - Coffee + No Sugar = hash(coffee-id + [no-sugar])
	 * These will have different itemKeys
	 */
	private generateItemKey(menuItemId: string, modifiers: any[]): string {
		// Sort modifiers để đảm bảo consistent hash
		const sortedModifiers = (modifiers || [])
			.map((mod) => `${mod.modifierGroupId}:${mod.modifierOptionId}`)
			.sort()
			.join('|');

		const content = `${menuItemId}|${sortedModifiers}`;
		return crypto.createHash('md5').update(content).digest('hex');
	}

	// 1. Lấy giỏ hàng
	async getCart(dto: GetCartDto): Promise<Cart> {
		// Validate API key
		this.validateApiKey(dto.orderApiKey);

		const key = this.getCartKey(dto.tenantId, dto.tableId);
		const cart = await this.cacheManager.get<Cart>(key);
		// Nếu chưa có, trả về giỏ rỗng
		return cart || { items: [], totalPrice: 0, totalItems: 0 };
	}

	// 2. Thêm vào giỏ hàng
	async addToCart(dto: AddToCartDto): Promise<Cart> {
		// Validate API key
		this.validateApiKey(dto.orderApiKey);

		// Validate input
		if (dto.quantity <= 0) {
			throw new AppException(ErrorCode.INVALID_CART_QUANTITY);
		}

		if (dto.price < 0) {
			throw new AppException(ErrorCode.INVALID_CART_OPERATION);
		}

		// Validate menu item exists and is available via Product Service
		await this.validateMenuItem(dto.tenantId, dto.menuItemId);

		// Get cart without re-validating API key (already validated above)
		const key = this.getCartKey(dto.tenantId, dto.tableId);
		const cart = (await this.cacheManager.get<Cart>(key)) || {
			items: [],
			totalPrice: 0,
			totalItems: 0,
		};
		const { menuItemId, quantity, price, modifiers, notes, name } = dto;

		// Generate unique item key based on menuItemId + modifiers
		const itemKey = this.generateItemKey(menuItemId, modifiers || []);

		// Tìm item với CÙNG menuItemId VÀ CÙNG modifiers
		const existingItemIndex = cart.items.findIndex((item) => item.itemKey === itemKey);

		if (existingItemIndex > -1) {
			// Nếu có rồi (cùng món, cùng modifiers) -> Tăng số lượng
			cart.items[existingItemIndex].quantity += quantity;
			cart.items[existingItemIndex].subtotal =
				cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].price;
		} else {
			// Nếu chưa có (món mới hoặc modifiers khác) -> Thêm mới
			cart.items.push({
				itemKey, // Unique identifier
				menuItemId,
				name,
				quantity,
				price,
				subtotal: price * quantity,
				modifiers: modifiers || [],
				notes,
			});
		}

		// Tính toán lại tổng tiền
		this.recalculateCart(cart);

		// Lưu lại vào Redis (Set TTL lại 24h để gia hạn)
		await this.cacheManager.set(
			this.getCartKey(dto.tenantId, dto.tableId),
			cart,
			this.configService.get<number>('REDIS_TTL') * 1000,
		);

		this.logger.log(
			`Added item ${menuItemId} (key: ${itemKey}) to cart for tenant ${dto.tenantId}, table ${dto.tableId}`,
		);

		return cart;
	}

	// 3. Xóa một món khỏi giỏ
	async removeItem(dto: RemoveCartItemDto): Promise<Cart> {
		// Validate API key
		this.validateApiKey(dto.orderApiKey);

		// Get cart without re-validating API key
		const key = this.getCartKey(dto.tenantId, dto.tableId);
		const cart = (await this.cacheManager.get<Cart>(key)) || {
			items: [],
			totalPrice: 0,
			totalItems: 0,
		};

		// Check if item exists
		const itemExists = cart.items.some((item) => item.itemKey === dto.itemKey);
		if (!itemExists) {
			throw new AppException(ErrorCode.CART_ITEM_NOT_FOUND);
		}

		// Lọc bỏ món cần xóa
		cart.items = cart.items.filter((item) => item.itemKey !== dto.itemKey);

		this.recalculateCart(cart);
		await this.cacheManager.set(
			key,
			cart,
			this.configService.get<number>('REDIS_TTL') * 1000,
		);

		this.logger.log(
			`Removed item ${dto.itemKey} from cart for tenant ${dto.tenantId}, table ${dto.tableId}`,
		);

		return cart;
	}

	// 4. Xóa sạch giỏ (Dùng khi Checkout thành công)
	async clearCart(tenantId: string, tableId: string): Promise<void> {
		await this.cacheManager.del(this.getCartKey(tenantId, tableId));
		this.logger.log(`Cleared cart for tenant ${tenantId}, table ${tableId}`);
	}

	// 5. Cập nhật số lượng của một item
	async updateItemQuantity(dto: UpdateCartItemQuantityDto): Promise<Cart> {
		// Validate API key
		this.validateApiKey(dto.orderApiKey);

		if (dto.quantity <= 0) {
			throw new AppException(ErrorCode.INVALID_CART_QUANTITY);
		}

		// Get cart without re-validating API key
		const key = this.getCartKey(dto.tenantId, dto.tableId);
		const cart = (await this.cacheManager.get<Cart>(key)) || {
			items: [],
			totalPrice: 0,
			totalItems: 0,
		};

		// Find by itemKey instead of menuItemId
		const itemIndex = cart.items.findIndex((item) => item.itemKey === dto.itemKey);
		if (itemIndex === -1) {
			throw new AppException(ErrorCode.CART_ITEM_NOT_FOUND);
		}

		// Update quantity and recalculate subtotal
		cart.items[itemIndex].quantity = dto.quantity;
		cart.items[itemIndex].subtotal = cart.items[itemIndex].price * dto.quantity;

		this.recalculateCart(cart);
		await this.cacheManager.set(
			this.getCartKey(dto.tenantId, dto.tableId),
			cart,
			this.configService.get<number>('REDIS_TTL') * 1000,
		);

		this.logger.log(
			`Updated item ${dto.itemKey} quantity to ${dto.quantity} for tenant ${dto.tenantId}, table ${dto.tableId}`,
		);

		return cart;
	}

	// Helper: Validate menu item với Product Service
	private async validateMenuItem(tenantId: string, menuItemId: string): Promise<void> {
		try {
			const response = await firstValueFrom(
				this.productClient.send('menu-item:get-by-id', {
					tenantId,
					menuItemId,
				}),
			);

			if (!response || response.code !== 1000) {
				this.logger.error(`Menu item ${menuItemId} not found or not available`);
				throw new AppException(ErrorCode.MENU_ITEM_NOT_AVAILABLE);
			}

			// Check if menu item is available (status ACTIVE)
			if (response.data?.status !== 'ACTIVE') {
				this.logger.error(`Menu item ${menuItemId} is not active`);
				throw new AppException(ErrorCode.MENU_ITEM_NOT_AVAILABLE);
			}
		} catch (error) {
			if (error instanceof AppException) {
				throw error;
			}
			this.logger.error(`Error validating menu item: ${error.message}`);
			throw new AppException(ErrorCode.MENU_ITEM_NOT_AVAILABLE);
		}
	}

	// Helper tính tổng
	private recalculateCart(cart: Cart) {
		cart.totalPrice = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
		cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
	}
}
