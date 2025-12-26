"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../common/entities");
const enums_1 = require("../common/enums");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const request_1 = require("./dtos/request");
let CategoryService = class CategoryService {
    categoryRepository;
    menuItemRepository;
    configService;
    constructor(categoryRepository, menuItemRepository, configService) {
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
        this.configService = configService;
    }
    async createCategory(dto) {
        const existingCategory = await this.categoryRepository.findOne({
            where: {
                tenantId: dto.tenantId,
                name: dto.name,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (existingCategory) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NAME_ALREADY_EXISTS);
        }
        let statusValue = enums_1.CategoryStatus.ACTIVE;
        if (dto.status !== undefined) {
            statusValue =
                typeof dto.status === 'number'
                    ? dto.status
                    : (0, enums_1.categoryStatusFromString)(dto.status);
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
    async getCategories(dto) {
        const queryBuilder = this.categoryRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.items', 'items', 'items.deletedAt IS NULL')
            .where('category.tenantId = :tenantId', { tenantId: dto.tenantId })
            .andWhere('category.deletedAt IS NULL');
        if (dto.status !== undefined) {
            const statusValue = typeof dto.status === 'number'
                ? dto.status
                : (0, enums_1.categoryStatusFromString)(dto.status);
            queryBuilder.andWhere('category.status = :status', { status: statusValue });
        }
        if (dto.search) {
            queryBuilder.andWhere('category.name ILIKE :search', {
                search: `%${dto.search}%`,
            });
        }
        const sortBy = dto.sortBy || request_1.CategorySortBy.DISPLAY_ORDER;
        const sortOrder = dto.sortOrder || request_1.SortOrder.ASC;
        switch (sortBy) {
            case request_1.CategorySortBy.NAME:
                queryBuilder.orderBy('category.name', sortOrder);
                break;
            case request_1.CategorySortBy.CREATED_AT:
                queryBuilder.orderBy('category.createdAt', sortOrder);
                break;
            case request_1.CategorySortBy.DISPLAY_ORDER:
            default:
                queryBuilder.orderBy('category.displayOrder', sortOrder);
                queryBuilder.addOrderBy('category.createdAt', request_1.SortOrder.ASC);
                break;
        }
        const categories = await queryBuilder.getMany();
        return categories.map((cat) => this.toResponseDto(cat, cat.items?.length || 0));
    }
    async getCategory(dto) {
        const category = await this.categoryRepository.findOne({
            where: {
                id: dto.categoryId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            relations: ['items'],
        });
        if (!category) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
        }
        const itemCount = category.items?.filter((item) => !item.deletedAt).length || 0;
        return this.toResponseDto(category, itemCount);
    }
    async updateCategory(dto) {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!category) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
        }
        if (dto.name && dto.name !== category.name) {
            const duplicateCategory = await this.categoryRepository.findOne({
                where: {
                    tenantId: dto.tenantId,
                    name: dto.name,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            if (duplicateCategory && duplicateCategory.id !== category.id) {
                throw new app_exception_1.default(error_code_1.default.CATEGORY_NAME_ALREADY_EXISTS);
            }
        }
        if (dto.name !== undefined)
            category.name = dto.name;
        if (dto.description !== undefined)
            category.description = dto.description;
        if (dto.status !== undefined) {
            category.status =
                typeof dto.status === 'number'
                    ? dto.status
                    : (0, enums_1.categoryStatusFromString)(dto.status);
        }
        if (dto.displayOrder !== undefined)
            category.displayOrder = dto.displayOrder;
        if (dto.imageUrl !== undefined)
            category.imageUrl = dto.imageUrl;
        const updated = await this.categoryRepository.save(category);
        return this.toResponseDto(updated);
    }
    async updateCategoryStatus(dto) {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!category) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
        }
        category.status =
            typeof dto.status === 'number'
                ? dto.status
                : (0, enums_1.categoryStatusFromString)(dto.status);
        const updated = await this.categoryRepository.save(category);
        return this.toResponseDto(updated);
    }
    async deleteCategory(dto) {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.categoryId, tenantId: dto.tenantId, deletedAt: (0, typeorm_2.IsNull)() },
            relations: ['items'],
        });
        if (!category) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
        }
        const activeItemsCount = await this.menuItemRepository.count({
            where: {
                categoryId: dto.categoryId,
                tenantId: dto.tenantId,
                status: enums_1.MenuItemStatus.AVAILABLE,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (activeItemsCount > 0) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_HAS_ACTIVE_ITEMS);
        }
        await this.categoryRepository.softRemove(category);
    }
    toResponseDto(category, itemCount) {
        return {
            id: category.id,
            tenantId: category.tenantId,
            name: category.name,
            description: category.description,
            status: (0, enums_1.categoryStatusToString)(category.status),
            displayOrder: category.displayOrder,
            imageUrl: category.imageUrl,
            itemCount: itemCount,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.MenuCategory)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.MenuItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], CategoryService);
//# sourceMappingURL=category.service.js.map