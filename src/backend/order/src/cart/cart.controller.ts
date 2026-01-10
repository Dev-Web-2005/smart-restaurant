import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CartService } from './cart.service';
import { AddToCartDto } from './dtos/request/add-to-cart.dto';
import HttpResponse from '@shared/utils/http-response'; // Giả sử bạn có util này

@Controller()
export class CartController {
	constructor(private readonly cartService: CartService) {}

	@MessagePattern('cart:get')
	async getCart(@Payload() data: { tenantId: string; tableId: string }) {
		const cart = await this.cartService.getCart(data.tenantId, data.tableId);
		return new HttpResponse(1000, 'Get cart success', cart);
	}

	@MessagePattern('cart:add')
	async addToCart(@Payload() dto: AddToCartDto) {
		const cart = await this.cartService.addToCart(dto);
		return new HttpResponse(1000, 'Item added to cart', cart);
	}

	@MessagePattern('cart:remove-item')
	async removeItem(
		@Payload() data: { tenantId: string; tableId: string; menuItemId: string },
	) {
		const cart = await this.cartService.removeItem(
			data.tenantId,
			data.tableId,
			data.menuItemId,
		);
		return new HttpResponse(1000, 'Item removed', cart);
	}

	@MessagePattern('cart:clear')
	async clearCart(@Payload() data: { tenantId: string; tableId: string }) {
		await this.cartService.clearCart(data.tenantId, data.tableId);
		return new HttpResponse(1000, 'Cart cleared', null);
	}
}
