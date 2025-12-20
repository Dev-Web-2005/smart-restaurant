import { ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { Observable } from 'rxjs';
export declare class GlobalExceptionFilter extends BaseRpcExceptionFilter {
    catch(exception: any, host: ArgumentsHost): Observable<any>;
}
