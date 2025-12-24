import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MenuCategory, MenuItem } from 'src/common/entities';
import { CategoryStatus, categoryStatusToString, MenuItemStatus } from 'src/common/enums';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { CategoryResponseDto } from './dtos/response/category-response.dto';
import {
	CreateCategoryRequestDto,
	GetCategoriesRequestDto,
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

		const category = this.categoryRepository.create({
			tenantId: dto.tenantId,
			name: dto.name,
			description: dto.description,
			status: dto.status ?? CategoryStatus.ACTIVE,
			displayOrder: dto.displayOrder ?? 0,
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
			queryBuilder.andWhere('category.status = :status', { status: dto.status });
		}

		if (dto.search) {
			queryBuilder.andWhere('category.name ILIKE :search', {
				search: `%${dto.search}%`,
			});
		}

		// Apply sorting
		const sortBy = dto.sortBy || CategorySortBy.DISPLAY_ORDER;
		const sortOrder = dto.sortOrder || SortOrder.ASC;

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

		const categories = await queryBuilder.getMany();

		return categories.map((cat) => this.toResponseDto(cat, cat.items?.length || 0));
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
		if (dto.status !== undefined) category.status = dto.status;
		if (dto.displayOrder !== undefined) category.displayOrder = dto.displayOrder;

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

		category.status = dto.status;
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
			itemCount: itemCount,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
		};
	}
}
