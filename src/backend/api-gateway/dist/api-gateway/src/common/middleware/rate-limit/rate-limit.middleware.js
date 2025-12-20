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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitMiddleware = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RateLimitMiddleware = class RateLimitMiddleware {
    configService;
    rateLimitStore = new Map();
    RATE_LIMIT_MAX_REQUESTS = 5;
    RATE_LIMIT_WINDOW_MS = 1000;
    constructor(configService) {
        this.configService = configService;
        setInterval(() => this.cleanupExpiredEntries(), 10000);
    }
    use(req, res, next) {
        const ip = this.getClientIp(req);
        if (!this.checkRateLimit(ip)) {
            return res.status(common_1.HttpStatus.TOO_MANY_REQUESTS).json({
                code: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Too many requests. Please try again later.',
                data: null,
            });
        }
        next();
    }
    checkRateLimit(ip) {
        const now = Date.now();
        const entry = this.rateLimitStore.get(ip);
        if (!entry) {
            this.rateLimitStore.set(ip, {
                count: 1,
                resetTime: now + this.RATE_LIMIT_WINDOW_MS,
            });
            return true;
        }
        if (now > entry.resetTime) {
            this.rateLimitStore.set(ip, {
                count: 1,
                resetTime: now + this.RATE_LIMIT_WINDOW_MS,
            });
            return true;
        }
        if (entry.count >= this.RATE_LIMIT_MAX_REQUESTS) {
            return false;
        }
        entry.count++;
        return true;
    }
    getClientIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        const realIp = req.headers['x-real-ip'];
        if (realIp) {
            return realIp;
        }
        return req.socket.remoteAddress || 'unknown';
    }
    cleanupExpiredEntries() {
        const now = Date.now();
        for (const [ip, entry] of this.rateLimitStore.entries()) {
            if (now > entry.resetTime) {
                this.rateLimitStore.delete(ip);
            }
        }
    }
};
exports.RateLimitMiddleware = RateLimitMiddleware;
exports.RateLimitMiddleware = RateLimitMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RateLimitMiddleware);
//# sourceMappingURL=rate-limit.middleware.js.map