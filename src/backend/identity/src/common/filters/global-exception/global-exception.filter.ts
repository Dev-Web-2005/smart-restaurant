import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import AppException from '@shared/exceptions/app-exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		// Handle AppException
		if (exception instanceof AppException) {
			const errorCode = exception.getErrorCode();
			throw new RpcException({
				code: errorCode.code,
				message: errorCode.message,
				status: errorCode.httpStatus,
			});
		}

		// Handle RpcException
		if (exception instanceof RpcException) {
			throw exception;
		}

		// Handle all other exceptions
		console.error('Unhandled exception in Identity service:', exception);
		throw new RpcException({
			code: 9999,
			message: 'Internal server error',
			status: 500,
			error: exception?.message || null,
		});
	}
}
