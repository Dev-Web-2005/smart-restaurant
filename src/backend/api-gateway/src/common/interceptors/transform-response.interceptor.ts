import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { ApiResponse } from '@shared/types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			map((data) => {
				if (data instanceof ApiResponse) {
					return data;
				}

				if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
					return data;
				}

				return {
					code: 200,
					message: 'Success',
					data: data,
				};
			}),
		);
	}
}
