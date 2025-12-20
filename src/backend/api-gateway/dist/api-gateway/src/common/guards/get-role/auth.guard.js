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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const app_exception_1 = __importDefault(require("../../../../../shared/src/exceptions/app-exception"));
const error_code_1 = __importDefault(require("../../../../../shared/src/exceptions/error-code"));
let AuthGuard = class AuthGuard {
    identityClient;
    configService;
    constructor(identityClient, configService) {
        this.identityClient = identityClient;
        this.configService = configService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
        const accessToken = authHeader.substring(7);
        const refreshToken = request.cookies?.['refreshToken'];
        try {
            const validateResponse = await (0, rxjs_1.firstValueFrom)(this.identityClient.send('auth:validate-token', {
                accessToken,
                refreshToken,
                identityApiKey: this.configService.get('IDENTITY_API_KEY'),
            }));
            if (!validateResponse || validateResponse.code !== 200) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            const data = validateResponse.data;
            if (!data || !data.valid || !data.user) {
                throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
            }
            request.user = data.user;
            if (data.newAccessToken) {
                response.setHeader('X-New-Access-Token', data.newAccessToken);
            }
            return true;
        }
        catch (error) {
            console.error('Auth validation error:', error);
            throw new app_exception_1.default(error_code_1.default.UNAUTHORIZED);
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IDENTITY_SERVICE')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy,
        config_1.ConfigService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map