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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const auth_guard_1 = require("../../common/guards/get-role/auth.guard");
const check_role_guard_1 = __importDefault(require("../../common/guards/check-role/check-role.guard"));
let ProductController = class ProductController {
    productClient;
    configService;
    constructor(productClient, configService) {
        this.productClient = productClient;
        this.configService = configService;
    }
    createCategory(tenantId, data) {
        return this.productClient.send('categories:create', {
            tenantId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getCategories(tenantId) {
        return this.productClient.send('categories:get-all', {
            tenantId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateCategory(categoryId, data) {
        return this.productClient.send('categories:update', {
            categoryId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    publishCategory(categoryId, data) {
        return this.productClient.send('categories:publish', {
            categoryId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    deleteCategory(categoryId, data) {
        return this.productClient.send('categories:delete', {
            categoryId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    createItem(tenantId, data) {
        return this.productClient.send('items:create', {
            tenantId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getItems(tenantId, categoryId) {
        return this.productClient.send('items:get-all', {
            tenantId,
            categoryId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateItem(itemId, data) {
        return this.productClient.send('items:update', {
            itemId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    publishItem(itemId, data) {
        return this.productClient.send('items:publish', {
            itemId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    deleteItem(itemId, data) {
        return this.productClient.send('items:delete', {
            itemId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    addModifiers(itemId, data) {
        return this.productClient.send('items:add-modifiers', {
            itemId,
            ...data,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getPublicMenu(tenantId) {
        return this.productClient.send('public:get-menu', {
            tenantId,
        });
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Post)('tenants/:tenantId/categories'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/categories'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Patch)('categories/:categoryId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Post)('categories/:categoryId/publish'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "publishCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:categoryId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/items'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/items'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getItems", null);
__decorate([
    (0, common_1.Patch)('items/:itemId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Post)('items/:itemId/publish'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "publishItem", null);
__decorate([
    (0, common_1.Delete)('items/:itemId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "deleteItem", null);
__decorate([
    (0, common_1.Post)('items/:itemId/modifiers'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "addModifiers", null);
__decorate([
    (0, common_1.Get)('public/menu/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getPublicMenu", null);
exports.ProductController = ProductController = __decorate([
    (0, common_1.Controller)('products'),
    __param(0, (0, common_1.Inject)('PRODUCT_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        config_1.ConfigService])
], ProductController);
//# sourceMappingURL=product.controller.js.map