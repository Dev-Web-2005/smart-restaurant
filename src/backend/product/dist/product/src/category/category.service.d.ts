import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { MenuCategory } from 'src/common/entities';
import { CategoryResponseDto } from './dtos/response/category-response.dto';
import { CreateCategoryRequestDto, GetCategoriesRequestDto, UpdateCategoryRequestDto, PublishCategoryRequestDto, DeleteCategoryRequestDto } from 'src/category/dtos/request';
export declare class CategoryService {
    private readonly categoryRepository;
    private readonly configService;
    constructor(categoryRepository: Repository<MenuCategory>, configService: ConfigService);
    private validateApiKey;
    createCategory(dto: CreateCategoryRequestDto): Promise<CategoryResponseDto>;
    getCategories(dto: GetCategoriesRequestDto): Promise<CategoryResponseDto[]>;
    updateCategory(dto: UpdateCategoryRequestDto): Promise<CategoryResponseDto>;
    publishCategory(dto: PublishCategoryRequestDto): Promise<CategoryResponseDto>;
    deleteCategory(dto: DeleteCategoryRequestDto): Promise<void>;
    private toResponseDto;
}
