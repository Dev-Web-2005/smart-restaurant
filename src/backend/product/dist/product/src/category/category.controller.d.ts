import { CategoryService } from './category.service';
import HttpResponse from '@shared/utils/http-response';
import { CreateCategoryRequestDto, GetCategoriesRequestDto, UpdateCategoryRequestDto, UpdateCategoryStatusRequestDto, DeleteCategoryRequestDto } from 'src/category/dtos/request';
import { ConfigService } from '@nestjs/config';
export declare class CategoryController {
    private readonly categoryService;
    private readonly config;
    constructor(categoryService: CategoryService, config: ConfigService);
    validateApiKey(providedKey: string): void;
    createCategory(dto: CreateCategoryRequestDto): Promise<HttpResponse>;
    getCategories(dto: GetCategoriesRequestDto): Promise<HttpResponse>;
    updateCategory(dto: UpdateCategoryRequestDto): Promise<HttpResponse>;
    updateCategoryStatus(dto: UpdateCategoryStatusRequestDto): Promise<HttpResponse>;
    deleteCategory(dto: DeleteCategoryRequestDto): Promise<HttpResponse>;
}
