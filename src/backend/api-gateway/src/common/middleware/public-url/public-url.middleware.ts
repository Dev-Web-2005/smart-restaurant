import { HttpStatus, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicUrlMiddleware implements NestMiddleware {
	// Public URLs không cần API key
	private readonly PUBLIC_URLS = [
		'/',
		'/health',
		'/api/v1/identity/auth/login',
		'/api/v1/identity/auth/register',
		'/api/v1/identity/auth/refresh',
		'/api/v1/product/public/menu',
	];

	constructor(private readonly configService: ConfigService) {}

	use(req: Request, res: Response, next: NextFunction) {
		// Set public URL header
		const url = req.originalUrl || req.url;
		const isPublicUrl = this.PUBLIC_URLS.some((publicUrl) => url.startsWith(publicUrl));

		if (!isPublicUrl) {
			const apiKey = req.headers['x-api-key'] as string;
			const expectedApiKey = this.configService.get<string>('X_API_KEY');

			if (!apiKey || apiKey !== expectedApiKey) {
				return res.status(HttpStatus.UNAUTHORIZED).json({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized: Invalid or missing API key',
					data: null,
				});
			}
		}

		next();
	}
}
