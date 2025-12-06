import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		@Inject('IDENTITY_SERVICE') private readonly identityClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();

		const authHeader = request.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		const accessToken = authHeader.substring(7);

		const refreshToken = request.cookies?.['refreshToken'];

		try {
			const validateResponse = await firstValueFrom(
				this.identityClient.send('auth:validate-token', {
					accessToken,
					refreshToken,
					identityApiKey: this.configService.get('IDENTITY_API_KEY'),
				}),
			);

			if (!validateResponse || validateResponse.code !== 200) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}

			const data = validateResponse.data;

			if (!data || !data.valid || !data.user) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
			request.user = data.user;

			if (data.newAccessToken) {
				response.setHeader('X-New-Access-Token', data.newAccessToken);
			}

			return true;
		} catch (error) {
			console.error('Auth validation error:', error);
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
	}
}
