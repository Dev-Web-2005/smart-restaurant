import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { RequestUser } from '@shared/types';

export default function Role(...roles: string[]) {
	@Injectable()
	class CheckRoleGuard implements CanActivate {
		canActivate(
			context: ExecutionContext,
		): boolean | Promise<boolean> | Observable<boolean> {
			const request = context.switchToHttp().getRequest();
			const user = request.user as RequestUser | undefined;

			if (!user || !user.roles) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}

			const userRoles: string[] = user.roles;
			console.log('User roles:', userRoles);

			for (const role of roles) {
				if (userRoles.includes(role)) {
					return true;
				}
			}

			throw new AppException(ErrorCode.FORBIDDEN || ErrorCode.UNAUTHORIZED);
		}
	}

	return new CheckRoleGuard();
}
