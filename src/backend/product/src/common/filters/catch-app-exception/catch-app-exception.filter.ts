import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import AppException from '@shared/exceptions/app-exception';

@Catch(AppException)
export class CatchAppExceptionFilter implements ExceptionFilter {
	catch(exception: AppException, host: ArgumentsHost): Observable<any> {
		return throwError(() => exception);
	}
}
