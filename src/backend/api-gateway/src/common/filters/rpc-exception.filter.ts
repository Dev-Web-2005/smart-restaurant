import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response, Request } from 'express';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
	catch(exception: RpcException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const error = exception.getError();

		if (typeof error === 'object' && error !== null) {
			const errorObj = error as any;
			// Ensure statusCode is always a valid number
			const statusCode =
				typeof errorObj.status === 'number'
					? errorObj.status
					: HttpStatus.INTERNAL_SERVER_ERROR;
			const code = typeof errorObj.code === 'number' ? errorObj.code : statusCode;

			return response.status(statusCode).json({
				code: code,
				message: errorObj.message || 'Internal server error',
				errors: errorObj.errors,
				timestamp: new Date().toISOString(),
				path: request.url,
			});
		}

		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			code: 9999,
			message: typeof error === 'string' ? error : 'Internal server error',
			timestamp: new Date().toISOString(),
			path: request.url,
		});
	}
}
