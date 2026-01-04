import { RpcException } from "@nestjs/microservices";
import AppException from "../exceptions/app-exception";

export async function handleRpcCall<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		if (error instanceof AppException) {
			const errorCode = error.getErrorCode();
			throw new RpcException({
				code: errorCode.code,
				message: errorCode.message,
				status: errorCode.httpStatus,
			});
		}
		throw error;
	}
}
