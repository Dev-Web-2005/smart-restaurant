import { LogoutAuthRequestDto } from './dtos/request/logout-auth.request.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from 'src/auth/auth.service';
import LoginAuthRequestDto from 'src/auth/dtos/request/login-auth-request.dto';
import HttpResponse from '@shared/utils/http-response';
import { ConfigService } from '@nestjs/config';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { AuthMeRequestDto } from 'src/auth/dtos/request/auth-me-request.dto';
import { ValidateTokenRequestDto } from 'src/auth/dtos/request/validate-token-request.dto';

@Controller()
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly config: ConfigService,
	) {}

	@MessagePattern('auth:login')
	async login(data: LoginAuthRequestDto) {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		const result = await this.authService.login(data);

		return new HttpResponse(200, 'Login successful', result);
	}

	@MessagePattern('auth:validate-token')
	async validateToken(data: ValidateTokenRequestDto) {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		const result = await this.authService.validateToken(data);

		if (!result.valid) {
			return new HttpResponse(401, 'Token invalid', null);
		}

		return new HttpResponse(200, 'Token valid', result);
	}

	@MessagePattern('auth:refresh-token')
	async refreshToken(data: { refreshToken: string; identityApiKey?: string }) {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		try {
			const result = await this.authService.getUserFromRefreshToken(data.refreshToken);
			return new HttpResponse(200, 'Token refreshed', result);
		} catch (error) {
			console.error('Error refreshing token:', error);
			return new HttpResponse(401, 'Invalid refresh token', null);
		}
	}

	@MessagePattern('auth:me')
	async me(data: AuthMeRequestDto) {
		const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
		if (data.identityApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		const result = await this.authService.me(data.userId);
		if (result === null) {
			return new HttpResponse(404, 'User not found', null);
		}
		return new HttpResponse(200, 'User fetched successfully', result);
	}

	@MessagePattern('auth:logout')
	async logout(data: LogoutAuthRequestDto) {
		if (data.identityApiKey) {
			const expectedApiKey = this.config.get<string>('IDENTITY_API_KEY');
			if (data.identityApiKey !== expectedApiKey) {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}
		}
		await this.authService.logout(data);
		return new HttpResponse(200, 'Logout successful', null);
	}
}
