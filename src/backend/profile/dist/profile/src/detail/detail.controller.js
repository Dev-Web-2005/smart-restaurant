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
exports.DetailController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const class_transformer_1 = require("class-transformer");
const modify_profile_request_dto_1 = require("./dtos/request/modify-profile-request.dto");
const get_profile_request_dto_1 = require("./dtos/request/get-profile-request.dto");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const detail_service_1 = require("./detail.service");
const get_verified_state_request_dto_1 = require("./dtos/request/get-verified-state-request.dto");
const rpc_error_handler_1 = require("../../../shared/src/utils/rpc-error-handler");
let DetailController = class DetailController {
    detailService;
    config;
    constructor(detailService, config) {
        this.detailService = detailService;
        this.config = config;
    }
    async modifyProfile(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('PROFILE_API_KEY');
            if (data.profileApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return this.detailService.modifyProfileServiceStatus((0, class_transformer_1.plainToInstance)(modify_profile_request_dto_1.ModifyProfileRequestDto, data));
        });
    }
    async getProfile(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('PROFILE_API_KEY');
            if (data.profileApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return this.detailService.getProfileServiceStatus(data.userId);
        });
    }
    async getVerifiedState(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('PROFILE_API_KEY');
            if (data.profileApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return (await this.detailService.getProfileServiceStatus(data.userId)).verified;
        });
    }
};
exports.DetailController = DetailController;
__decorate([
    (0, microservices_1.MessagePattern)('profiles:modify-profile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [modify_profile_request_dto_1.ModifyProfileRequestDto]),
    __metadata("design:returntype", Promise)
], DetailController.prototype, "modifyProfile", null);
__decorate([
    (0, microservices_1.MessagePattern)('profiles:get-profile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_profile_request_dto_1.GetProfileRequestDto]),
    __metadata("design:returntype", Promise)
], DetailController.prototype, "getProfile", null);
__decorate([
    (0, microservices_1.MessagePattern)('profiles:get-verified-state'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_verified_state_request_dto_1.GetVerifiedStateRequestDto]),
    __metadata("design:returntype", Promise)
], DetailController.prototype, "getVerifiedState", null);
exports.DetailController = DetailController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [detail_service_1.DetailService,
        config_1.ConfigService])
], DetailController);
//# sourceMappingURL=detail.controller.js.map