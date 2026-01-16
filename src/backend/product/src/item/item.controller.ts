import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ItemService } from './item.service';
import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import {
	CreateMenuItemRequestDto,
	GetMenuItemsRequestDto,
	GetMenuItemRequestDto,
	UpdateMenuItemRequestDto,
	UpdateMenuItemStatusRequestDto,
	DeleteMenuItemRequestDto,
	AddMenuItemPhotoRequestDto,
	UpdateMenuItemPhotoRequestDto,
	SetPrimaryPhotoRequestDto,
	DeleteMenuItemPhotoRequestDto,
	GetMenuItemPhotosRequestDto,
} from 'src/item/dtos/request';

/**
 * ItemController
 *
 * Handles RPC messages for menu item management and photo operations
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
	 * Get single menu item by ID
	 * RPC Pattern: 'menu-items:get'
	 */
	@MessagePattern('menu-items:get')
	async getMenuItem(dto: GetMenuItemRequestDto) {
		return handleRpcCall(async () => {
			const menuItem = await this.itemService.getMenuItem(dto);
			return new HttpResponse(1000, 'Menu item retrieved successfully', menuItem);
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

	// ==================== PHOTO MANAGEMENT ====================

	/**
	 * Add a photo to a menu item
	 * RPC Pattern: 'menu-item-photos:add'
	 */
	@MessagePattern('menu-item-photos:add')
	async addMenuItemPhoto(dto: AddMenuItemPhotoRequestDto) {
		return handleRpcCall(async () => {
			const photo = await this.itemService.addMenuItemPhoto(dto);
			return new HttpResponse(1000, 'Photo added successfully', photo);
		});
	}

	/**
	 * Get all photos for a menu item
	 * RPC Pattern: 'menu-item-photos:get-all'
	 */
	@MessagePattern('menu-item-photos:get-all')
	async getMenuItemPhotos(dto: GetMenuItemPhotosRequestDto) {
		return handleRpcCall(async () => {
			const result = await this.itemService.getMenuItemPhotos(dto);
			return new HttpResponse(1000, 'Photos retrieved successfully', result);
		});
	}

	/**
	 * Update photo details (order, primary status)
	 * RPC Pattern: 'menu-item-photos:update'
	 */
	@MessagePattern('menu-item-photos:update')
	async updateMenuItemPhoto(dto: UpdateMenuItemPhotoRequestDto) {
		return handleRpcCall(async () => {
			const photo = await this.itemService.updateMenuItemPhoto(dto);
			return new HttpResponse(1000, 'Photo updated successfully', photo);
		});
	}

	/**
	 * Set a photo as primary
	 * RPC Pattern: 'menu-item-photos:set-primary'
	 */
	@MessagePattern('menu-item-photos:set-primary')
	async setPrimaryPhoto(dto: SetPrimaryPhotoRequestDto) {
		return handleRpcCall(async () => {
			const photo = await this.itemService.setPrimaryPhoto(dto);
			return new HttpResponse(1000, 'Primary photo set successfully', photo);
		});
	}

	/**
	 * Delete a photo from a menu item
	 * RPC Pattern: 'menu-item-photos:delete'
	 */
	@MessagePattern('menu-item-photos:delete')
	async deleteMenuItemPhoto(dto: DeleteMenuItemPhotoRequestDto) {
		return handleRpcCall(async () => {
			await this.itemService.deleteMenuItemPhoto(dto);
			return new HttpResponse(1000, 'Photo deleted successfully');
		});
	}

	// ==================== POPULARITY MANAGEMENT ====================

	/**
	 * Increment order count for menu items
	 * RPC Pattern: 'menu-items:increment-order-count'
	 *
	 * Called by Order Service when items are ordered
	 */
	@MessagePattern('menu-items:increment-order-count')
	async incrementOrderCount(dto: {
		productApiKey: string;
		tenantId: string;
		itemIds: string[];
	}) {
		return handleRpcCall(async () => {
			const result = await this.itemService.incrementOrderCount(dto);
			return new HttpResponse(1000, 'Order count incremented successfully', result);
		});
	}

	/**
	 * Get most popular menu items
	 * RPC Pattern: 'menu-items:get-popular'
	 *
	 * Returns items sorted by orderCount (most popular first)
	 */
	@MessagePattern('menu-items:get-popular')
	async getPopularItems(dto: {
		productApiKey: string;
		tenantId: string;
		limit?: number;
		categoryId?: string;
	}) {
		return handleRpcCall(async () => {
			const result = await this.itemService.getPopularItems(dto);
			return new HttpResponse(1000, 'Popular items retrieved successfully', result);
		});
	}
}
