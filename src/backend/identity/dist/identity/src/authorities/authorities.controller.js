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
exports.AuthoritiesController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const authorities_service_1 = require("./authorities.service");
const create_authority_request_dto_1 = __importDefault(require("./dtos/request/create-authority-request.dto"));
const http_response_1 = __importDefault(require("../../../shared/src/utils/http-response"));
const config_1 = require("@nestjs/config");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const get_all_authorities_request_dto_1 = require("./dtos/request/get-all-authorities-request.dto");
const rpc_error_handler_1 = require("../../../shared/src/utils/rpc-error-handler");
let AuthoritiesController = class AuthoritiesController {
    authoritiesService;
    config;
    constructor(authoritiesService, config) {
        this.authoritiesService = authoritiesService;
        this.config = config;
    }
    async getAllAuthorities(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('IDENTITY_API_KEY');
            if (data.identityApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return new http_response_1.default(200, 'Get all authorities successful', await this.authoritiesService.getAllAuthorities());
        });
    }
    async createAuthority(data) {
        return (0, rpc_error_handler_1.handleRpcCall)(async () => {
            const expectedApiKey = this.config.get('IDENTITY_API_KEY');
            if (data.identityApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            return new http_response_1.default(200, 'Create authority successful', await this.authoritiesService.createAuthority(data));
        });
    }
};
exports.AuthoritiesController = AuthoritiesController;
__decorate([
    (0, microservices_1.MessagePattern)('authorities:get-all-authorities'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_all_authorities_request_dto_1.GetAllAuthoritiesRequestDto]),
    __metadata("design:returntype", Promise)
], AuthoritiesController.prototype, "getAllAuthorities", null);
__decorate([
    (0, microservices_1.MessagePattern)('authorities:create-authority'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_authority_request_dto_1.default]),
    __metadata("design:returntype", Promise)
], AuthoritiesController.prototype, "createAuthority", null);
exports.AuthoritiesController = AuthoritiesController = __decorate([
    (0, common_1.Controller)('authorities'),
    __metadata("design:paramtypes", [authorities_service_1.AuthoritiesService,
        config_1.ConfigService])
], AuthoritiesController);
//# sourceMappingURL=authorities.controller.js.map