import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		const status = exception.status || exception.code || HttpStatus.INTERNAL_SERVER_ERROR;
		const message = exception.message || 'Internal server error';

		const errorResponse: any = {
			code: exception.code || status,
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
