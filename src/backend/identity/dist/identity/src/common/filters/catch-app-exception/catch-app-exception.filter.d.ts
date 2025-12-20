import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import AppException from '@shared/exceptions/app-exception';
export declare class CatchAppExceptionFilter implements ExceptionFilter {
    catch(exception: AppException, host: ArgumentsHost): void;
}
