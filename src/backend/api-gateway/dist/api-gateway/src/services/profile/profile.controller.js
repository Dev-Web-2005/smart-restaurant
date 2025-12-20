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
exports.ProfileController = void 0;
const utils_1 = require("../../../../shared/src/utils");
const rxjs_1 = require("rxjs");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const app_exception_1 = __importDefault(require("../../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../../shared/src/exceptions/error-code"));
const check_role_guard_1 = __importDefault(require("../../common/guards/check-role/check-role.guard"));
const auth_guard_1 = require("../../common/guards/get-role/auth.guard");
let ProfileController = class ProfileController {
    profileClient;
    configService;
    constructor(profileClient, configService) {
        this.profileClient = profileClient;
        this.configService = configService;
    }
    getMyProfile(req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        return this.profileClient.send('profiles:get-profile', {
            userId,
            profileApiKey: this.configService.get('PROFILE_API_KEY'),
        });
    }
    modifyProfile(data, req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        return this.profileClient.send('profiles:modify-profile', {
            ...data,
            userId,
            profileApiKey: this.configService.get('PROFILE_API_KEY'),
        });
    }
    async getVerifiedState(req) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        const res = await (0, rxjs_1.firstValueFrom)(this.profileClient.send('profiles:get-verified-state', {
            userId,
            profileApiKey: this.configService.get('PROFILE_API_KEY'),
        }));
        return new utils_1.HttpResponse(100, 'Get verified state successful', {
            verified: res,
        });
    }
    getProfile(userId) {
        return this.profileClient.send('profiles:get-profile', {
            userId,
            profileApiKey: this.configService.get('PROFILE_API_KEY'),
        });
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('my-profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Patch)('modify'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "modifyProfile", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Get)('/verify-state'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getVerifiedState", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, check_role_guard_1.default)('ADMIN')),
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProfileController.prototype, "getProfile", null);
exports.ProfileController = ProfileController = __decorate([
    (0, common_1.Controller)('profiles'),
    __param(0, (0, common_1.Inject)('PROFILE_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        config_1.ConfigService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map