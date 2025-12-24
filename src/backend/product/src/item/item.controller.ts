import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ItemService } from './item.service';
import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import {
	CreateMenuItemRequestDto,
	GetMenuItemsRequestDto,
	UpdateMenuItemRequestDto,
	UpdateMenuItemStatusRequestDto,
	DeleteMenuItemRequestDto,
} from 'src/item/dtos/request';

/**
 * ItemController
 *
 * Handles RPC messages for menu item management
 * Implements CRUD operations with filtering, sorting, and pagination
 */
@Controller()
export class ItemController {
	constructor(private readonly itemService: ItemService) {}

	/**
	 * Create a new menu item
	 * RPC Pattern: 'menu-items:create'
	 */
	@MessagePattern('menu-items:create')
	async createMenuItem(dto: CreateMenuItemRequestDto) {
		return handleRpcCall(async () => {
			const item = await this.itemService.createMenuItem(dto);
			return new HttpResponse(1000, 'Menu item created successfully', item);
		});
	}

	/**
	 * Get all menu items with filtering, sorting, and pagination
	 * RPC Pattern: 'menu-items:get-all'
	 */
	@MessagePattern('menu-items:get-all')
	async getMenuItems(dto: GetMenuItemsRequestDto) {
		return handleRpcCall(async () => {
			const result = await this.itemService.getMenuItems(dto);
			return new HttpResponse(1000, 'Menu items retrieved successfully', result);
		});
	}

	/**
	 * Update an existing menu item
	 * RPC Pattern: 'menu-items:update'
	 */
	@MessagePattern('menu-items:update')
	async updateMenuItem(dto: UpdateMenuItemRequestDto) {
		return handleRpcCall(async () => {
			const item = await this.itemService.updateMenuItem(dto);
			return new HttpResponse(1000, 'Menu item updated successfully', item);
		});
	}

	/**
	 * Update menu item status (AVAILABLE, UNAVAILABLE, SOLD_OUT)
	 * RPC Pattern: 'menu-items:update-status'
	 */
	@MessagePattern('menu-items:update-status')
	async updateMenuItemStatus(dto: UpdateMenuItemStatusRequestDto) {
		return handleRpcCall(async () => {
			const item = await this.itemService.updateMenuItemStatus(dto);
			return new HttpResponse(1000, 'Menu item status updated successfully', item);
		});
	}

	/**
	 * Soft delete a menu item
	 * RPC Pattern: 'menu-items:delete'
	 */
	@MessagePattern('menu-items:delete')
	async deleteMenuItem(dto: DeleteMenuItemRequestDto) {
		return handleRpcCall(async () => {
			await this.itemService.deleteMenuItem(dto);
			return new HttpResponse(1000, 'Menu item deleted successfully');
		});
	}
}
