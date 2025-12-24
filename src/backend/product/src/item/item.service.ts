import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { MenuItem, MenuCategory } from 'src/common/entities';
import { MenuItemStatus, menuItemStatusToString } from 'src/common/enums';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import {
	MenuItemResponseDto,
	PaginatedMenuItemsResponseDto,
} from './dtos/response/menu-item-response.dto';
import {
	CreateMenuItemRequestDto,
	GetMenuItemsRequestDto,
	UpdateMenuItemRequestDto,
	UpdateMenuItemStatusRequestDto,
	DeleteMenuItemRequestDto,
	MenuItemSortBy,
	SortOrder,
} from 'src/item/dtos/request';

@Injectable()
export class ItemService {
	constructor(
		@InjectRepository(MenuItem)
		private readonly menuItemRepository: Repository<MenuItem>,
		@InjectRepository(MenuCategory)
		private readonly categoryRepository: Repository<MenuCategory>,
		private readonly configService: ConfigService,
	) {}

	private validateApiKey(providedKey: string): void {
		const validKey = this.configService.get<string>('PRODUCT_API_KEY');
		if (providedKey !== validKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
	}

	/**
	 * Create a new menu item
	 *
	 * Business Rules:
	 * - Category must exist and belong to same tenant
	 * - Name required, 2-80 characters
	 * - Price must be positive (0.01 to 999999)
	 * - Prep time 0-240 minutes
	 */
	async createMenuItem(dto: CreateMenuItemRequestDto): Promise<MenuItemResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Validate category exists and belongs to tenant
		const category = await this.categoryRepository.findOne({
			where: {
				id: dto.categoryId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!category) {
			throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
		}

		const menuItem = this.menuItemRepository.create({
			tenantId: dto.tenantId,
			categoryId: dto.categoryId,
			name: dto.name,
			description: dto.description,
			price: dto.price,
			currency: dto.currency || 'VND',
			prepTimeMinutes: dto.prepTimeMinutes,
			status: dto.status ?? MenuItemStatus.AVAILABLE,
			isChefRecommended: dto.isChefRecommended ?? false,
			imageUrl: dto.imageUrl,
		});

		const saved = await this.menuItemRepository.save(menuItem);
		return this.toResponseDto(saved, category.name);
	}

	/**
	 * Get menu items with filtering, sorting, and pagination
	 *
	 * Supports:
	 * - Filter by category, status, search by name, chef recommended
	 * - Sort by createdAt, price, name, popularity (future)
	 * - Pagination with page/limit
	 */
	async getMenuItems(
		dto: GetMenuItemsRequestDto,
	): Promise<PaginatedMenuItemsResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const queryBuilder = this.menuItemRepository
			.createQueryBuilder('item')
			.leftJoinAndSelect('item.category', 'category')
			.where('item.tenantId = :tenantId', { tenantId: dto.tenantId })
			.andWhere('item.deletedAt IS NULL');

		// Filter by category
		if (dto.categoryId) {
			queryBuilder.andWhere('item.categoryId = :categoryId', {
				categoryId: dto.categoryId,
			});
		}

		// Filter by status
		if (dto.status !== undefined) {
			queryBuilder.andWhere('item.status = :status', { status: dto.status });
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
		const sortBy = dto.sortBy || MenuItemSortBy.CREATED_AT;
		const sortOrder = dto.sortOrder || SortOrder.DESC;

		switch (sortBy) {
			case MenuItemSortBy.PRICE:
				queryBuilder.orderBy('item.price', sortOrder);
				break;
			case MenuItemSortBy.NAME:
				queryBuilder.orderBy('item.name', sortOrder);
				break;
			case MenuItemSortBy.POPULARITY:
				// Future: join with order_items and count
				queryBuilder.orderBy('item.createdAt', sortOrder);
				break;
			case MenuItemSortBy.CREATED_AT:
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
			items: items.map((item) => this.toResponseDto(item, item.category?.name)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Update an existing menu item
	 *
	 * Business Rules:
	 * - If category is changed, validate new category exists and belongs to tenant
	 * - All validation rules from create apply
	 */
	async updateMenuItem(dto: UpdateMenuItemRequestDto): Promise<MenuItemResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const menuItem = await this.menuItemRepository.findOne({
			where: {
				id: dto.menuItemId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
			relations: ['category'],
		});

		if (!menuItem) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		// If category is being changed, validate it
		if (dto.categoryId && dto.categoryId !== menuItem.categoryId) {
			const newCategory = await this.categoryRepository.findOne({
				where: {
					id: dto.categoryId,
					tenantId: dto.tenantId,
					deletedAt: IsNull(),
				},
			});

			if (!newCategory) {
				throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
			}

			menuItem.categoryId = dto.categoryId;
			menuItem.category = newCategory;
		}

		// Update fields
		if (dto.name !== undefined) menuItem.name = dto.name;
		if (dto.description !== undefined) menuItem.description = dto.description;
		if (dto.price !== undefined) menuItem.price = dto.price;
		if (dto.currency !== undefined) menuItem.currency = dto.currency;
		if (dto.prepTimeMinutes !== undefined) menuItem.prepTimeMinutes = dto.prepTimeMinutes;
		if (dto.status !== undefined) menuItem.status = dto.status;
		if (dto.isChefRecommended !== undefined)
			menuItem.isChefRecommended = dto.isChefRecommended;
		if (dto.imageUrl !== undefined) menuItem.imageUrl = dto.imageUrl;

		const updated = await this.menuItemRepository.save(menuItem);
		return this.toResponseDto(updated, menuItem.category?.name);
	}

	/**
	 * Update menu item status
	 *
	 * Used to change availability: AVAILABLE, UNAVAILABLE, SOLD_OUT
	 */
	async updateMenuItemStatus(
		dto: UpdateMenuItemStatusRequestDto,
	): Promise<MenuItemResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const menuItem = await this.menuItemRepository.findOne({
			where: {
				id: dto.menuItemId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
			relations: ['category'],
		});

		if (!menuItem) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		menuItem.status = dto.status;
		const updated = await this.menuItemRepository.save(menuItem);
		return this.toResponseDto(updated, menuItem.category?.name);
	}

	/**
	 * Soft delete a menu item
	 *
	 * Business Rules:
	 * - Uses soft delete to preserve order history
	 * - Item no longer appears in guest menu
	 */
	async deleteMenuItem(dto: DeleteMenuItemRequestDto): Promise<void> {
		this.validateApiKey(dto.productApiKey);

		const menuItem = await this.menuItemRepository.findOne({
			where: {
				id: dto.menuItemId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
		});

		if (!menuItem) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		// Soft delete using TypeORM
		await this.menuItemRepository.softDelete(menuItem.id);
	}

	/**
	 * Convert MenuItem entity to response DTO
	 * Converts status enum to uppercase string
	 */
	private toResponseDto(item: MenuItem, categoryName?: string): MenuItemResponseDto {
		return {
			id: item.id,
			tenantId: item.tenantId,
			categoryId: item.categoryId,
			categoryName,
			name: item.name,
			description: item.description,
			imageUrl: item.imageUrl,
			price: Number(item.price),
			currency: item.currency,
			prepTimeMinutes: item.prepTimeMinutes,
			status: menuItemStatusToString(item.status),
			isChefRecommended: item.isChefRecommended,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}
}
