import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { MenuCategory, MenuItem } from 'src/common/entities';
import { CategoryResponseDto } from './dtos/response/category-response.dto';
import { CreateCategoryRequestDto, GetCategoriesRequestDto, UpdateCategoryRequestDto, UpdateCategoryStatusRequestDto, DeleteCategoryRequestDto } from 'src/category/dtos/request';
export declare class CategoryService {
    private readonly categoryRepository;
    private readonly menuItemRepository;
    private readonly configService;
    constructor(categoryRepository: Repository<MenuCategory>, menuItemRepository: Repository<MenuItem>, configService: ConfigService);
    createCategory(dto: CreateCategoryRequestDto): Promise<CategoryResponseDto>;
    getCategories(dto: GetCategoriesRequestDto): Promise<CategoryResponseDto[]>;
    updateCategory(dto: UpdateCategoryRequestDto): Promise<CategoryResponseDto>;
    updateCategoryStatus(dto: UpdateCategoryStatusRequestDto): Promise<CategoryResponseDto>;
    deleteCategory(dto: DeleteCategoryRequestDto): Promise<void>;
    private toResponseDto;
}
