import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { MenuCategory, MenuItem, ModifierOption } from 'src/common/entities';
import { CategoryStatus, MenuItemStatus, menuItemStatusToString } from 'src/common/enums';
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
		// Get all active categories for this tenant
		const categories = await this.categoryRepository.find({
			where: {
				tenantId: dto.tenantId,
				status: CategoryStatus.ACTIVE,
				deletedAt: IsNull(),
			},
			order: { displayOrder: 'ASC', createdAt: 'ASC' },
		});

		if (categories.length === 0) {
			return {
				tenantId: dto.tenantId,
				categories: [],
			};
		}

		const categoryIds = categories.map((cat) => cat.id);

		// Get all available items in these categories
		const items = await this.itemRepository.find({
			where: categoryIds.map((catId) => ({
				categoryId: catId,
				status: MenuItemStatus.AVAILABLE,
				deletedAt: IsNull(),
			})),
			relations: ['modifiers', 'photos'],
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
		// Get primary photo URL (first look for isPrimary=true, otherwise first photo by displayOrder)
		const sortedPhotos = item.photos?.sort((a, b) => {
			// Primary photos come first
			if (a.isPrimary && !b.isPrimary) return -1;
			if (!a.isPrimary && b.isPrimary) return 1;
			// Then sort by display order
			return a.displayOrder - b.displayOrder;
		});

		const primaryPhoto = sortedPhotos?.[0];

		return {
			id: item.id,
			categoryId: item.categoryId,
			name: item.name,
			description: item.description,
			imageUrl: primaryPhoto?.url,
			photos: sortedPhotos?.map((photo) => ({
				id: photo.id,
				url: photo.url,
				isPrimary: photo.isPrimary,
				displayOrder: photo.displayOrder,
			})),
			price: Number(item.price),
			currency: item.currency,
			prepTimeMinutes: item.prepTimeMinutes,
			isChefRecommended: item.isChefRecommended,
			status: menuItemStatusToString(item.status),
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
