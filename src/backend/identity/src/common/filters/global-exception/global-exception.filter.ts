import { Catch, ArgumentsHost } from '@nestjs/common';
import { RpcException, BaseRpcExceptionFilter } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import AppException from '@shared/exceptions/app-exception';

@Catch()
export class GlobalExceptionFilter extends BaseRpcExceptionFilter {
	catch(exception: any, host: ArgumentsHost): Observable<any> {
		if (exception instanceof AppException) {
			const errorCode = exception.getErrorCode();
			return super.catch(
				new RpcException({
					code: errorCode.code,
					message: errorCode.message,
					status: errorCode.httpStatus,
				}),
				host,
			);
		}

		if (exception instanceof RpcException) {
			return super.catch(exception, host);
		}

		console.error('Unhandled exception:', exception);
		const response = {
			code: 9999,
			message: 'Internal server error',
			status: 500,
			error: exception?.message || null,
		};
		return super.catch(new RpcException(response), host);
	}
}
