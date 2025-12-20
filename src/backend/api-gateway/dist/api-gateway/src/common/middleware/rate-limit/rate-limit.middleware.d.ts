import { NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
export declare class RateLimitMiddleware implements NestMiddleware {
    private readonly configService;
    private readonly rateLimitStore;
    private readonly RATE_LIMIT_MAX_REQUESTS;
    private readonly RATE_LIMIT_WINDOW_MS;
    constructor(configService: ConfigService);
    use(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
    private checkRateLimit;
    private getClientIp;
    private cleanupExpiredEntries;
}
