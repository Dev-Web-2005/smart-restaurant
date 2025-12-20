import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		// Ensure status is always a valid HTTP status code number
		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		if (typeof exception.status === 'number') {
			status = exception.status;
		} else if (typeof exception.code === 'number') {
			status = exception.code;
		}

		const message = exception.message || 'Internal server error';

		const errorResponse: any = {
			code: typeof exception.code === 'number' ? exception.code : status,
			message: message,
			timestamp: new Date().toISOString(),
			path: request.url,
		};

		if (exception.errors) {
			errorResponse.errors = exception.errors;
		}

		if (exception.data) {
			errorResponse.data = exception.data;
		}

		response.status(status).json(errorResponse);
	}
}
