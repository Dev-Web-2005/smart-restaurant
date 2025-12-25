import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { MenuCategory, MenuItem } from 'src/common/entities';
import { CategoryStatus, MenuItemStatus } from 'src/common/enums';
import {
	GetPublicMenuRequestDto,
	PublicMenuSortBy,
	SortOrder,
} from './dtos/request/get-public-menu-request.dto';
import {
	GetPublicMenuResponseDto,
	PublicMenuCategoryDto,
	PublicMenuItemDto,
	PaginatedPublicMenuResponseDto,
} from './dtos/response/public-menu-response.dto';

@Injectable()
export class PublicService {
	constructor(
		@InjectRepository(MenuCategory)
		private readonly categoryRepository: Repository<MenuCategory>,
		@InjectRepository(MenuItem)
		private readonly itemRepository: Repository<MenuItem>,
	) {}

	async getPublicMenu(
		dto: GetPublicMenuRequestDto,
	): Promise<GetPublicMenuResponseDto | PaginatedPublicMenuResponseDto> {
		// If pagination or filtering is requested, use flat item list
		if (
			dto.page ||
			dto.limit ||
			dto.categoryId ||
			dto.search ||
			dto.isChefRecommended !== undefined ||
			dto.sortBy
		) {
			return this.getPaginatedPublicMenu(dto);
		}

		// Otherwise, return grouped by categories (original behavior)
		return this.getGroupedPublicMenu(dto);
	}

	/**
	 * Get public menu grouped by categories (original behavior)
	 */
	private async getGroupedPublicMenu(
		dto: GetPublicMenuRequestDto,
	): Promise<GetPublicMenuResponseDto> {
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
			where: {
				categoryId: In(categoryIds),
				status: MenuItemStatus.AVAILABLE,
				deletedAt: IsNull(),
			},
			relations: [
				'photos',
				'modifierGroups',
				'modifierGroups.modifierGroup',
				'modifierGroups.modifierGroup.options',
			],
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

	/**
	 * Get public menu with filtering, sorting, and pagination
	 */
	private async getPaginatedPublicMenu(
		dto: GetPublicMenuRequestDto,
	): Promise<PaginatedPublicMenuResponseDto> {
		const queryBuilder = this.itemRepository
			.createQueryBuilder('item')
			.leftJoinAndSelect('item.photos', 'photos')
			.leftJoinAndSelect('item.modifierGroups', 'modifierGroups')
			.leftJoinAndSelect('modifierGroups.modifierGroup', 'modifierGroup')
			.leftJoinAndSelect('modifierGroup.options', 'options')
			.where('item.tenantId = :tenantId', { tenantId: dto.tenantId })
			.andWhere('item.status = :status', { status: MenuItemStatus.AVAILABLE })
			.andWhere('item.deletedAt IS NULL');

		// Filter by category
		if (dto.categoryId) {
			// Verify category is active
			const category = await this.categoryRepository.findOne({
				where: {
					id: dto.categoryId,
					tenantId: dto.tenantId,
					status: CategoryStatus.ACTIVE,
					deletedAt: IsNull(),
				},
			});

			if (category) {
				queryBuilder.andWhere('item.categoryId = :categoryId', {
					categoryId: dto.categoryId,
				});
			} else {
				// Category not found or inactive, return empty result
				return {
					tenantId: dto.tenantId,
					items: [],
					total: 0,
					page: dto.page || 1,
					limit: dto.limit || 20,
					totalPages: 0,
				};
			}
		} else {
			// Only show items from active categories
			const activeCategories = await this.categoryRepository.find({
				where: {
					tenantId: dto.tenantId,
					status: CategoryStatus.ACTIVE,
					deletedAt: IsNull(),
				},
				select: ['id'],
			});

			if (activeCategories.length === 0) {
				return {
					tenantId: dto.tenantId,
					items: [],
					total: 0,
					page: dto.page || 1,
					limit: dto.limit || 20,
					totalPages: 0,
				};
			}

			const activeCategoryIds = activeCategories.map((cat) => cat.id);
			queryBuilder.andWhere('item.categoryId IN (:...categoryIds)', {
				categoryIds: activeCategoryIds,
			});
		}

		// Filter by chef recommended
		if (dto.isChefRecommended !== undefined) {
			queryBuilder.andWhere('item.isChefRecommended = :isChefRecommended', {
				isChefRecommended: dto.isChefRecommended,
			});
		}

		// Search by name (case-insensitive)
		if (dto.search) {
			queryBuilder.andWhere('LOWER(item.name) LIKE LOWER(:search)', {
				search: `%${dto.search}%`,
			});
		}

		// Sorting
		const sortBy = dto.sortBy || PublicMenuSortBy.CREATED_AT;
		const sortOrder = dto.sortOrder || SortOrder.ASC;

		switch (sortBy) {
			case PublicMenuSortBy.PRICE:
				queryBuilder.orderBy('item.price', sortOrder);
				break;
			case PublicMenuSortBy.NAME:
				queryBuilder.orderBy('item.name', sortOrder);
				break;
			case PublicMenuSortBy.POPULARITY:
				// Future: join with order_items and count
				// For now, fallback to createdAt
				queryBuilder.orderBy('item.createdAt', sortOrder);
				break;
			case PublicMenuSortBy.CREATED_AT:
			default:
				queryBuilder.orderBy('item.createdAt', sortOrder);
				break;
		}

		// Pagination
		const page = dto.page && dto.page > 0 ? dto.page : 1;
		const limit = dto.limit && dto.limit > 0 ? Math.min(dto.limit, 100) : 20;
		const skip = (page - 1) * limit;

		queryBuilder.skip(skip).take(limit);

		const [items, total] = await queryBuilder.getManyAndCount();

		return {
			tenantId: dto.tenantId,
			items: items.map((item) => this.toPublicItemDto(item)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
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

		// Transform modifier groups
		const modifierGroups =
			item.modifierGroups
				?.filter((itemGroup) => itemGroup.modifierGroup?.isActive)
				.sort((a, b) => a.displayOrder - b.displayOrder)
				.map((itemGroup) => ({
					id: itemGroup.modifierGroup.id,
					name: itemGroup.modifierGroup.name,
					displayOrder: itemGroup.displayOrder,
					isRequired: itemGroup.isRequired,
					minSelections: itemGroup.minSelections,
					maxSelections: itemGroup.maxSelections,
					options: itemGroup.modifierGroup.options
						?.filter((opt) => opt.isActive)
						.sort((a, b) => a.displayOrder - b.displayOrder)
						.map((opt) => ({
							id: opt.id,
							label: opt.label,
							priceDelta: Number(opt.priceDelta),
							displayOrder: opt.displayOrder,
						})),
				})) || [];
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
			status: item.status === MenuItemStatus.AVAILABLE ? 'AVAILABLE' : 'UNAVAILABLE',
			modifierGroups,
		};
	}
}
