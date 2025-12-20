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
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
let CategoryService = class CategoryService {
    categoryRepository;
    configService;
    constructor(categoryRepository, configService) {
        this.categoryRepository = categoryRepository;
        this.configService = configService;
    }
    async createCategory(dto) {
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
    async getCategories(dto) {
        const categories = await this.categoryRepository.find({
            where: { tenantId: dto.tenantId },
            order: { displayOrder: 'ASC', createdAt: 'ASC' },
        });
        return categories.map((cat) => this.toResponseDto(cat));
    }
    async updateCategory(dto) {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.categoryId, tenantId: dto.tenantId },
        });
        if (!category) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
        }
        if (dto.name)
            category.name = dto.name;
        if (dto.description !== undefined)
            category.description = dto.description;
        const updated = await this.categoryRepository.save(category);
        return this.toResponseDto(updated);
    }
    async publishCategory(dto) {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.categoryId, tenantId: dto.tenantId },
        });
        if (!category) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
        }
        category.published = dto.published;
        const updated = await this.categoryRepository.save(category);
        return this.toResponseDto(updated);
    }
    async deleteCategory(dto) {
        const category = await this.categoryRepository.findOne({
            where: { id: dto.categoryId, tenantId: dto.tenantId },
        });
        if (!category) {
            throw new app_exception_1.default(error_code_1.default.CATEGORY_NOT_FOUND);
        }
        await this.categoryRepository.remove(category);
    }
    toResponseDto(category) {
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
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.MenuCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], CategoryService);
//# sourceMappingURL=category.service.js.map