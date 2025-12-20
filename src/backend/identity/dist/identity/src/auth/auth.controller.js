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
exports.AuthController = void 0;
const logout_auth_request_dto_1 = require("./dtos/request/logout-auth.request.dto");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const auth_service_1 = require("./auth.service");
const login_auth_request_dto_1 = __importDefault(require("./dtos/request/login-auth-request.dto"));
const http_response_1 = __importDefault(require("../../../shared/src/utils/http-response"));
const config_1 = require("@nestjs/config");
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../shared/src/exceptions/error-code"));
const auth_me_request_dto_1 = require("./dtos/request/auth-me-request.dto");
const validate_token_request_dto_1 = require("./dtos/request/validate-token-request.dto");
let AuthController = class AuthController {
    authService;
    config;
    constructor(authService, config) {
        this.authService = authService;
        this.config = config;
    }
    async login(data) {
        const expectedApiKey = this.config.get('IDENTITY_API_KEY');
        if (data.identityApiKey !== expectedApiKey) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        const result = await this.authService.login(data);
        return new http_response_1.default(200, 'Login successful', result);
    }
    async validateToken(data) {
        const expectedApiKey = this.config.get('IDENTITY_API_KEY');
        if (data.identityApiKey !== expectedApiKey) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        const result = await this.authService.validateToken(data);
        if (!result.valid) {
            return new http_response_1.default(401, 'Token invalid', null);
        }
        return new http_response_1.default(200, 'Token valid', result);
    }
    async refreshToken(data) {
        const expectedApiKey = this.config.get('IDENTITY_API_KEY');
        if (data.identityApiKey !== expectedApiKey) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        try {
            const result = await this.authService.getUserFromRefreshToken(data.refreshToken);
            return new http_response_1.default(200, 'Token refreshed', result);
        }
        catch (error) {
            console.error('Error refreshing token:', error);
            return new http_response_1.default(401, 'Invalid refresh token', null);
        }
    }
    async me(data) {
        const expectedApiKey = this.config.get('IDENTITY_API_KEY');
        if (data.identityApiKey !== expectedApiKey) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        const result = await this.authService.me(data.userId);
        if (result === null) {
            return new http_response_1.default(404, 'User not found', null);
        }
        return new http_response_1.default(200, 'User fetched successfully', result);
    }
    async logout(data) {
        if (data.identityApiKey) {
            const expectedApiKey = this.config.get('IDENTITY_API_KEY');
            if (data.identityApiKey !== expectedApiKey) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
        }
        await this.authService.logout(data);
        return new http_response_1.default(200, 'Logout successful', null);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, microservices_1.MessagePattern)('auth:login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_auth_request_dto_1.default]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth:validate-token'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_token_request_dto_1.ValidateTokenRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateToken", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth:refresh-token'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth:me'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_me_request_dto_1.AuthMeRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, microservices_1.MessagePattern)('auth:logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [logout_auth_request_dto_1.LogoutAuthRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map