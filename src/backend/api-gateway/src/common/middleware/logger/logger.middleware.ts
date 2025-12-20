import { logger } from '../../logger';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		const startTime = Date.now();
		const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		const method = req.method;
		const url = req.originalUrl || req.url;
		const userAgent = req.headers['user-agent'] || '';

		const originalSend = res.send;
		let responseBody: any;

		res.send = function (body: any): Response {
			responseBody = body;
			return originalSend.call(this, body);
		};

		res.on('finish', () => {
			const duration = Date.now() - startTime;
			const statusCode = res.statusCode;

			// Parse response body safely
			let parsedBody: any = null;
			const contentType = res.getHeader('content-type') as string;

			if (responseBody) {
				// Skip parsing for binary content types
				if (
					contentType &&
					(contentType.includes('image/') ||
						contentType.includes('application/pdf') ||
						contentType.includes('application/octet-stream'))
				) {
					parsedBody = Buffer.isBuffer(responseBody)
						? `<Binary data: ${responseBody.length} bytes>`
						: '<Binary data>';
				} else {
					// Try to parse JSON for text-based responses
					try {
						parsedBody =
							typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
					} catch {
						// If parsing fails, use string representation
						parsedBody =
							typeof responseBody === 'string'
								? responseBody.substring(0, 200) // Truncate long strings
								: '<Non-JSON response>';
					}
				}
			}

			const logData = {
				timestamp: new Date().toISOString(),
				request: {
					method: method,
					url: url,
					ip: String(ip),
					userAgent: userAgent,
					body: req.body || {},
					query: req.query || {},
					params: req.params || {},
				},
				response: {
					statusCode: statusCode,
					contentType: contentType || 'unknown',
					body: parsedBody,
				},
				duration: `${duration}ms`,
			};

			if (statusCode >= 500) {
				logger.error(JSON.stringify(logData, null, 2));
			} else if (statusCode >= 400) {
				logger.warn(JSON.stringify(logData, null, 2));
			} else {
				logger.info(JSON.stringify(logData, null, 2));
			}
		});

		next();
	}
}
