import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
	private readonly rateLimitStore = new Map<string, RateLimitEntry>();

	private readonly RATE_LIMIT_MAX_REQUESTS = 5;
	private readonly RATE_LIMIT_WINDOW_MS = 1000;

	constructor(private readonly configService: ConfigService) {
		setInterval(() => this.cleanupExpiredEntries(), 10000);
	}

	use(req: Request, res: Response, next: NextFunction) {
		const ip = this.getClientIp(req);

		if (!this.checkRateLimit(ip)) {
			return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
				code: HttpStatus.TOO_MANY_REQUESTS,
				message: 'Too many requests. Please try again later.',
				data: null,
			});
		}

		next();
	}

	private checkRateLimit(ip: string): boolean {
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

	private getClientIp(req: Request): string {
		const forwarded = req.headers['x-forwarded-for'] as string;
		if (forwarded) {
			return forwarded.split(',')[0].trim();
		}

		const realIp = req.headers['x-real-ip'] as string;
		if (realIp) {
			return realIp;
		}

		return req.socket.remoteAddress || 'unknown';
	}

	private cleanupExpiredEntries(): void {
		const now = Date.now();
		for (const [ip, entry] of this.rateLimitStore.entries()) {
			if (now > entry.resetTime) {
				this.rateLimitStore.delete(ip);
			}
		}
	}
}
