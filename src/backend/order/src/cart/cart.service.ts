import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AddToCartDto } from './dtos/request/add-to-cart.dto';
import { UpdateCartItemQuantityDto } from './dtos/request/update-cart-item-quantity.dto';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';

// Định nghĩa Interface cho Giỏ hàng trong Redis
interface CartItem {
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

	// Helper: Tạo key cho Redis
	private getCartKey(tenantId: string, tableId: string): string {
		return `cart:${tenantId}:${tableId}`;
	}

	// 1. Lấy giỏ hàng
	async getCart(tenantId: string, tableId: string): Promise<Cart> {
		const key = this.getCartKey(tenantId, tableId);
		const cart = await this.cacheManager.get<Cart>(key);
		// Nếu chưa có, trả về giỏ rỗng
		return cart || { items: [], totalPrice: 0, totalItems: 0 };
	}

	// 2. Thêm vào giỏ hàng
	async addToCart(dto: AddToCartDto): Promise<Cart> {
		// Validate input
		if (dto.quantity <= 0) {
			throw new AppException(ErrorCode.INVALID_CART_QUANTITY);
		}

		if (dto.price < 0) {
			throw new AppException(ErrorCode.INVALID_CART_OPERATION);
		}

		// Validate menu item exists and is available via Product Service
		await this.validateMenuItem(dto.tenantId, dto.menuItemId);

		const cart = await this.getCart(dto.tenantId, dto.tableId);
		const { menuItemId, quantity, price, modifiers, notes, name } = dto;

		// Kiểm tra xem món này (cùng modifiers) đã có trong giỏ chưa
		// Lưu ý: So sánh modifiers phức tạp hơn, ở đây mình so sánh menuItemId đơn giản
		// Trong thực tế bạn nên tạo một uniqueId cho mỗi dòng item dựa trên hash(menuItemId + modifiers)
		const existingItemIndex = cart.items.findIndex(
			(item) => item.menuItemId === menuItemId,
		);

		if (existingItemIndex > -1) {
			// Nếu có rồi -> Tăng số lượng
			cart.items[existingItemIndex].quantity += quantity;
			cart.items[existingItemIndex].subtotal =
				cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].price;
		} else {
			// Nếu chưa có -> Thêm mới
			cart.items.push({
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
			`Added item ${menuItemId} to cart for tenant ${dto.tenantId}, table ${dto.tableId}`,
		);

		return cart;
	}

	// 3. Xóa một món khỏi giỏ
	async removeItem(tenantId: string, tableId: string, menuItemId: string): Promise<Cart> {
		const cart = await this.getCart(tenantId, tableId);

		// Check if item exists
		const itemExists = cart.items.some((item) => item.menuItemId === menuItemId);
		if (!itemExists) {
			throw new AppException(ErrorCode.CART_ITEM_NOT_FOUND);
		}

		// Lọc bỏ món cần xóa
		cart.items = cart.items.filter((item) => item.menuItemId !== menuItemId);

		this.recalculateCart(cart);
		await this.cacheManager.set(
			this.getCartKey(tenantId, tableId),
			cart,
			this.configService.get<number>('REDIS_TTL') * 1000,
		);

		this.logger.log(
			`Removed item ${menuItemId} from cart for tenant ${tenantId}, table ${tableId}`,
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
		if (dto.quantity <= 0) {
			throw new AppException(ErrorCode.INVALID_CART_QUANTITY);
		}

		const cart = await this.getCart(dto.tenantId, dto.tableId);

		const itemIndex = cart.items.findIndex((item) => item.menuItemId === dto.menuItemId);
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
			`Updated item ${dto.menuItemId} quantity to ${dto.quantity} for tenant ${dto.tenantId}, table ${dto.tableId}`,
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
