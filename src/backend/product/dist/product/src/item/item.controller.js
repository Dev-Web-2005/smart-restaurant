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
    async createItem(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const item = await this.itemService.createItem(dto);
            return new http_response_1.default(1000, 'Menu item created successfully', item);
        });
    }
    async getItems(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const items = await this.itemService.getItems(dto);
            return new http_response_1.default(1000, 'Menu items retrieved successfully', items);
        });
    }
    async updateItem(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const item = await this.itemService.updateItem(dto);
            return new http_response_1.default(1000, 'Menu item updated successfully', item);
        });
    }
    async publishItem(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const item = await this.itemService.publishItem(dto);
            return new http_response_1.default(1000, 'Menu item publish status updated', item);
        });
    }
    async deleteItem(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            await this.itemService.deleteItem(dto);
            return new http_response_1.default(1000, 'Menu item deleted successfully');
        });
    }
    async addModifiers(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const item = await this.itemService.addModifiers(dto);
            return new http_response_1.default(1000, 'Modifiers added successfully', item);
        });
    }
};
exports.ItemController = ItemController;
__decorate([
    (0, microservices_1.MessagePattern)('items:create'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.CreateItemRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "createItem", null);
__decorate([
    (0, microservices_1.MessagePattern)('items:get-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.GetItemsRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "getItems", null);
__decorate([
    (0, microservices_1.MessagePattern)('items:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.UpdateItemRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "updateItem", null);
__decorate([
    (0, microservices_1.MessagePattern)('items:publish'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.PublishItemRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "publishItem", null);
__decorate([
    (0, microservices_1.MessagePattern)('items:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.DeleteItemRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "deleteItem", null);
__decorate([
    (0, microservices_1.MessagePattern)('items:add-modifiers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.AddModifiersRequestDto]),
    __metadata("design:returntype", Promise)
], ItemController.prototype, "addModifiers", null);
exports.ItemController = ItemController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [item_service_1.ItemService])
], ItemController);
//# sourceMappingURL=item.controller.js.map