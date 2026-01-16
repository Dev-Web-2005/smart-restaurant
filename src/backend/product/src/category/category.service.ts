import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MenuCategory, MenuItem } from 'src/common/entities';
import {
	CategoryStatus,
	categoryStatusToString,
	categoryStatusFromString,
	MenuItemStatus,
} from 'src/common/enums';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { CategoryResponseDto } from './dtos/response/category-response.dto';
import {
	CreateCategoryRequestDto,
	GetCategoriesRequestDto,
	GetCategoryRequestDto,
	UpdateCategoryRequestDto,
	UpdateCategoryStatusRequestDto,
	DeleteCategoryRequestDto,
	CategorySortBy,
	SortOrder,
} from 'src/category/dtos/request';

@Injectable()
export class CategoryService {
	constructor(
		@InjectRepository(MenuCategory)
		private readonly categoryRepository: Repository<MenuCategory>,
		@InjectRepository(MenuItem)
		private readonly menuItemRepository: Repository<MenuItem>,
		private readonly configService: ConfigService,
	) {}

	async createCategory(dto: CreateCategoryRequestDto): Promise<CategoryResponseDto> {
		// Check for duplicate category name within tenant
		const existingCategory = await this.categoryRepository.findOne({
			where: {
				tenantId: dto.tenantId,
				name: dto.name,
				deletedAt: IsNull(),
			},
		});

		if (existingCategory) {
			throw new AppException(ErrorCode.CATEGORY_NAME_ALREADY_EXISTS);
		}

		// Convert string status to enum if needed
		let statusValue = CategoryStatus.ACTIVE; // Default
		if (dto.status !== undefined) {
			// If status is already a number (enum), use it; otherwise convert from string
			statusValue =
				typeof dto.status === 'number'
					? dto.status
					: categoryStatusFromString(dto.status as unknown as string);
		}

		const category = this.categoryRepository.create({
			tenantId: dto.tenantId,
			name: dto.name,
			description: dto.description,
			status: statusValue,
			displayOrder: dto.displayOrder ?? 0,
			imageUrl: dto.imageUrl,
		});

		const saved = await this.categoryRepository.save(category);
		return this.toResponseDto(saved);
	}

	async getCategories(dto: GetCategoriesRequestDto): Promise<CategoryResponseDto[]> {
		const queryBuilder = this.categoryRepository
			.createQueryBuilder('category')
			.leftJoinAndSelect('category.items', 'items', 'items.deletedAt IS NULL')
			.where('category.tenantId = :tenantId', { tenantId: dto.tenantId })
			.andWhere('category.deletedAt IS NULL');

		// Apply filters
		if (dto.status !== undefined) {
			// Convert string status to enum if needed
			const statusValue =
				typeof dto.status === 'number'
					? dto.status
					: categoryStatusFromString(dto.status as unknown as string);
			queryBuilder.andWhere('category.status = :status', { status: statusValue });
		}

		// Fuzzy search using pg_trgm with similarity ranking
		if (dto.search) {
			const searchTerm = dto.search.trim();

			// Use pg_trgm similarity operator (%) for fuzzy matching
			// Searches both name and description with similarity threshold
			queryBuilder.andWhere(
				`(
					category.name % :search OR 
					category.description % :search OR
					category.name ILIKE :searchPattern OR
					category.description ILIKE :searchPattern
				)`,
				{
					search: searchTerm,
					searchPattern: `%${searchTerm}%`,
				},
			);

			// Add similarity score for ranking
			queryBuilder.addSelect(
				`GREATEST(
					similarity(category.name, :search),
					similarity(COALESCE(category.description, ''), :search)
				)`,
				'similarity_score',
			);
		}

		// Apply sorting
		const sortBy = dto.sortBy || CategorySortBy.DISPLAY_ORDER;
		const sortOrder = dto.sortOrder || SortOrder.ASC;

		// If search is active and no explicit sort specified, prioritize by similarity
		if (dto.search && !dto.sortBy) {
			queryBuilder.orderBy('similarity_score', 'DESC');
			queryBuilder.addOrderBy('category.displayOrder', 'ASC');
		} else {
			switch (sortBy) {
				case CategorySortBy.NAME:
					queryBuilder.orderBy('category.name', sortOrder);
					break;
				case CategorySortBy.CREATED_AT:
					queryBuilder.orderBy('category.createdAt', sortOrder);
					break;
				case CategorySortBy.DISPLAY_ORDER:
				default:
					queryBuilder.orderBy('category.displayOrder', sortOrder);
					queryBuilder.addOrderBy('category.createdAt', SortOrder.ASC);
					break;
			}
		}

		const categories = await queryBuilder.getMany();

		return categories.map((cat) => this.toResponseDto(cat, cat.items?.length || 0));
	}

	async getCategory(dto: GetCategoryRequestDto): Promise<CategoryResponseDto> {
		const category = await this.categoryRepository.findOne({
			where: {
				id: dto.categoryId,
				tenantId: dto.tenantId,
				deletedAt: IsNull(),
			},
			relations: ['items'],
		});

		if (!category) {
			throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
		}

		// Count only non-deleted items
		const itemCount = category.items?.filter((item) => !item.deletedAt).length || 0;

		return this.toResponseDto(category, itemCount);
	}

	async updateCategory(dto: UpdateCategoryRequestDto): Promise<CategoryResponseDto> {
		const category = await this.categoryRepository.findOne({
			where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: IsNull() },
		});

		if (!category) {
			throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
		}

		// Check for duplicate name if updating name
		if (dto.name && dto.name !== category.name) {
			const duplicateCategory = await this.categoryRepository.findOne({
				where: {
					tenantId: dto.tenantId,
					name: dto.name,
					deletedAt: IsNull(),
				},
			});

			if (duplicateCategory && duplicateCategory.id !== category.id) {
				throw new AppException(ErrorCode.CATEGORY_NAME_ALREADY_EXISTS);
			}
		}

		if (dto.name !== undefined) category.name = dto.name;
		if (dto.description !== undefined) category.description = dto.description;
		if (dto.status !== undefined) {
			// Convert string status to enum if needed
			category.status =
				typeof dto.status === 'number'
					? dto.status
					: categoryStatusFromString(dto.status as unknown as string);
		}
		if (dto.displayOrder !== undefined) category.displayOrder = dto.displayOrder;
		if (dto.imageUrl !== undefined) category.imageUrl = dto.imageUrl;

		const updated = await this.categoryRepository.save(category);
		return this.toResponseDto(updated);
	}

	async updateCategoryStatus(
		dto: UpdateCategoryStatusRequestDto,
	): Promise<CategoryResponseDto> {
		const category = await this.categoryRepository.findOne({
			where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: IsNull() },
		});

		if (!category) {
			throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
		}

		// Convert string status to enum if needed
		category.status =
			typeof dto.status === 'number'
				? dto.status
				: categoryStatusFromString(dto.status as unknown as string);

		const updated = await this.categoryRepository.save(category);
		return this.toResponseDto(updated);
	}

	async deleteCategory(dto: DeleteCategoryRequestDto): Promise<void> {
		const category = await this.categoryRepository.findOne({
			where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: IsNull() },
			relations: ['items'],
		});

		if (!category) {
			throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
		}

		// Check if category has active items
		const activeItemsCount = await this.menuItemRepository.count({
			where: {
				categoryId: dto.categoryId,
				tenantId: dto.tenantId,
				status: MenuItemStatus.AVAILABLE,
				deletedAt: IsNull(),
			},
		});

		if (activeItemsCount > 0) {
			throw new AppException(ErrorCode.CATEGORY_HAS_ACTIVE_ITEMS);
		}

		// Soft delete
		await this.categoryRepository.softRemove(category);
	}

	private toResponseDto(category: MenuCategory, itemCount?: number): CategoryResponseDto {
		return {
			id: category.id,
			tenantId: category.tenantId,
			name: category.name,
			description: category.description,
			status: categoryStatusToString(category.status), // Convert integer to string
			displayOrder: category.displayOrder,
			imageUrl: category.imageUrl,
			itemCount: itemCount,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
		};
	}
}
