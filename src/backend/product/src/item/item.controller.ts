import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ItemService } from './item.service';

import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import {
	CreateItemRequestDto,
	GetItemsRequestDto,
	UpdateItemRequestDto,
	PublishItemRequestDto,
	DeleteItemRequestDto,
	AddModifiersRequestDto,
} from 'src/item/dtos/request';

@Controller()
export class ItemController {
	constructor(private readonly itemService: ItemService) {}

	@MessagePattern('items:create')
	async createItem(dto: CreateItemRequestDto) {
		return handleRpcCall(async () => {
			const item = await this.itemService.createItem(dto);
			return new HttpResponse(1000, 'Menu item created successfully', item);
		});
	}

	@MessagePattern('items:get-all')
	async getItems(dto: GetItemsRequestDto) {
		return handleRpcCall(async () => {
			const items = await this.itemService.getItems(dto);
			return new HttpResponse(1000, 'Menu items retrieved successfully', items);
		});
	}

	@MessagePattern('items:update')
	async updateItem(dto: UpdateItemRequestDto) {
		return handleRpcCall(async () => {
			const item = await this.itemService.updateItem(dto);
			return new HttpResponse(1000, 'Menu item updated successfully', item);
		});
	}

	@MessagePattern('items:publish')
	async publishItem(dto: PublishItemRequestDto) {
		return handleRpcCall(async () => {
			const item = await this.itemService.publishItem(dto);
			return new HttpResponse(1000, 'Menu item publish status updated', item);
		});
	}

	@MessagePattern('items:delete')
	async deleteItem(dto: DeleteItemRequestDto) {
		return handleRpcCall(async () => {
			await this.itemService.deleteItem(dto);
			return new HttpResponse(1000, 'Menu item deleted successfully');
		});
	}

	@MessagePattern('items:add-modifiers')
	async addModifiers(dto: AddModifiersRequestDto) {
		return handleRpcCall(async () => {
			const item = await this.itemService.addModifiers(dto);
			return new HttpResponse(1000, 'Modifiers added successfully', item);
		});
	}
}
