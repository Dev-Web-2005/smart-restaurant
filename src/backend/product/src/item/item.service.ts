import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { MenuItem, MenuCategory, MenuItemPhoto } from 'src/common/entities';
import {
	MenuItemStatus,
	menuItemStatusToString,
	menuItemStatusFromString,
} from 'src/common/enums';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import {
	MenuItemResponseDto,
	PaginatedMenuItemsResponseDto,
} from './dtos/response/menu-item-response.dto';
import {
	MenuItemPhotoResponseDto,
	MenuItemPhotosListResponseDto,
} from './dtos/response/menu-item-photo-response.dto';
import {
	CreateMenuItemRequestDto,
	GetMenuItemsRequestDto,
	GetMenuItemRequestDto,
	UpdateMenuItemRequestDto,
	UpdateMenuItemStatusRequestDto,
	DeleteMenuItemRequestDto,
	MenuItemSortBy,
	SortOrder,
	AddMenuItemPhotoRequestDto,
	UpdateMenuItemPhotoRequestDto,
	SetPrimaryPhotoRequestDto,
	DeleteMenuItemPhotoRequestDto,
	GetMenuItemPhotosRequestDto,
} from 'src/item/dtos/request';

@Injectable()
export class ItemService {
	constructor(
		@InjectRepository(MenuItem)
		private readonly menuItemRepository: Repository<MenuItem>,
		@InjectRepository(MenuCategory)
		private readonly categoryRepository: Repository<MenuCategory>,
		@InjectRepository(MenuItemPhoto)
		private readonly photoRepository: Repository<MenuItemPhoto>,
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

		// Convert string status to enum if needed
		let statusValue = MenuItemStatus.AVAILABLE; // Default
		if (dto.status !== undefined) {
			// If status is already a number (enum), use it; otherwise convert from string
			statusValue =
				typeof dto.status === 'number'
					? dto.status
					: menuItemStatusFromString(dto.status as unknown as string);
		}

		const menuItem = this.menuItemRepository.create({
			tenantId: dto.tenantId,
			categoryId: dto.categoryId,
			name: dto.name,
			description: dto.description,
			price: dto.price,
			currency: dto.currency || 'VND',
			prepTimeMinutes: dto.prepTimeMinutes,
			status: statusValue,
			isChefRecommended: dto.isChefRecommended ?? false,
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
	 * - Includes photos sorted by isPrimary DESC, displayOrder ASC
	 */
	async getMenuItems(
		dto: GetMenuItemsRequestDto,
	): Promise<PaginatedMenuItemsResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const queryBuilder = this.menuItemRepository
			.createQueryBuilder('item')
			.leftJoinAndSelect('item.category', 'category')
			.leftJoinAndSelect('item.photos', 'photos')
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
			// Convert string status to enum if needed
			const statusValue =
				typeof dto.status === 'number'
					? dto.status
					: menuItemStatusFromString(dto.status as unknown as string);
			queryBuilder.andWhere('item.status = :status', { status: statusValue });
		}

		// Filter by chef recommended
		if (dto.isChefRecommended !== undefined) {
			queryBuilder.andWhere('item.isChefRecommended = :isChefRecommended', {
				isChefRecommended: dto.isChefRecommended,
			});
		}

		// Fuzzy search using pg_trgm with similarity ranking
		if (dto.search) {
			const searchTerm = dto.search.trim();

			// Use pg_trgm similarity operator (%) for fuzzy matching
			// Searches both name and description with similarity threshold
			// Default similarity threshold is 0.3 (configurable via set_limit)
			queryBuilder.andWhere(
				`(
					item.name % :search OR 
					item.description % :search OR
					item.name ILIKE :searchPattern OR
					item.description ILIKE :searchPattern
				)`,
				{
					search: searchTerm,
					searchPattern: `%${searchTerm}%`,
				},
			);

			// Add similarity score for ranking (higher similarity = better match)
			queryBuilder.addSelect(
				`GREATEST(
					similarity(item.name, :search),
					similarity(COALESCE(item.description, ''), :search)
				)`,
				'similarity_score',
			);
		}

		// Sorting
		const sortBy = dto.sortBy || MenuItemSortBy.CREATED_AT;
		const sortOrder = dto.sortOrder || SortOrder.DESC;

		// If search is active and no explicit sort specified, prioritize by similarity
		if (dto.search && !dto.sortBy) {
			queryBuilder.orderBy('similarity_score', 'DESC');
			queryBuilder.addOrderBy('item.name', 'ASC');
		} else {
			switch (sortBy) {
				case MenuItemSortBy.PRICE:
					queryBuilder.orderBy('item.price', sortOrder);
					break;
				case MenuItemSortBy.NAME:
					queryBuilder.orderBy('item.name', sortOrder);
					break;
				case MenuItemSortBy.POPULARITY:
					// Sort by order count (most popular first)
					queryBuilder.orderBy('item.orderCount', sortOrder);
					queryBuilder.addOrderBy('item.createdAt', 'DESC'); // Secondary sort by newest
					break;
				case MenuItemSortBy.CREATED_AT:
				default:
					queryBuilder.orderBy('item.createdAt', sortOrder);
					break;
			}
		}

		// Sort photos within each item (primary first, then by display order)
		queryBuilder.addOrderBy('photos.isPrimary', 'DESC');
		queryBuilder.addOrderBy('photos.displayOrder', 'ASC');

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
	 * Get single menu item by ID
	 *
	 * Business Rules:
	 * - Item must exist and belong to tenant
	 * - Returns full item details with category name and photos
	 */
	async getMenuItem(dto: GetMenuItemRequestDto): Promise<MenuItemResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const menuItem = await this.menuItemRepository.findOne({
			where: {
				id: dto.menuItemId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
			relations: ['category', 'photos'],
			order: {
				photos: {
					isPrimary: 'DESC',
					displayOrder: 'ASC',
				},
			},
		});

		if (!menuItem) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		return this.toResponseDto(menuItem, menuItem.category?.name);
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
		if (dto.status !== undefined) {
			// Convert string status to enum if needed
			menuItem.status =
				typeof dto.status === 'number'
					? dto.status
					: menuItemStatusFromString(dto.status as unknown as string);
		}
		if (dto.isChefRecommended !== undefined)
			menuItem.isChefRecommended = dto.isChefRecommended;

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

		// Convert string status to enum if needed
		menuItem.status =
			typeof dto.status === 'number'
				? dto.status
				: menuItemStatusFromString(dto.status as unknown as string);

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
	 * Includes photos if loaded (sorted by isPrimary DESC, displayOrder ASC)
	 */
	private toResponseDto(item: MenuItem, categoryName?: string): MenuItemResponseDto {
		return {
			id: item.id,
			tenantId: item.tenantId,
			categoryId: item.categoryId,
			categoryName,
			name: item.name,
			description: item.description,

			price: Number(item.price),
			currency: item.currency,
			prepTimeMinutes: item.prepTimeMinutes,
			status: menuItemStatusToString(item.status),
			isChefRecommended: item.isChefRecommended,
			orderCount: item.orderCount,
			photos: item.photos?.map((photo) => ({
				id: photo.id,
				url: photo.url,
				isPrimary: photo.isPrimary,
				displayOrder: photo.displayOrder,
			})),
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}

	// ==================== PHOTO MANAGEMENT ====================

	/**
	 * Add a new photo to a menu item
	 *
	 * Business Rules:
	 * - Item must exist and belong to tenant
	 * - If isPrimary=true, unset other primary photos
	 * - Validate file size (max 5MB) and MIME type (JPG/PNG/WebP)
	 */
	async addMenuItemPhoto(
		dto: AddMenuItemPhotoRequestDto,
	): Promise<MenuItemPhotoResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Validate item exists and belongs to tenant
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

		// If setting as primary, unset other primary photos for this item
		if (dto.isPrimary) {
			await this.photoRepository.update(
				{ menuItemId: dto.menuItemId, isPrimary: true },
				{ isPrimary: false },
			);
		}

		// Get next display order if not provided
		let displayOrder = dto.displayOrder ?? 0;
		if (displayOrder === 0) {
			const maxOrder = await this.photoRepository
				.createQueryBuilder('photo')
				.where('photo.menuItemId = :menuItemId', { menuItemId: dto.menuItemId })
				.select('MAX(photo.displayOrder)', 'max')
				.getRawOne();
			displayOrder = (maxOrder?.max ?? 0) + 1;
		}

		const photo = this.photoRepository.create({
			menuItemId: dto.menuItemId,
			url: dto.url,
			filename: dto.filename,
			isPrimary: dto.isPrimary ?? false,
			displayOrder,
			mimeType: dto.mimeType,
			fileSize: dto.fileSize,
		});

		const saved = await this.photoRepository.save(photo);
		return this.toPhotoResponseDto(saved);
	}

	/**
	 * Get all photos for a menu item
	 * Ordered by isPrimary DESC, displayOrder ASC
	 */
	async getMenuItemPhotos(
		dto: GetMenuItemPhotosRequestDto,
	): Promise<MenuItemPhotosListResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Validate item exists
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

		const photos = await this.photoRepository.find({
			where: { menuItemId: dto.menuItemId },
			order: {
				isPrimary: 'DESC',
				displayOrder: 'ASC',
			},
		});

		const primaryPhoto = photos.find((p) => p.isPrimary);

		return {
			menuItemId: dto.menuItemId,
			photos: photos.map((p) => this.toPhotoResponseDto(p)),
			primaryPhoto: primaryPhoto ? this.toPhotoResponseDto(primaryPhoto) : undefined,
			totalPhotos: photos.length,
		};
	}

	/**
	 * Update photo details (order, primary status)
	 */
	async updateMenuItemPhoto(
		dto: UpdateMenuItemPhotoRequestDto,
	): Promise<MenuItemPhotoResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Validate item exists
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

		const photo = await this.photoRepository.findOne({
			where: {
				id: dto.photoId,
				menuItemId: dto.menuItemId,
			},
		});

		if (!photo) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND); // Could add PHOTO_NOT_FOUND error code
		}

		// If setting as primary, unset other primary photos
		if (dto.isPrimary === true) {
			await this.photoRepository.update(
				{ menuItemId: dto.menuItemId, isPrimary: true },
				{ isPrimary: false },
			);
		}

		if (dto.isPrimary !== undefined) photo.isPrimary = dto.isPrimary;
		if (dto.displayOrder !== undefined) photo.displayOrder = dto.displayOrder;

		const updated = await this.photoRepository.save(photo);
		return this.toPhotoResponseDto(updated);
	}

	/**
	 * Set a photo as the primary photo
	 * Convenience method that unsets all other primary photos
	 */
	async setPrimaryPhoto(
		dto: SetPrimaryPhotoRequestDto,
	): Promise<MenuItemPhotoResponseDto> {
		this.validateApiKey(dto.productApiKey);

		// Validate item exists
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

		const photo = await this.photoRepository.findOne({
			where: {
				id: dto.photoId,
				menuItemId: dto.menuItemId,
			},
		});

		if (!photo) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		// Unset all primary photos for this item
		await this.photoRepository.update(
			{ menuItemId: dto.menuItemId, isPrimary: true },
			{ isPrimary: false },
		);

		// Set this photo as primary
		photo.isPrimary = true;
		const updated = await this.photoRepository.save(photo);
		return this.toPhotoResponseDto(updated);
	}

	/**
	 * Delete a photo from a menu item
	 */
	async deleteMenuItemPhoto(dto: DeleteMenuItemPhotoRequestDto): Promise<void> {
		this.validateApiKey(dto.productApiKey);

		// Validate item exists
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

		const photo = await this.photoRepository.findOne({
			where: {
				id: dto.photoId,
				menuItemId: dto.menuItemId,
			},
		});

		if (!photo) {
			throw new AppException(ErrorCode.ITEM_NOT_FOUND);
		}

		await this.photoRepository.remove(photo);
	}

	/**
	 * Convert MenuItemPhoto entity to response DTO
	 */
	private toPhotoResponseDto(photo: MenuItemPhoto): MenuItemPhotoResponseDto {
		return {
			id: photo.id,
			menuItemId: photo.menuItemId,
			url: photo.url,
			filename: photo.filename,
			isPrimary: photo.isPrimary,
			displayOrder: photo.displayOrder,
			mimeType: photo.mimeType,
			fileSize: photo.fileSize ? Number(photo.fileSize) : undefined,
			createdAt: photo.createdAt,
		};
	}

	/**
	 * Increment order count for menu items
	 * Called by Order Service when items are ordered
	 *
	 * Business Rules:
	 * - Increments orderCount atomically using SQL UPDATE
	 * - Can update multiple items at once (batch operation)
	 * - Only increments if item exists and belongs to tenant
	 */
	async incrementOrderCount(dto: {
		productApiKey: string;
		tenantId: string;
		itemIds: string[];
	}): Promise<{ success: boolean; updated: number }> {
		this.validateApiKey(dto.productApiKey);

		if (!dto.itemIds || dto.itemIds.length === 0) {
			return { success: true, updated: 0 };
		}

		// Atomic increment using query builder
		const result = await this.menuItemRepository
			.createQueryBuilder()
			.update(MenuItem)
			.set({
				orderCount: () => '"orderCount" + 1',
			})
			.where('id IN (:...itemIds)', { itemIds: dto.itemIds })
			.andWhere('tenantId = :tenantId', { tenantId: dto.tenantId })
			.andWhere('deletedAt IS NULL')
			.execute();

		return {
			success: true,
			updated: result.affected || 0,
		};
	}

	/**
	 * Get most popular menu items
	 * Returns items sorted by orderCount descending
	 *
	 * Use Cases:
	 * - Homepage "Popular Dishes" section
	 * - Recommendation engine
	 * - Analytics dashboard
	 */
	async getPopularItems(dto: {
		productApiKey: string;
		tenantId: string;
		limit?: number;
		categoryId?: string;
	}): Promise<PaginatedMenuItemsResponseDto> {
		this.validateApiKey(dto.productApiKey);

		const limit = dto.limit && dto.limit > 0 ? Math.min(dto.limit, 100) : 10;

		const queryBuilder = this.menuItemRepository
			.createQueryBuilder('item')
			.leftJoinAndSelect('item.category', 'category')
			.leftJoinAndSelect('item.photos', 'photos')
			.where('item.tenantId = :tenantId', { tenantId: dto.tenantId })
			.andWhere('item.deletedAt IS NULL')
			.andWhere('item.status = :status', { status: MenuItemStatus.AVAILABLE })
			.andWhere('item.orderCount > 0'); // Only items that have been ordered

		// Filter by category if specified
		if (dto.categoryId) {
			queryBuilder.andWhere('item.categoryId = :categoryId', {
				categoryId: dto.categoryId,
			});
		}

		// Sort by popularity (orderCount DESC)
		queryBuilder.orderBy('item.orderCount', 'DESC');
		queryBuilder.addOrderBy('item.createdAt', 'DESC');

		// Sort photos within each item
		queryBuilder.addOrderBy('photos.isPrimary', 'DESC');
		queryBuilder.addOrderBy('photos.displayOrder', 'ASC');

		queryBuilder.take(limit);

		const [items, total] = await queryBuilder.getManyAndCount();

		return {
			items: items.map((item) => this.toResponseDto(item, item.category?.name)),
			total,
			page: 1,
			limit,
			totalPages: 1,
		};
	}
}
