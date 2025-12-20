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
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const public_service_1 = require("./public.service");
const get_public_menu_request_dto_1 = require("./dtos/request/get-public-menu-request.dto");
const http_response_1 = __importDefault(require("../../../shared/src/utils/http-response"));
const rpc_error_handler_1 = require("../../../shared/src/utils/rpc-error-handler");
let PublicController = class PublicController {
    publicService;
    constructor(publicService) {
        this.publicService = publicService;
    }
    async getPublicMenu(dto) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const menu = await this.publicService.getPublicMenu(dto);
            return new http_response_1.default(1000, 'Public menu retrieved successfully', menu);
        });
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, microservices_1.MessagePattern)('public:get-menu'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_public_menu_request_dto_1.GetPublicMenuRequestDto]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "getPublicMenu", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [public_service_1.PublicService])
], PublicController);
//# sourceMappingURL=public.controller.js.map