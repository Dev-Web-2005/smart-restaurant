import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import AppException from '@shared/exceptions/app-exception';

@Catch(AppException)
export class CatchAppExceptionFilter implements ExceptionFilter {
	catch(exception: AppException, host: ArgumentsHost) {
		const errorCode = exception.getErrorCode();
		throw new RpcException({
			code: errorCode.code,
			message: errorCode.message,
			status: errorCode.httpStatus,
		});
	}
}
