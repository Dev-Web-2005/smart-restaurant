import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CartService } from './cart.service';
import { AddToCartDto } from './dtos/request/add-to-cart.dto';
import { UpdateCartItemQuantityDto } from './dtos/request/update-cart-item-quantity.dto';
import { GetCartDto } from './dtos/request/get-cart.dto';
import { RemoveCartItemDto } from './dtos/request/remove-cart-item.dto';
import HttpResponse from '@shared/utils/http-response';

@Controller()
export class CartController {
	constructor(private readonly cartService: CartService) {}

	@MessagePattern('cart:get')
	async getCart(@Payload() dto: GetCartDto) {
		const cart = await this.cartService.getCart(dto.tenantId, dto.tableId);
		return new HttpResponse(1000, 'Get cart success', cart);
	}

	@MessagePattern('cart:add')
	async addToCart(@Payload() dto: AddToCartDto) {
		const cart = await this.cartService.addToCart(dto);
		return new HttpResponse(1000, 'Item added to cart', cart);
	}

	@MessagePattern('cart:update-quantity')
	async updateQuantity(@Payload() dto: UpdateCartItemQuantityDto) {
		const cart = await this.cartService.updateItemQuantity(dto);
		return new HttpResponse(1000, 'Cart item quantity updated', cart);
	}

	@MessagePattern('cart:remove-item')
	async removeItem(@Payload() dto: RemoveCartItemDto) {
		const cart = await this.cartService.removeItem(
			dto.tenantId,
			dto.tableId,
			dto.menuItemId,
		);
		return new HttpResponse(1000, 'Item removed', cart);
	}

	@MessagePattern('cart:clear')
	async clearCart(@Payload() dto: GetCartDto) {
		await this.cartService.clearCart(dto.tenantId, dto.tableId);
		return new HttpResponse(1000, 'Cart cleared', null);
	}
}
