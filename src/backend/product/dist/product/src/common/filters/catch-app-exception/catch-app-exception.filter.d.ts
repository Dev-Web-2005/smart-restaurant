import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Observable } from 'rxjs';
import AppException from '@shared/exceptions/app-exception';
export declare class CatchAppExceptionFilter implements ExceptionFilter {
    catch(exception: AppException, host: ArgumentsHost): Observable<any>;
}
