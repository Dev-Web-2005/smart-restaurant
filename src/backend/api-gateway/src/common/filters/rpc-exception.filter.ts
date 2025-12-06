import { Catch, ExceptionFilter, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
	catch(exception: RpcException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		const error = exception.getError();

		if (typeof error === 'object' && error !== null) {
			const errorObj = error as any;
			const statusCode = errorObj.status;

			return response.status(statusCode).json({
				code: errorObj.code,
				message: errorObj.message,
				errors: errorObj.errors,
				timestamp: new Date().toISOString(),
			});
		}

		return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			code: 9999,
			message: typeof error === 'string' ? error : 'Internal server error',
			timestamp: new Date().toISOString(),
		});
	}
}
