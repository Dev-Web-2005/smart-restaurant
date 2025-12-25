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
exports.ItemController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const item_service_1 = require("./item.service");
const http_response_1 = __importDefault(require("../../../shared/src/utils/http-response"));
const rpc_error_handler_1 = require("../../../shared/src/utils/rpc-error-handler");
const request_1 = require("./dtos/request");
let ItemController = class ItemController {
    itemService;
    constructor(itemService) {
        this.itemService = itemService;
    }
    async createMenuItem(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const item = await this.itemService.createMenuItem(dto);
            return new http_response_1.default(1000, 'Menu item created successfully', item);
        });
    }
    async getMenuItems(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const result = await this.itemService.getMenuItems(dto);
            return new http_response_1.default(1000, 'Menu items retrieved successfully', result);
        });
    }
    async updateMenuItem(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const item = await this.itemService.updateMenuItem(dto);
            return new http_response_1.default(1000, 'Menu item updated successfully', item);
        });
    }
    async updateMenuItemStatus(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const item = await this.itemService.updateMenuItemStatus(dto);
            return new http_response_1.default(1000, 'Menu item status updated successfully', item);
        });
    }
    async deleteMenuItem(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            await this.itemService.deleteMenuItem(dto);
            return new http_response_1.default(1000, 'Menu item deleted successfully');
        });
    }
    async addMenuItemPhoto(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const photo = await this.itemService.addMenuItemPhoto(dto);
            return new http_response_1.default(1000, 'Photo added successfully', photo);
        });
    }
    async getMenuItemPhotos(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const result = await this.itemService.getMenuItemPhotos(dto);
            return new http_response_1.default(1000, 'Photos retrieved successfully', result);
        });
    }
    async updateMenuItemPhoto(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const photo = await this.itemService.updateMenuItemPhoto(dto);
            return new http_response_1.default(1000, 'Photo updated successfully', photo);
        });
    }
    async setPrimaryPhoto(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const photo = await this.itemService.setPrimaryPhoto(dto);
            return new http_response_1.default(1000, 'Primary photo set successfully', photo);
        });
    }
    async deleteMenuItemPhoto(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            await this.itemService.deleteMenuItemPhoto(dto);
            return new http_response_1.default(1000, 'Photo deleted successfully');
        });
    }
};
exports.ItemController = ItemController;
__decorate([
    (0, microservices_1.MessagePattern)('menu-items:create'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.CreateMenuItemRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "createMenuItem", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-items:get-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.GetMenuItemsRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "getMenuItems", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-items:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.UpdateMenuItemRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "updateMenuItem", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-items:update-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.UpdateMenuItemStatusRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "updateMenuItemStatus", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-items:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.DeleteMenuItemRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "deleteMenuItem", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-item-photos:add'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.AddMenuItemPhotoRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "addMenuItemPhoto", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-item-photos:get-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.GetMenuItemPhotosRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "getMenuItemPhotos", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-item-photos:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.UpdateMenuItemPhotoRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "updateMenuItemPhoto", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-item-photos:set-primary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.SetPrimaryPhotoRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "setPrimaryPhoto", null);
__decorate([
    (0, microservices_1.MessagePattern)('menu-item-photos:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.DeleteMenuItemPhotoRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "deleteMenuItemPhoto", null);
exports.ItemController = ItemController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [item_service_1.ItemService])
], ItemController);
//# sourceMappingURL=item.controller.js.map