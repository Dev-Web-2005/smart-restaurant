"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.AuthService = void 0;
const user_1 = require("../common/entities/user");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const login_auth_response_dto_1 = __importDefault(require("./dtos/response/login-auth-response.dto"));
const app_exception_1 = __importDefault(require("../../../shared/src/exceptions/app-exception"));
const exceptions_1 = require("../../../shared/src/exceptions");
const bcrypt = __importStar(require("bcrypt"));
const enum_1 = require("../../../shared/src/utils/enum");
const remove_token_1 = require("../common/entities/remove-token");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const validate_token_response_dto_1 = require("./dtos/response/validate-token-response.dto");
const refresh_token_response_dto_1 = require("./dtos/response/refresh-token-response.dto");
let AuthService = class AuthService {
    userRepository;
    removeTokenRepository;
    jwtService;
    configService;
    constructor(userRepository, removeTokenRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.removeTokenRepository = removeTokenRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '5m';
    REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    async login(data) {
        const user = await this.userRepository.findOne({
            where: { username: data.username },
            relations: ['roles'],
        });
        if (!user) {
            throw new app_exception_1.default(exceptions_1.ErrorCode.LOGIN_FAILED);
        }
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new app_exception_1.default(exceptions_1.ErrorCode.LOGIN_FAILED);
        }
        const roles = user.roles.map((role) => enum_1.RoleEnum[role.name]);
        const accessToken = this.generateAccessToken({
            userId: user.userId,
            username: user.username,
            email: user.email,
            roles,
        });
        const refreshToken = this.generateRefreshToken({
            userId: user.userId,
            username: user.username,
            email: user.email,
            roles,
        });
        const response = new login_auth_response_dto_1.default();
        response.userId = user.userId;
        response.username = user.username;
        response.email = user.email;
        response.roles = roles;
        response.accessToken = accessToken;
        response.refreshToken = refreshToken;
        return response;
    }
    generateAccessToken(payload) {
        const jwtPayload = {
            ...payload,
            type: 'access',
        };
        return this.jwtService.sign(jwtPayload, {
            secret: this.configService.get('JWT_SECRET_KEY_ACCESS'),
            expiresIn: this.ACCESS_TOKEN_EXPIRY,
        });
    }
    generateRefreshToken(payload) {
        const jwtPayload = {
            ...payload,
            type: 'refresh',
        };
        return this.jwtService.sign(jwtPayload, {
            secret: this.configService.get('JWT_SECRET_KEY_REFRESH'),
            expiresIn: this.REFRESH_TOKEN_EXPIRY,
        });
    }
    async validateToken(data) {
        const response = new validate_token_response_dto_1.ValidateTokenResponseDto();
        try {
            const isBlacklisted = await this.isTokenBlacklisted(data.accessToken);
            if (isBlacklisted) {
                response.valid = false;
                return response;
            }
            const decoded = await this.verifyAccessToken(data.accessToken);
            if (decoded.type !== 'access') {
                response.valid = false;
                return response;
            }
            response.valid = true;
            response.user = {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                roles: decoded.roles,
            };
            return response;
        }
        catch (error) {
            if (error.name === 'TokenExpiredError' || data.refreshToken) {
                return await this.refreshAccessToken(data.refreshToken);
            }
            response.valid = false;
            return response;
        }
    }
    async refreshAccessToken(refreshToken) {
        const response = new validate_token_response_dto_1.ValidateTokenResponseDto();
        try {
            const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
            if (isBlacklisted) {
                response.valid = false;
                return response;
            }
            const decoded = await this.verifyRefreshToken(refreshToken);
            if (decoded.type !== 'refresh') {
                response.valid = false;
                return response;
            }
            const newAccessToken = this.generateAccessToken({
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                roles: decoded.roles,
            });
            response.valid = true;
            response.user = {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                roles: decoded.roles,
            };
            response.newAccessToken = newAccessToken;
            return response;
        }
        catch {
            response.valid = false;
            return response;
        }
    }
    async getUserFromRefreshToken(refreshToken) {
        try {
            const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
            if (isBlacklisted) {
                throw new app_exception_1.default(exceptions_1.ErrorCode.TOKEN_EXPIRED);
            }
            const decoded = await this.verifyRefreshToken(refreshToken);
            if (decoded.type !== 'refresh') {
                throw new app_exception_1.default(exceptions_1.ErrorCode.UNAUTHORIZED);
            }
            const newAccessToken = this.generateAccessToken({
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                roles: decoded.roles,
            });
            return new refresh_token_response_dto_1.RefreshTokenResponseDto({
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                accessToken: newAccessToken,
            });
        }
        catch {
            throw new app_exception_1.default(exceptions_1.ErrorCode.TOKEN_EXPIRED);
        }
    }
    async verifyAccessToken(token) {
        return await this.jwtService.verifyAsync(token, {
            secret: this.configService.get('JWT_SECRET_KEY_ACCESS'),
        });
    }
    async verifyRefreshToken(token) {
        return await this.jwtService.verifyAsync(token, {
            secret: this.configService.get('JWT_SECRET_KEY_REFRESH'),
        });
    }
    async isTokenBlacklisted(token) {
        const found = await this.removeTokenRepository.findOne({
            where: { token },
        });
        return !!found;
    }
    async me(userId) {
        const user = await this.userRepository.findOne({
            where: { userId },
        });
        if (!user) {
            return null;
        }
        const response = {
            userId: user.userId,
            username: user.username,
            email: user.email,
        };
        return response;
    }
    async logout(data) {
        try {
            const tokensToBlacklist = [];
            try {
                const accessDecoded = (await this.jwtService.decode(data.accessToken));
                if (accessDecoded && accessDecoded.exp) {
                    tokensToBlacklist.push({
                        token: data.accessToken,
                        type: 'access',
                        expiryDate: new Date(accessDecoded.exp * 1000),
                    });
                }
            }
            catch (err) {
                console.error('Error decoding access token:', err);
            }
            if (data.refreshToken) {
                try {
                    const refreshDecoded = (await this.jwtService.decode(data.refreshToken));
                    if (refreshDecoded && refreshDecoded.exp) {
                        tokensToBlacklist.push({
                            token: data.refreshToken,
                            type: 'refresh',
                            expiryDate: new Date(refreshDecoded.exp * 1000),
                        });
                    }
                }
                catch (err) {
                    console.error('Error decoding refresh token:', err);
                }
            }
            for (const tokenData of tokensToBlacklist) {
                await this.removeTokenRepository.save({
                    token: tokenData.token,
                    tokenType: tokenData.type,
                    expiryDate: tokenData.expiryDate,
                    userId: data.userId,
                });
            }
        }
        catch (err) {
            console.error('Error during logout:', err);
            throw new app_exception_1.default(exceptions_1.ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(remove_token_1.RemoveToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map