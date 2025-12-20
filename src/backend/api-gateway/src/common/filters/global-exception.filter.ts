import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		console.log('GlobalExceptionFilter caught exception:', {
			type: exception?.constructor?.name,
			isRpcException: exception instanceof RpcException,
			error: exception instanceof RpcException ? exception.getError() : exception,
		});

		// Handle RpcException specifically
		if (exception instanceof RpcException) {
			const error = exception.getError();

			if (typeof error === 'object' && error !== null) {
				const errorObj = error as any;
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

		// Handle plain error objects from microservices (serialized RpcException)
		if (typeof exception === 'object' && exception !== null && exception.error) {
			const errorObj = exception.error;

			if (typeof errorObj === 'object' && errorObj !== null) {
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
		}

		// Handle other exceptions
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
