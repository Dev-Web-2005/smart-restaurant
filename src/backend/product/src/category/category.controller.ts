import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CategoryService } from './category.service';

import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import {
	CreateCategoryRequestDto,
	GetCategoriesRequestDto,
	UpdateCategoryRequestDto,
	UpdateCategoryStatusRequestDto,
	DeleteCategoryRequestDto,
} from 'src/category/dtos/request';
import { ConfigService } from '@nestjs/config';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';

@Controller()
export class CategoryController {
	constructor(
		private readonly categoryService: CategoryService,
		private readonly config: ConfigService,
	) {}

	validateApiKey(providedKey: string) {
		const expectedApiKey = this.config.get<string>('PRODUCT_API_KEY');
		if (providedKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
	}

	@MessagePattern('categories:create')
	async createCategory(dto: CreateCategoryRequestDto) {
		return handleRpcCall(async () => {
			this.validateApiKey(dto.productApiKey);

			const category = await this.categoryService.createCategory(dto);
			return new HttpResponse(1000, 'Category created successfully', category);
		});
	}

	@MessagePattern('categories:get-all')
	async getCategories(dto: GetCategoriesRequestDto) {
		return handleRpcCall(async () => {
			this.validateApiKey(dto.productApiKey);

			const categories = await this.categoryService.getCategories(dto);
			return new HttpResponse(1000, 'Categories retrieved successfully', categories);
		});
	}

	@MessagePattern('categories:update')
	async updateCategory(dto: UpdateCategoryRequestDto) {
		return handleRpcCall(async () => {
			this.validateApiKey(dto.productApiKey);

			const category = await this.categoryService.updateCategory(dto);
			return new HttpResponse(1000, 'Category updated successfully', category);
		});
	}

	@MessagePattern('categories:update-status')
	async updateCategoryStatus(dto: UpdateCategoryStatusRequestDto) {
		return handleRpcCall(async () => {
			this.validateApiKey(dto.productApiKey);

			const category = await this.categoryService.updateCategoryStatus(dto);
			return new HttpResponse(1000, 'Category status updated successfully', category);
		});
	}

	@MessagePattern('categories:delete')
	async deleteCategory(dto: DeleteCategoryRequestDto) {
		return handleRpcCall(async () => {
			this.validateApiKey(dto.productApiKey);

			await this.categoryService.deleteCategory(dto);
			return new HttpResponse(1000, 'Category deleted successfully');
		});
	}
}
