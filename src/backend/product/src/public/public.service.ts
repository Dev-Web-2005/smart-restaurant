import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory, MenuItem, ModifierOption } from 'src/common/entities';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { GetPublicMenuRequestDto } from './dtos/request/get-public-menu-request.dto';
import {
	GetPublicMenuResponseDto,
	PublicMenuCategoryDto,
	PublicMenuItemDto,
	PublicModifierDto,
} from './dtos/response/public-menu-response.dto';

@Injectable()
export class PublicService {
	constructor(
		@InjectRepository(MenuCategory)
		private readonly categoryRepository: Repository<MenuCategory>,
		@InjectRepository(MenuItem)
		private readonly itemRepository: Repository<MenuItem>,
		@InjectRepository(ModifierOption)
		private readonly modifierRepository: Repository<ModifierOption>,
	) {}

	async getPublicMenu(dto: GetPublicMenuRequestDto): Promise<GetPublicMenuResponseDto> {
		// Get all published categories for this tenant
		const categories = await this.categoryRepository.find({
			where: { tenantId: dto.tenantId, published: true },
			order: { displayOrder: 'ASC', createdAt: 'ASC' },
		});

		if (categories.length === 0) {
			return {
				tenantId: dto.tenantId,
				categories: [],
			};
		}

		const categoryIds = categories.map((cat) => cat.id);

		// Get all published AND available items in these categories
		const items = await this.itemRepository.find({
			where: categoryIds.map((catId) => ({
				categoryId: catId,
				published: true,
				available: true,
			})),
			relations: ['modifiers'],
			order: { createdAt: 'ASC' },
		});

		// Group items by category
		const categoriesWithItems: PublicMenuCategoryDto[] = categories.map((category) => {
			const categoryItems = items.filter((item) => item.categoryId === category.id);

			return {
				id: category.id,
				name: category.name,
				description: category.description,
				items: categoryItems.map((item) => this.toPublicItemDto(item)),
			};
		});

		// Filter out categories with no items
		const filteredCategories = categoriesWithItems.filter((cat) => cat.items.length > 0);

		return {
			tenantId: dto.tenantId,
			categories: filteredCategories,
		};
	}

	private toPublicItemDto(item: MenuItem): PublicMenuItemDto {
		return {
			id: item.id,
			categoryId: item.categoryId,
			name: item.name,
			description: item.description,
			imageUrl: item.imageUrl,
			price: Number(item.price),
			currency: item.currency,
			available: item.available,
			modifiers: (item.modifiers || []).map((mod) => this.toPublicModifierDto(mod)),
		};
	}

	private toPublicModifierDto(modifier: ModifierOption): PublicModifierDto {
		return {
			id: modifier.id,
			groupName: modifier.groupName,
			label: modifier.label,
			priceDelta: Number(modifier.priceDelta),
			type: modifier.type,
		};
	}
}
