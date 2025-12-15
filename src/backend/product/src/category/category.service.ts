import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCategory } from 'src/common/entities';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { CategoryResponseDto } from './dtos/response/category-response.dto';
import {
	CreateCategoryRequestDto,
	GetCategoriesRequestDto,
	UpdateCategoryRequestDto,
	PublishCategoryRequestDto,
	DeleteCategoryRequestDto,
} from 'src/category/dtos/request';

@Injectable()
export class CategoryService {
	constructor(
		@InjectRepository(MenuCategory)
		private readonly categoryRepository: Repository<MenuCategory>,
		private readonly configService: ConfigService,
	) {}

	async createCategory(dto: CreateCategoryRequestDto): Promise<CategoryResponseDto> {
		const category = this.categoryRepository.create({
			tenantId: dto.tenantId,
			name: dto.name,
			description: dto.description,
			published: false,
			displayOrder: 0,
		});

		const saved = await this.categoryRepository.save(category);
		return this.toResponseDto(saved);
	}

	async getCategories(dto: GetCategoriesRequestDto): Promise<CategoryResponseDto[]> {
		const categories = await this.categoryRepository.find({
			where: { tenantId: dto.tenantId },
			order: { displayOrder: 'ASC', createdAt: 'ASC' },
		});

		return categories.map((cat) => this.toResponseDto(cat));
	}

	async updateCategory(dto: UpdateCategoryRequestDto): Promise<CategoryResponseDto> {
		const category = await this.categoryRepository.findOne({
			where: { id: dto.categoryId, tenantId: dto.tenantId },
		});

		if (!category) {
			throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
		}

		if (dto.name) category.name = dto.name;
		if (dto.description !== undefined) category.description = dto.description;

		const updated = await this.categoryRepository.save(category);
		return this.toResponseDto(updated);
	}

	async publishCategory(dto: PublishCategoryRequestDto): Promise<CategoryResponseDto> {
		const category = await this.categoryRepository.findOne({
			where: { id: dto.categoryId, tenantId: dto.tenantId },
		});

		if (!category) {
			throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
		}

		category.published = dto.published;
		const updated = await this.categoryRepository.save(category);
		return this.toResponseDto(updated);
	}

	async deleteCategory(dto: DeleteCategoryRequestDto): Promise<void> {
		const category = await this.categoryRepository.findOne({
			where: { id: dto.categoryId, tenantId: dto.tenantId },
		});

		if (!category) {
			throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
		}

		await this.categoryRepository.remove(category);
	}

	private toResponseDto(category: MenuCategory): CategoryResponseDto {
		return {
			id: category.id,
			tenantId: category.tenantId,
			name: category.name,
			description: category.description,
			published: category.published,
			displayOrder: category.displayOrder,
			createdAt: category.createdAt,
		};
	}
}
