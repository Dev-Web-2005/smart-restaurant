import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ModifierService } from './modifier.service';
import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import {
	CreateModifierGroupRequestDto,
	GetModifierGroupsRequestDto,
	UpdateModifierGroupRequestDto,
	DeleteModifierGroupRequestDto,
	CreateModifierOptionRequestDto,
	GetModifierOptionsRequestDto,
	UpdateModifierOptionRequestDto,
	DeleteModifierOptionRequestDto,
	AttachModifierGroupsRequestDto,
	DetachModifierGroupRequestDto,
	GetMenuItemModifierGroupsRequestDto,
} from './dtos/request';

/**
 * ModifierController
 *
 * Handles RPC messages for modifier group and option management
 * Implements CRUD operations for modifiers and attaching them to menu items
 */
@Controller()
export class ModifierController {
	constructor(private readonly modifierService: ModifierService) {}

	// ==================== MODIFIER GROUPS ====================

	@MessagePattern('modifier-groups:create')
	async createModifierGroup(dto: CreateModifierGroupRequestDto) {
		return handleRpcCall(async () => {
			const group = await this.modifierService.createModifierGroup(dto);
			return new HttpResponse(1000, 'Modifier group created successfully', group);
		});
	}

	@MessagePattern('modifier-groups:get-all')
	async getModifierGroups(dto: GetModifierGroupsRequestDto) {
		return handleRpcCall(async () => {
			const groups = await this.modifierService.getModifierGroups(dto);
			return new HttpResponse(1000, 'Modifier groups retrieved successfully', groups);
		});
	}

	@MessagePattern('modifier-groups:update')
	async updateModifierGroup(dto: UpdateModifierGroupRequestDto) {
		return handleRpcCall(async () => {
			const group = await this.modifierService.updateModifierGroup(dto);
			return new HttpResponse(1000, 'Modifier group updated successfully', group);
		});
	}

	@MessagePattern('modifier-groups:delete')
	async deleteModifierGroup(dto: DeleteModifierGroupRequestDto) {
		return handleRpcCall(async () => {
			await this.modifierService.deleteModifierGroup(dto);
			return new HttpResponse(1000, 'Modifier group deleted successfully');
		});
	}

	// ==================== MODIFIER OPTIONS ====================

	@MessagePattern('modifier-options:create')
	async createModifierOption(dto: CreateModifierOptionRequestDto) {
		return handleRpcCall(async () => {
			const option = await this.modifierService.createModifierOption(dto);
			return new HttpResponse(1000, 'Modifier option created successfully', option);
		});
	}

	@MessagePattern('modifier-options:get-all')
	async getModifierOptions(dto: GetModifierOptionsRequestDto) {
		return handleRpcCall(async () => {
			const options = await this.modifierService.getModifierOptions(dto);
			return new HttpResponse(1000, 'Modifier options retrieved successfully', options);
		});
	}

	@MessagePattern('modifier-options:update')
	async updateModifierOption(dto: UpdateModifierOptionRequestDto) {
		return handleRpcCall(async () => {
			const option = await this.modifierService.updateModifierOption(dto);
			return new HttpResponse(1000, 'Modifier option updated successfully', option);
		});
	}

	@MessagePattern('modifier-options:delete')
	async deleteModifierOption(dto: DeleteModifierOptionRequestDto) {
		return handleRpcCall(async () => {
			await this.modifierService.deleteModifierOption(dto);
			return new HttpResponse(1000, 'Modifier option deleted successfully');
		});
	}

	// ==================== MENU ITEM <-> MODIFIER GROUPS ====================

	@MessagePattern('menu-item-modifiers:attach')
	async attachModifierGroups(dto: AttachModifierGroupsRequestDto) {
		return handleRpcCall(async () => {
			const result = await this.modifierService.attachModifierGroups(dto);
			return new HttpResponse(
				1000,
				'Modifier groups attached to menu item successfully',
				result,
			);
		});
	}

	@MessagePattern('menu-item-modifiers:detach')
	async detachModifierGroup(dto: DetachModifierGroupRequestDto) {
		return handleRpcCall(async () => {
			await this.modifierService.detachModifierGroup(dto);
			return new HttpResponse(
				1000,
				'Modifier group detached from menu item successfully',
			);
		});
	}

	@MessagePattern('menu-item-modifiers:get-all')
	async getMenuItemModifierGroups(dto: GetMenuItemModifierGroupsRequestDto) {
		return handleRpcCall(async () => {
			const result = await this.modifierService.getMenuItemModifierGroups(dto);
			return new HttpResponse(
				1000,
				'Menu item modifier groups retrieved successfully',
				result,
			);
		});
	}
}
