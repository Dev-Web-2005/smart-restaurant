import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AddToCartDto } from './dtos/request/add-to-cart.dto';
import { ConfigService } from '@nestjs/config';

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
	constructor(
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private readonly configService: ConfigService,
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

		return cart;
	}

	// 3. Xóa một món khỏi giỏ
	async removeItem(tenantId: string, tableId: string, menuItemId: string): Promise<Cart> {
		const cart = await this.getCart(tenantId, tableId);

		// Lọc bỏ món cần xóa
		cart.items = cart.items.filter((item) => item.menuItemId !== menuItemId);

		this.recalculateCart(cart);
		await this.cacheManager.set(
			this.getCartKey(tenantId, tableId),
			cart,
			this.configService.get<number>('REDIS_TTL') * 1000,
		);

		return cart;
	}

	// 4. Xóa sạch giỏ (Dùng khi Checkout thành công)
	async clearCart(tenantId: string, tableId: string): Promise<void> {
		await this.cacheManager.del(this.getCartKey(tenantId, tableId));
	}

	// Helper tính tổng
	private recalculateCart(cart: Cart) {
		cart.totalPrice = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
		cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
	}
}
