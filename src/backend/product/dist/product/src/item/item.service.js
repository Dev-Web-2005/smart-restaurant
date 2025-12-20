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
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
let ItemService = class ItemService {
    itemRepository;
    modifierRepository;
    configService;
    constructor(itemRepository, modifierRepository, configService) {
        this.itemRepository = itemRepository;
        this.modifierRepository = modifierRepository;
        this.configService = configService;
    }
    validateApiKey(providedKey) {
        const validKey = this.configService.get('PRODUCT_API_KEY');
        if (providedKey !== validKey) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
    }
    async createItem(dto) {
        this.validateApiKey(dto.productApiKey);
        const item = this.itemRepository.create({
            tenantId: dto.tenantId,
            categoryId: dto.categoryId,
            name: dto.name,
            description: dto.description,
            imageUrl: dto.imageUrl,
            price: dto.price,
            currency: dto.currency || 'VND',
            available: dto.available !== undefined ? dto.available : true,
            published: false,
        });
        const saved = await this.itemRepository.save(item);
        return this.toResponseDto(saved, []);
    }
    async getItems(dto) {
        this.validateApiKey(dto.productApiKey);
        const where = { tenantId: dto.tenantId };
        if (dto.categoryId) {
            where.categoryId = dto.categoryId;
        }
        const items = await this.itemRepository.find({
            where,
            relations: ['modifiers'],
            order: { createdAt: 'DESC' },
        });
        return items.map((item) => this.toResponseDto(item, item.modifiers || []));
    }
    async updateItem(dto) {
        this.validateApiKey(dto.productApiKey);
        const item = await this.itemRepository.findOne({
            where: { id: dto.itemId, tenantId: dto.tenantId },
            relations: ['modifiers'],
        });
        if (!item) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        if (dto.name)
            item.name = dto.name;
        if (dto.description !== undefined)
            item.description = dto.description;
        if (dto.imageUrl !== undefined)
            item.imageUrl = dto.imageUrl;
        if (dto.price !== undefined)
            item.price = dto.price;
        if (dto.currency)
            item.currency = dto.currency;
        if (dto.available !== undefined)
            item.available = dto.available;
        const updated = await this.itemRepository.save(item);
        return this.toResponseDto(updated, item.modifiers || []);
    }
    async publishItem(dto) {
        this.validateApiKey(dto.productApiKey);
        const item = await this.itemRepository.findOne({
            where: { id: dto.itemId, tenantId: dto.tenantId },
            relations: ['modifiers'],
        });
        if (!item) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        item.published = dto.published;
        const updated = await this.itemRepository.save(item);
        return this.toResponseDto(updated, item.modifiers || []);
    }
    async deleteItem(dto) {
        this.validateApiKey(dto.productApiKey);
        const item = await this.itemRepository.findOne({
            where: { id: dto.itemId, tenantId: dto.tenantId },
        });
        if (!item) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        await this.itemRepository.remove(item);
    }
    async addModifiers(dto) {
        this.validateApiKey(dto.productApiKey);
        const item = await this.itemRepository.findOne({
            where: { id: dto.itemId, tenantId: dto.tenantId },
            relations: ['modifiers'],
        });
        if (!item) {
            throw new app_exception_1.default(error_code_1.default.ITEM_NOT_FOUND);
        }
        if (item.modifiers && item.modifiers.length > 0) {
            await this.modifierRepository.remove(item.modifiers);
        }
        const modifiers = dto.modifiers.map((mod) => this.modifierRepository.create({
            itemId: dto.itemId,
            groupName: mod.groupName,
            label: mod.label,
            priceDelta: mod.priceDelta,
            type: mod.type,
        }));
        const savedModifiers = await this.modifierRepository.save(modifiers);
        return this.toResponseDto(item, savedModifiers);
    }
    toResponseDto(item, modifiers) {
        return {
            id: item.id,
            tenantId: item.tenantId,
            categoryId: item.categoryId,
            name: item.name,
            description: item.description,
            imageUrl: item.imageUrl,
            price: Number(item.price),
            currency: item.currency,
            available: item.available,
            published: item.published,
            createdAt: item.createdAt,
            modifiers: modifiers.map((mod) => this.toModifierDto(mod)),
        };
    }
    toModifierDto(modifier) {
        return {
            id: modifier.id,
            itemId: modifier.itemId,
            groupName: modifier.groupName,
            label: modifier.label,
            priceDelta: Number(modifier.priceDelta),
            type: modifier.type,
        };
    }
};
exports.ItemService = ItemService;
exports.ItemService = ItemService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.MenuItem)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.ModifierOption)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], ItemService);
//# sourceMappingURL=item.service.js.map