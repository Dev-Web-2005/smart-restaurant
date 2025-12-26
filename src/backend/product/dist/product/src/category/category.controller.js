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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const category_service_1 = require("./category.service");
const http_response_1 = __importDefault(require("../../../shared/src/utils/http-response"));
const rpc_error_handler_1 = require("../../../shared/src/utils/rpc-error-handler");
const request_1 = require("./dtos/request");
const config_1 = require("@nestjs/config");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
let CategoryController = class CategoryController {
    categoryService;
    config;
    constructor(categoryService, config) {
        this.categoryService = categoryService;
        this.config = config;
    }
    validateApiKey(providedKey) {
        const expectedApiKey = this.config.get('PRODUCT_API_KEY');
        if (providedKey !== expectedApiKey) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
    }
    async createCategory(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            this.validateApiKey(dto.productApiKey);
            const category = await this.categoryService.createCategory(dto);
            return new http_response_1.default(1000, 'Category created successfully', category);
        });
    }
    async getCategories(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            this.validateApiKey(dto.productApiKey);
            const categories = await this.categoryService.getCategories(dto);
            return new http_response_1.default(1000, 'Categories retrieved successfully', categories);
        });
    }
    async getCategory(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            this.validateApiKey(dto.productApiKey);
            const category = await this.categoryService.getCategory(dto);
            return new http_response_1.default(1000, 'Category retrieved successfully', category);
        });
    }
    async updateCategory(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            this.validateApiKey(dto.productApiKey);
            const category = await this.categoryService.updateCategory(dto);
            return new http_response_1.default(1000, 'Category updated successfully', category);
        });
    }
    async updateCategoryStatus(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            this.validateApiKey(dto.productApiKey);
            const category = await this.categoryService.updateCategoryStatus(dto);
            return new http_response_1.default(1000, 'Category status updated successfully', category);
        });
    }
    async deleteCategory(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            this.validateApiKey(dto.productApiKey);
            await this.categoryService.deleteCategory(dto);
            return new http_response_1.default(1000, 'Category deleted successfully');
        });
    }
};
exports.CategoryController = CategoryController;
__decorate([
    (0, microservices_1.MessagePattern)('categories:create'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.CreateCategoryRequestDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "createCategory", null);
__decorate([
    (0, microservices_1.MessagePattern)('categories:get-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.GetCategoriesRequestDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "getCategories", null);
__decorate([
    (0, microservices_1.MessagePattern)('categories:get'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.GetCategoryRequestDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "getCategory", null);
__decorate([
    (0, microservices_1.MessagePattern)('categories:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.UpdateCategoryRequestDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "updateCategory", null);
__decorate([
    (0, microservices_1.MessagePattern)('categories:update-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.UpdateCategoryStatusRequestDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "updateCategoryStatus", null);
__decorate([
    (0, microservices_1.MessagePattern)('categories:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.DeleteCategoryRequestDto]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "deleteCategory", null);
exports.CategoryController = CategoryController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [category_service_1.CategoryService,
        config_1.ConfigService])
], CategoryController);
//# sourceMappingURL=category.controller.js.map