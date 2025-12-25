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
let PublicService = class PublicService {
    categoryRepository;
    itemRepository;
    constructor(categoryRepository, itemRepository) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
    }
    async getPublicMenu(dto) {
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
            where: categoryIds.map((catId) => ({
                categoryId: catId,
                status: enums_1.MenuItemStatus.AVAILABLE,
                deletedAt: (0, typeorm_2.IsNull)(),
            })),
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