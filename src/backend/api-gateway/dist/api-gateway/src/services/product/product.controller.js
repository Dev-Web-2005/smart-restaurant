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
            ...data,
            tenantId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getCategories(tenantId, status, search, sortBy, sortOrder) {
        return this.productClient.send('categories:get-all', {
            tenantId,
            status,
            search,
            sortBy,
            sortOrder,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getCategory(tenantId, categoryId) {
        return this.productClient.send('categories:get', {
            tenantId,
            categoryId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateCategory(tenantId, categoryId, data) {
        return this.productClient.send('categories:update', {
            ...data,
            tenantId,
            categoryId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateCategoryStatus(tenantId, categoryId, data) {
        return this.productClient.send('categories:update-status', {
            ...data,
            tenantId,
            categoryId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    deleteCategory(tenantId, categoryId, data) {
        return this.productClient.send('categories:delete', {
            ...data,
            tenantId,
            categoryId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    createItem(tenantId, data) {
        return this.productClient.send('menu-items:create', {
            ...data,
            tenantId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getItems(tenantId, categoryId, status, isChefRecommended, search, sortBy, sortOrder, page, limit) {
        return this.productClient.send('menu-items:get-all', {
            tenantId,
            categoryId,
            status,
            isChefRecommended,
            search,
            sortBy,
            sortOrder,
            page,
            limit,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getItem(tenantId, itemId) {
        return this.productClient.send('menu-items:get', {
            tenantId,
            menuItemId: itemId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateItem(tenantId, itemId, data) {
        return this.productClient.send('menu-items:update', {
            ...data,
            tenantId,
            menuItemId: itemId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateItemStatus(tenantId, itemId, data) {
        return this.productClient.send('menu-items:update-status', {
            ...data,
            tenantId,
            menuItemId: itemId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    deleteItem(tenantId, itemId) {
        return this.productClient.send('menu-items:delete', {
            tenantId,
            menuItemId: itemId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    addMenuItemPhoto(tenantId, itemId, data) {
        return this.productClient.send('menu-item-photos:add', {
            ...data,
            tenantId,
            menuItemId: itemId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getMenuItemPhotos(tenantId, itemId) {
        return this.productClient.send('menu-item-photos:get-all', {
            tenantId,
            menuItemId: itemId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateMenuItemPhoto(tenantId, itemId, photoId, data) {
        return this.productClient.send('menu-item-photos:update', {
            ...data,
            tenantId,
            menuItemId: itemId,
            photoId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    setPrimaryPhoto(tenantId, itemId, photoId) {
        return this.productClient.send('menu-item-photos:set-primary', {
            tenantId,
            menuItemId: itemId,
            photoId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    deleteMenuItemPhoto(tenantId, itemId, photoId) {
        return this.productClient.send('menu-item-photos:delete', {
            tenantId,
            menuItemId: itemId,
            photoId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    createModifierGroup(tenantId, data) {
        return this.productClient.send('modifier-groups:create', {
            ...data,
            tenantId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getModifierGroups(tenantId, isActive, search) {
        return this.productClient.send('modifier-groups:get-all', {
            tenantId,
            isActive,
            search,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getModifierGroup(tenantId, groupId) {
        return this.productClient.send('modifier-groups:get', {
            tenantId,
            modifierGroupId: groupId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateModifierGroup(tenantId, groupId, data) {
        return this.productClient.send('modifier-groups:update', {
            ...data,
            tenantId,
            modifierGroupId: groupId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    deleteModifierGroup(tenantId, groupId) {
        return this.productClient.send('modifier-groups:delete', {
            tenantId,
            modifierGroupId: groupId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    createModifierOption(tenantId, groupId, data) {
        return this.productClient.send('modifier-options:create', {
            ...data,
            tenantId,
            modifierGroupId: groupId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getModifierOptions(tenantId, groupId, isActive) {
        return this.productClient.send('modifier-options:get-all', {
            tenantId,
            modifierGroupId: groupId,
            isActive,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getModifierOption(tenantId, groupId, optionId) {
        return this.productClient.send('modifier-options:get', {
            tenantId,
            modifierGroupId: groupId,
            modifierOptionId: optionId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    updateModifierOption(tenantId, groupId, optionId, data) {
        return this.productClient.send('modifier-options:update', {
            ...data,
            tenantId,
            modifierGroupId: groupId,
            optionId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    deleteModifierOption(tenantId, groupId, optionId) {
        return this.productClient.send('modifier-options:delete', {
            tenantId,
            modifierGroupId: groupId,
            optionId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    attachModifierGroups(tenantId, itemId, data) {
        return this.productClient.send('menu-item-modifiers:attach', {
            ...data,
            tenantId,
            menuItemId: itemId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getMenuItemModifierGroups(tenantId, itemId) {
        return this.productClient.send('menu-item-modifiers:get-all', {
            tenantId,
            menuItemId: itemId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    detachModifierGroup(tenantId, itemId, groupId) {
        return this.productClient.send('menu-item-modifiers:detach', {
            tenantId,
            menuItemId: itemId,
            modifierGroupId: groupId,
            productApiKey: this.configService.get('PRODUCT_API_KEY'),
        });
    }
    getPublicMenu(tenantId, categoryId, search, isChefRecommended, sortBy, sortOrder, page, limit) {
        return this.productClient.send('public:get-menu', {
            tenantId,
            categoryId,
            search,
            isChefRecommended,
            sortBy,
            sortOrder,
            page,
            limit,
        });
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Post)('tenants/:tenantId/categories'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/categories'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('sortBy')),
    __param(4, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/categories/:categoryId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getCategory", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/categories/:categoryId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('categoryId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/categories/:categoryId/status'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('categoryId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateCategoryStatus", null);
__decorate([
    (0, common_1.Delete)('tenants/:tenantId/categories/:categoryId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('categoryId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/items'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/items'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('isChefRecommended')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('sortBy')),
    __param(6, (0, common_1.Query)('sortOrder')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Boolean, String, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getItems", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/items/:itemId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getItem", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/items/:itemId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/items/:itemId/status'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateItemStatus", null);
__decorate([
    (0, common_1.Delete)('tenants/:tenantId/items/:itemId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "deleteItem", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/items/:itemId/photos'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "addMenuItemPhoto", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/items/:itemId/photos'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getMenuItemPhotos", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/items/:itemId/photos/:photoId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Param)('photoId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateMenuItemPhoto", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/items/:itemId/photos/:photoId/primary'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Param)('photoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "setPrimaryPhoto", null);
__decorate([
    (0, common_1.Delete)('tenants/:tenantId/items/:itemId/photos/:photoId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Param)('photoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "deleteMenuItemPhoto", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/modifier-groups'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "createModifierGroup", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/modifier-groups'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('isActive')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getModifierGroups", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/modifier-groups/:groupId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getModifierGroup", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/modifier-groups/:groupId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateModifierGroup", null);
__decorate([
    (0, common_1.Delete)('tenants/:tenantId/modifier-groups/:groupId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "deleteModifierGroup", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/modifier-groups/:groupId/options'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "createModifierOption", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/modifier-groups/:groupId/options'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getModifierOptions", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/modifier-groups/:groupId/options/:optionId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Param)('optionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getModifierOption", null);
__decorate([
    (0, common_1.Patch)('tenants/:tenantId/modifier-groups/:groupId/options/:optionId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Param)('optionId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "updateModifierOption", null);
__decorate([
    (0, common_1.Delete)('tenants/:tenantId/modifier-groups/:groupId/options/:optionId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Param)('optionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "deleteModifierOption", null);
__decorate([
    (0, common_1.Post)('tenants/:tenantId/items/:itemId/modifiers'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "attachModifierGroups", null);
__decorate([
    (0, common_1.Get)('tenants/:tenantId/items/:itemId/modifiers'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getMenuItemModifierGroups", null);
__decorate([
    (0, common_1.Delete)('tenants/:tenantId/items/:itemId/modifiers/:groupId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('USER')),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "detachModifierGroup", null);
__decorate([
    (0, common_1.Get)('public/menu/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('isChefRecommended')),
    __param(4, (0, common_1.Query)('sortBy')),
    __param(5, (0, common_1.Query)('sortOrder')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Boolean, String, String, Number, Number]),
    __metadata("design:returntype", void 0)
], ProductController.prototype, "getPublicMenu", null);
exports.ProductController = ProductController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)('PRODUCT_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        config_1.ConfigService])
], ProductController);
//# sourceMappingURL=product.controller.js.map