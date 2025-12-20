import { ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
export default function Role(...roles: string[]): {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>;
};
