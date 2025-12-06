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
					body: responseBody ? JSON.parse(responseBody) : null,
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
