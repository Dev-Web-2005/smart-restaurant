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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../common/entities");
const enums_1 = require("../common/enums");
const get_public_menu_request_dto_1 = require("./dtos/request/get-public-menu-request.dto");
let PublicService = class PublicService {
    categoryRepository;
    itemRepository;
    constructor(categoryRepository, itemRepository) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
    }
    async getPublicMenu(dto) {
        if (dto.page ||
            dto.limit ||
            dto.categoryId ||
            dto.search ||
            dto.isChefRecommended !== undefined ||
            dto.sortBy) {
            return this.getPaginatedPublicMenu(dto);
        }
        return this.getGroupedPublicMenu(dto);
    }
    async getGroupedPublicMenu(dto) {
        const categories = await this.categoryRepository.find({
            where: {
                tenantId: dto.tenantId,
                status: enums_1.CategoryStatus.ACTIVE,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            order: { displayOrder: 'ASC', createdAt: 'ASC' },
        });
        if (categories.length === 0) {
            return {
                tenantId: dto.tenantId,
                categories: [],
            };
        }
        const categoryIds = categories.map((cat) => cat.id);
        const items = await this.itemRepository.find({
            where: {
                categoryId: (0, typeorm_2.In)(categoryIds),
                status: enums_1.MenuItemStatus.AVAILABLE,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            relations: [
                'photos',
                'modifierGroups',
                'modifierGroups.modifierGroup',
                'modifierGroups.modifierGroup.options',
            ],
            order: { createdAt: 'ASC' },
        });
        const categoriesWithItems = categories.map((category) => {
            const categoryItems = items.filter((item) => item.categoryId === category.id);
            return {
                id: category.id,
                name: category.name,
                description: category.description,
                items: categoryItems.map((item) => this.toPublicItemDto(item)),
            };
        });
        const filteredCategories = categoriesWithItems.filter((cat) => cat.items.length > 0);
        return {
            tenantId: dto.tenantId,
            categories: filteredCategories,
        };
    }
    async getPaginatedPublicMenu(dto) {
        const queryBuilder = this.itemRepository
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.photos', 'photos')
            .leftJoinAndSelect('item.modifierGroups', 'modifierGroups')
            .leftJoinAndSelect('modifierGroups.modifierGroup', 'modifierGroup')
            .leftJoinAndSelect('modifierGroup.options', 'options')
            .where('item.tenantId = :tenantId', { tenantId: dto.tenantId })
            .andWhere('item.status = :status', { status: enums_1.MenuItemStatus.AVAILABLE })
            .andWhere('item.deletedAt IS NULL');
        if (dto.categoryId) {
            const category = await this.categoryRepository.findOne({
                where: {
                    id: dto.categoryId,
                    tenantId: dto.tenantId,
                    status: enums_1.CategoryStatus.ACTIVE,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            if (category) {
                queryBuilder.andWhere('item.categoryId = :categoryId', {
                    categoryId: dto.categoryId,
                });
            }
            else {
                return {
                    tenantId: dto.tenantId,
                    items: [],
                    total: 0,
                    page: dto.page || 1,
                    limit: dto.limit || 20,
                    totalPages: 0,
                };
            }
        }
        else {
            const activeCategories = await this.categoryRepository.find({
                where: {
                    tenantId: dto.tenantId,
                    status: enums_1.CategoryStatus.ACTIVE,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
                select: ['id'],
            });
            if (activeCategories.length === 0) {
                return {
                    tenantId: dto.tenantId,
                    items: [],
                    total: 0,
                    page: dto.page || 1,
                    limit: dto.limit || 20,
                    totalPages: 0,
                };
            }
            const activeCategoryIds = activeCategories.map((cat) => cat.id);
            queryBuilder.andWhere('item.categoryId IN (:...categoryIds)', {
                categoryIds: activeCategoryIds,
            });
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
        const sortBy = dto.sortBy || get_public_menu_request_dto_1.PublicMenuSortBy.CREATED_AT;
        const sortOrder = dto.sortOrder || get_public_menu_request_dto_1.SortOrder.ASC;
        switch (sortBy) {
            case get_public_menu_request_dto_1.PublicMenuSortBy.PRICE:
                queryBuilder.orderBy('item.price', sortOrder);
                break;
            case get_public_menu_request_dto_1.PublicMenuSortBy.NAME:
                queryBuilder.orderBy('item.name', sortOrder);
                break;
            case get_public_menu_request_dto_1.PublicMenuSortBy.POPULARITY:
                queryBuilder.orderBy('item.createdAt', sortOrder);
                break;
            case get_public_menu_request_dto_1.PublicMenuSortBy.CREATED_AT:
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
            tenantId: dto.tenantId,
            items: items.map((item) => this.toPublicItemDto(item)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    toPublicItemDto(item) {
        const sortedPhotos = item.photos?.sort((a, b) => {
            if (a.isPrimary && !b.isPrimary)
                return -1;
            if (!a.isPrimary && b.isPrimary)
                return 1;
            return a.displayOrder - b.displayOrder;
        });
        const primaryPhoto = sortedPhotos?.[0];
        const modifierGroups = item.modifierGroups
            ?.filter((itemGroup) => itemGroup.modifierGroup?.isActive)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((itemGroup) => ({
            id: itemGroup.modifierGroup.id,
            name: itemGroup.modifierGroup.name,
            displayOrder: itemGroup.displayOrder,
            isRequired: itemGroup.isRequired,
            minSelections: itemGroup.minSelections,
            maxSelections: itemGroup.maxSelections,
            options: itemGroup.modifierGroup.options
                ?.filter((opt) => opt.isActive)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((opt) => ({
                id: opt.id,
                label: opt.label,
                priceDelta: Number(opt.priceDelta),
                displayOrder: opt.displayOrder,
            })),
        })) || [];
        return {
            id: item.id,
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
            imageUrl: primaryPhoto?.url,
            photos: sortedPhotos?.map((photo) => ({
                id: photo.id,
                url: photo.url,
                isPrimary: photo.isPrimary,
                displayOrder: photo.displayOrder,
            })),
            price: Number(item.price),
            currency: item.currency,
            prepTimeMinutes: item.prepTimeMinutes,
            isChefRecommended: item.isChefRecommended,
            status: item.status === enums_1.MenuItemStatus.AVAILABLE ? 'AVAILABLE' : 'UNAVAILABLE',
            modifierGroups,
        };
    }
};
exports.PublicService = PublicService;
exports.PublicService = PublicService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.MenuCategory)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.MenuItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PublicService);
//# sourceMappingURL=public.service.js.map