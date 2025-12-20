import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem, ModifierOption } from 'src/common/entities';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';

import { ItemResponseDto, ModifierResponseDto } from './dtos/response/item-response.dto';
import {
	CreateItemRequestDto,
	GetItemsRequestDto,
	UpdateItemRequestDto,
	PublishItemRequestDto,
	DeleteItemRequestDto,
	AddModifiersRequestDto,
} from 'src/item/dtos/request';

@Injectable()
export class ItemService {
	constructor(
		@InjectRepository(MenuItem)
		private readonly itemRepository: Repository<MenuItem>,
		@InjectRepository(ModifierOption)
		private readonly modifierRepository: Repository<ModifierOption>,
		private readonly configService: ConfigService,
	) {}

	private validateApiKey(providedKey: string): void {
		const validKey = this.configService.get<string>('PRODUCT_API_KEY');
		if (providedKey !== validKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
	}

	async createItem(dto: CreateItemRequestDto): Promise<ItemResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const item = this.itemRepository.create({
			tenantId: dto.tenantId,
			categoryId: dto.categoryId,
			name: dto.name,
			description: dto.description,
			imageUrl: dto.imageUrl,
			price: dto.price,
			currency: dto.currency || 'VND',
			available: dto.available !== undefined ? dto.available : true,
			published: false,
		});

		const saved = await this.itemRepository.save(item);
		return this.toResponseDto(saved, []);
	}

	async getItems(dto: GetItemsRequestDto): Promise<ItemResponseDto[]> {
		this.validateApiKey(dto.productApiKey);

		const where: any = { tenantId: dto.tenantId };
		if (dto.categoryId) {
			where.categoryId = dto.categoryId;
		}

		const items = await this.itemRepository.find({
			where,
			relations: ['modifiers'],
			order: { createdAt: 'DESC' },
		});

		return items.map((item) => this.toResponseDto(item, item.modifiers || []));
	}

	async updateItem(dto: UpdateItemRequestDto): Promise<ItemResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const item = await this.itemRepository.findOne({
			where: { id: dto.itemId, tenantId: dto.tenantId },
			relations: ['modifiers'],
		});

		if (!item) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		if (dto.name) item.name = dto.name;
		if (dto.description !== undefined) item.description = dto.description;
		if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl;
		if (dto.price !== undefined) item.price = dto.price;
		if (dto.currency) item.currency = dto.currency;
		if (dto.available !== undefined) item.available = dto.available;

		const updated = await this.itemRepository.save(item);
		return this.toResponseDto(updated, item.modifiers || []);
	}

	async publishItem(dto: PublishItemRequestDto): Promise<ItemResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const item = await this.itemRepository.findOne({
			where: { id: dto.itemId, tenantId: dto.tenantId },
			relations: ['modifiers'],
		});

		if (!item) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		item.published = dto.published;
		const updated = await this.itemRepository.save(item);
		return this.toResponseDto(updated, item.modifiers || []);
	}

	async deleteItem(dto: DeleteItemRequestDto): Promise<void> {
		this.validateApiKey(dto.productApiKey);

		const item = await this.itemRepository.findOne({
			where: { id: dto.itemId, tenantId: dto.tenantId },
		});

		if (!item) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		await this.itemRepository.remove(item);
	}

	async addModifiers(dto: AddModifiersRequestDto): Promise<ItemResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const item = await this.itemRepository.findOne({
			where: { id: dto.itemId, tenantId: dto.tenantId },
			relations: ['modifiers'],
		});

		if (!item) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		if (item.modifiers && item.modifiers.length > 0) {
			await this.modifierRepository.remove(item.modifiers);
		}

		// Create new modifiers
		const modifiers = dto.modifiers.map((mod) =>
			this.modifierRepository.create({
				itemId: dto.itemId,
				groupName: mod.groupName,
				label: mod.label,
				priceDelta: mod.priceDelta,
				type: mod.type,
			}),
		);

		const savedModifiers = await this.modifierRepository.save(modifiers);
		return this.toResponseDto(item, savedModifiers);
	}

	private toResponseDto(item: MenuItem, modifiers: ModifierOption[]): ItemResponseDto {
		return {
			id: item.id,
			tenantId: item.tenantId,
			categoryId: item.categoryId,
			name: item.name,
			description: item.description,
			imageUrl: item.imageUrl,
			price: Number(item.price),
			currency: item.currency,
			available: item.available,
			published: item.published,
			createdAt: item.createdAt,
			modifiers: modifiers.map((mod) => this.toModifierDto(mod)),
		};
	}

	private toModifierDto(modifier: ModifierOption): ModifierResponseDto {
		return {
			id: modifier.id,
			itemId: modifier.itemId,
			groupName: modifier.groupName,
			label: modifier.label,
			priceDelta: Number(modifier.priceDelta),
			type: modifier.type,
		};
	}
}
