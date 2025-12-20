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
exports.IdentityController = void 0;
const types_1 = require("../../../../shared/src/types");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const app_exception_1 = __importDefault(require("../../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../../shared/src/exceptions/error-code"));
const check_role_guard_1 = __importDefault(require("../../common/guards/check-role/check-role.guard"));
const auth_guard_1 = require("../../common/guards/get-role/auth.guard");
let IdentityController = class IdentityController {
    identityClient;
    configService;
    constructor(identityClient, configService) {
        this.identityClient = identityClient;
        this.configService = configService;
    }
    registerUser(data) {
        return this.identityClient.send('users:register', {
            ...data,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    getMyUser(req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        return this.identityClient.send('users:get-user-by-id', {
            userId,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    getAllUsers() {
        return this.identityClient.send('users:get-all-users', {
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    getUserById(userId) {
        return this.identityClient.send('users:get-user-by-id', {
            userId,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    createRole(data) {
        return this.identityClient.send('roles:create-role', {
            ...data,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    getAllRoles() {
        return this.identityClient.send('roles:get-all-roles', {
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    createAuthority(data) {
        return this.identityClient.send('authorities:create-authority', {
            ...data,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    getAllAuthorities() {
        return this.identityClient.send('authorities:get-all-authorities', {
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    async login(data, res) {
        const observableResponse = this.identityClient.send('auth:login', {
            ...data,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
        const response = await (0, rxjs_1.firstValueFrom)(observableResponse);
        if (!response || !response.code || response.code !== common_1.HttpStatus.OK) {
            const statusCode = typeof response?.code === 'number' ? response.code : common_1.HttpStatus.UNAUTHORIZED;
            return res.status(statusCode).json(response);
        }
        const convertData = response;
        const refreshTokenExpiry = this.configService.get('REFRESH_TOKEN_EXPIRES_IN');
        res.cookie('refreshToken', convertData.data.refreshToken, {
            httpOnly: true,
            maxAge: refreshTokenExpiry,
            sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
            secure: process.env.MOD === 'production' ? true : false,
            path: '/',
        });
        const type = convertData.data.roles.includes('ADMIN') ? 'admin' : 'user';
        res.cookie('type', type, {
            httpOnly: false,
            maxAge: refreshTokenExpiry,
            sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
            secure: process.env.MOD === 'production' ? true : false,
            path: '/',
        });
        return res.status(common_1.HttpStatus.OK).json(new types_1.ApiResponse({
            code: 1000,
            message: response.message,
            data: {
                userId: convertData.data.userId,
                username: convertData.data.username,
                email: convertData.data.email,
                roles: convertData.data.roles,
                accessToken: convertData.data.accessToken,
            },
        }));
    }
    async refreshToken(req, res) {
        const refreshToken = req.cookies['refreshToken'];
        if (!refreshToken) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        const observableResponse = this.identityClient.send('auth:refresh-token', {
            refreshToken,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
        const response = await (0, rxjs_1.firstValueFrom)(observableResponse);
        if (!response || !response.code || response.code !== common_1.HttpStatus.OK) {
            const statusCode = typeof response?.code === 'number' ? response.code : common_1.HttpStatus.UNAUTHORIZED;
            return res.status(statusCode).json({
                code: statusCode,
                message: response?.message || 'Token refresh failed',
                timestamp: new Date().toISOString(),
                path: '/api/v1/identity/auth/refresh',
            });
        }
        const convertData = response;
        return res.status(common_1.HttpStatus.OK).json(new types_1.ApiResponse({
            code: 1000,
            message: response.message,
            data: {
                userId: convertData.data.userId,
                username: convertData.data.username,
                email: convertData.data.email,
                roles: convertData.data.roles,
                accessToken: convertData.data.accessToken,
            },
        }));
    }
    me(req) {
        const user = req.user;
        if (!user) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        return this.identityClient.send('auth:me', {
            userId: user.userId,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        });
    }
    async logout(res, req) {
        const user = req.user;
        const accessToken = req.headers.authorization?.replace('Bearer ', '');
        const refreshToken = req.cookies['refreshToken'];
        if (!user || !accessToken) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        await (0, rxjs_1.firstValueFrom)(this.identityClient.send('auth:logout', {
            accessToken,
            refreshToken,
            userId: user.userId,
            identityApiKey: this.configService.get('IDENTITY_API_KEY'),
        }));
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
            secure: process.env.MOD === 'production' ? true : false,
            path: '/',
        });
        res.clearCookie('type', {
            httpOnly: false,
            sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
            secure: process.env.MOD === 'production' ? true : false,
            path: '/',
        });
        return res.status(common_1.HttpStatus.OK).json(new types_1.ApiResponse({
            code: 1000,
            message: 'Logout successful',
        }));
    }
};
exports.IdentityController = IdentityController;
__decorate([
    (0, common_1.Post)('users/register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "registerUser", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('users/my-user'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "getMyUser", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    (0, common_1.Get)('users/get-all-users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('users/get-user-by-id/:userId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Post)('roles/create-role'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)('roles/get-all-roles'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "getAllRoles", null);
__decorate([
    (0, common_1.Post)('authorities/create-authority'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "createAuthority", null);
__decorate([
    (0, common_1.Get)('authorities/get-all-authorities'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "getAllAuthorities", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IdentityController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('auth/refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IdentityController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('auth/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IdentityController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('auth/logout'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IdentityController.prototype, "logout", null);
exports.IdentityController = IdentityController = __decorate([
    (0, common_1.Controller)('identity'),
    __param(0, (0, common_1.Inject)('IDENTITY_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        config_1.ConfigService])
], IdentityController);
//# sourceMappingURL=identity.controller.js.map