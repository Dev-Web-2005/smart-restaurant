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
exports.ItemService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../common/entities");
const enums_1 = require("../common/enums");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const request_1 = require("./dtos/request");
let ItemService = class ItemService {
    menuItemRepository;
    categoryRepository;
    photoRepository;
    configService;
    constructor(menuItemRepository, categoryRepository, photoRepository, configService) {
        this.menuItemRepository = menuItemRepository;
        this.categoryRepository = categoryRepository;
        this.photoRepository = photoRepository;
        this.configService = configService;
    }
    validateApiKey(providedKey) {
        const validKey = this.configService.get('PRODUCT_API_KEY');
        if (providedKey !== validKey) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
    }
    async createMenuItem(dto) {
        this.validateApiKey(dto.productApiKey);
        const category = await this.categoryRepository.findOne({
            where: {
                id: dto.categoryId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!category) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
        }
        const menuItem = this.menuItemRepository.create({
            tenantId: dto.tenantId,
            categoryId: dto.categoryId,
            name: dto.name,
            description: dto.description,
            price: dto.price,
            currency: dto.currency || 'VND',
            prepTimeMinutes: dto.prepTimeMinutes,
            status: dto.status ?? enums_1.MenuItemStatus.AVAILABLE,
            isChefRecommended: dto.isChefRecommended ?? false,
        });
        const saved = await this.menuItemRepository.save(menuItem);
        return this.toResponseDto(saved, category.name);
    }
    async getMenuItems(dto) {
        this.validateApiKey(dto.productApiKey);
        const queryBuilder = this.menuItemRepository
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.category', 'category')
            .where('item.tenantId = :tenantId', { tenantId: dto.tenantId })
            .andWhere('item.deletedAt IS NULL');
        if (dto.categoryId) {
            queryBuilder.andWhere('item.categoryId = :categoryId', {
                categoryId: dto.categoryId,
            });
        }
        if (dto.status !== undefined) {
            queryBuilder.andWhere('item.status = :status', { status: dto.status });
        }
        if (dto.isChefRecommended !== undefined) {
            queryBuilder.andWhere('item.isChefRecommended = :isChefRecommended', {
                isChefRecommended: dto.isChefRecommended,
            });
        }
        if (dto.search) {
            queryBuilder.andWhere('LOWER(item.name) LIKE LOWER(:search)', {
                search: `%${dto.search}%`,
            });
        }
        const sortBy = dto.sortBy || request_1.MenuItemSortBy.CREATED_AT;
        const sortOrder = dto.sortOrder || request_1.SortOrder.DESC;
        switch (sortBy) {
            case request_1.MenuItemSortBy.PRICE:
                queryBuilder.orderBy('item.price', sortOrder);
                break;
            case request_1.MenuItemSortBy.NAME:
                queryBuilder.orderBy('item.name', sortOrder);
                break;
            case request_1.MenuItemSortBy.POPULARITY:
                queryBuilder.orderBy('item.createdAt', sortOrder);
                break;
            case request_1.MenuItemSortBy.CREATED_AT:
            default:
                queryBuilder.orderBy('item.createdAt', sortOrder);
                break;
        }
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
    async updateMenuItem(dto) {
        this.validateApiKey(dto.productApiKey);
        const menuItem = await this.menuItemRepository.findOne({
            where: {
                id: dto.menuItemId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            relations: ['category'],
        });
        if (!menuItem) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        if (dto.categoryId && dto.categoryId !== menuItem.categoryId) {
            const newCategory = await this.categoryRepository.findOne({
                where: {
                    id: dto.categoryId,
                    tenantId: dto.tenantId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            if (!newCategory) {
                throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
            }
            menuItem.categoryId = dto.categoryId;
            menuItem.category = newCategory;
        }
        if (dto.name !== undefined)
            menuItem.name = dto.name;
        if (dto.description !== undefined)
            menuItem.description = dto.description;
        if (dto.price !== undefined)
            menuItem.price = dto.price;
        if (dto.currency !== undefined)
            menuItem.currency = dto.currency;
        if (dto.prepTimeMinutes !== undefined)
            menuItem.prepTimeMinutes = dto.prepTimeMinutes;
        if (dto.status !== undefined)
            menuItem.status = dto.status;
        if (dto.isChefRecommended !== undefined)
            menuItem.isChefRecommended = dto.isChefRecommended;
        const updated = await this.menuItemRepository.save(menuItem);
        return this.toResponseDto(updated, menuItem.category?.name);
    }
    async updateMenuItemStatus(dto) {
        this.validateApiKey(dto.productApiKey);
        const menuItem = await this.menuItemRepository.findOne({
            where: {
                id: dto.menuItemId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            relations: ['category'],
        });
        if (!menuItem) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        menuItem.status = dto.status;
        const updated = await this.menuItemRepository.save(menuItem);
        return this.toResponseDto(updated, menuItem.category?.name);
    }
    async deleteMenuItem(dto) {
        this.validateApiKey(dto.productApiKey);
        const menuItem = await this.menuItemRepository.findOne({
            where: {
                id: dto.menuItemId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!menuItem) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        await this.menuItemRepository.softDelete(menuItem.id);
    }
    toResponseDto(item, categoryName) {
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
            status: (0, enums_1.menuItemStatusToString)(item.status),
            isChefRecommended: item.isChefRecommended,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        };
    }
    async addMenuItemPhoto(dto) {
        this.validateApiKey(dto.productApiKey);
        const menuItem = await this.menuItemRepository.findOne({
            where: {
                id: dto.menuItemId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!menuItem) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        if (dto.isPrimary) {
            await this.photoRepository.update({ menuItemId: dto.menuItemId, isPrimary: true }, { isPrimary: false });
        }
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
    async getMenuItemPhotos(dto) {
        this.validateApiKey(dto.productApiKey);
        const menuItem = await this.menuItemRepository.findOne({
            where: {
                id: dto.menuItemId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!menuItem) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
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
    async updateMenuItemPhoto(dto) {
        this.validateApiKey(dto.productApiKey);
        const menuItem = await this.menuItemRepository.findOne({
            where: {
                id: dto.menuItemId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!menuItem) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        const photo = await this.photoRepository.findOne({
            where: {
                id: dto.photoId,
                menuItemId: dto.menuItemId,
            },
        });
        if (!photo) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        if (dto.isPrimary === true) {
            await this.photoRepository.update({ menuItemId: dto.menuItemId, isPrimary: true }, { isPrimary: false });
        }
        if (dto.isPrimary !== undefined)
            photo.isPrimary = dto.isPrimary;
        if (dto.displayOrder !== undefined)
            photo.displayOrder = dto.displayOrder;
        const updated = await this.photoRepository.save(photo);
        return this.toPhotoResponseDto(updated);
    }
    async setPrimaryPhoto(dto) {
        this.validateApiKey(dto.productApiKey);
        const menuItem = await this.menuItemRepository.findOne({
            where: {
                id: dto.menuItemId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!menuItem) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        const photo = await this.photoRepository.findOne({
            where: {
                id: dto.photoId,
                menuItemId: dto.menuItemId,
            },
        });
        if (!photo) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        await this.photoRepository.update({ menuItemId: dto.menuItemId, isPrimary: true }, { isPrimary: false });
        photo.isPrimary = true;
        const updated = await this.photoRepository.save(photo);
        return this.toPhotoResponseDto(updated);
    }
    async deleteMenuItemPhoto(dto) {
        this.validateApiKey(dto.productApiKey);
        const menuItem = await this.menuItemRepository.findOne({
            where: {
                id: dto.menuItemId,
                tenantId: dto.tenantId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!menuItem) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        const photo = await this.photoRepository.findOne({
            where: {
                id: dto.photoId,
                menuItemId: dto.menuItemId,
            },
        });
        if (!photo) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        await this.photoRepository.remove(photo);
    }
    toPhotoResponseDto(photo) {
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
};
exports.ItemService = ItemService;
exports.ItemService = ItemService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.MenuItem)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.MenuCategory)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.MenuItemPhoto)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], ItemService);
//# sourceMappingURL=item.service.js.map