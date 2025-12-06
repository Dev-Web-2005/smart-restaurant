import { User } from 'src/common/entities/user';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import LoginAuthRequestDto from 'src/auth/dtos/request/login-auth-request.dto';
import LoginAuthResponseDto from 'src/auth/dtos/response/login-auth-response.dto';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import * as bcrypt from 'bcrypt';
import { RoleEnum } from '@shared/utils/enum';
import { GetUserResponseDto } from 'src/users/dtos/response/get-user-response.dto';
import { LogoutAuthRequestDto } from 'src/auth/dtos/request/logout-auth.request.dto';
import { RemoveToken } from 'src/common/entities/remove-token';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ValidateTokenRequestDto } from 'src/auth/dtos/request/validate-token-request.dto';
import { ValidateTokenResponseDto } from 'src/auth/dtos/response/validate-token-response.dto';
import { RefreshTokenResponseDto } from 'src/auth/dtos/response/refresh-token-response.dto';
import { JwtPayload } from '@shared/types';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(RemoveToken)
		private readonly removeTokenRepository: Repository<RemoveToken>,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}
	private readonly ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '5m'; // 15 phút
	private readonly REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d'; // 7 ngày

	async login(data: LoginAuthRequestDto): Promise<LoginAuthResponseDto> {
		const user = await this.userRepository.findOne({
			where: { username: data.username },
			relations: ['roles'],
		});

		if (!user) {
			throw new AppException(ErrorCode.LOGIN_FAILED);
		}

		const isPasswordValid = await bcrypt.compare(data.password, user.password);
		if (!isPasswordValid) {
			throw new AppException(ErrorCode.LOGIN_FAILED);
		}

		const roles = user.roles.map((role) => RoleEnum[role.name]);

		const accessToken = this.generateAccessToken({
			userId: user.userId,
			username: user.username,
			email: user.email,
			roles,
		});

		const refreshToken = this.generateRefreshToken({
			userId: user.userId,
			username: user.username,
			email: user.email,
			roles,
		});

		const response = new LoginAuthResponseDto();
		response.userId = user.userId;
		response.username = user.username;
		response.email = user.email;
		response.roles = roles;
		response.accessToken = accessToken;
		response.refreshToken = refreshToken;

		return response;
	}

	private generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
		const jwtPayload: JwtPayload = {
			...payload,
			type: 'access',
		};

		return this.jwtService.sign(jwtPayload, {
			secret: this.configService.get<string>('JWT_SECRET_KEY_ACCESS'),
			expiresIn: this.ACCESS_TOKEN_EXPIRY as any,
		});
	}

	generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
		const jwtPayload: JwtPayload = {
			...payload,
			type: 'refresh',
		};

		return this.jwtService.sign(jwtPayload, {
			secret: this.configService.get<string>('JWT_SECRET_KEY_REFRESH'),
			expiresIn: this.REFRESH_TOKEN_EXPIRY as any,
		}) as string;
	}

	async validateToken(data: ValidateTokenRequestDto): Promise<ValidateTokenResponseDto> {
		const response = new ValidateTokenResponseDto();

		try {
			const isBlacklisted = await this.isTokenBlacklisted(data.accessToken);
			if (isBlacklisted) {
				response.valid = false;
				return response;
			}

			const decoded = await this.verifyAccessToken(data.accessToken);

			if (decoded.type !== 'access') {
				response.valid = false;
				return response;
			}

			response.valid = true;
			response.user = {
				userId: decoded.userId,
				username: decoded.username,
				email: decoded.email,
				roles: decoded.roles,
			};

			return response;
		} catch (error) {
			if (error.name === 'TokenExpiredError' || data.refreshToken) {
				return await this.refreshAccessToken(data.refreshToken);
			}

			response.valid = false;
			return response;
		}
	}

	async refreshAccessToken(refreshToken: string): Promise<ValidateTokenResponseDto> {
		const response = new ValidateTokenResponseDto();

		try {
			const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
			if (isBlacklisted) {
				response.valid = false;
				return response;
			}

			const decoded = await this.verifyRefreshToken(refreshToken);

			if (decoded.type !== 'refresh') {
				response.valid = false;
				return response;
			}

			const newAccessToken = this.generateAccessToken({
				userId: decoded.userId,
				username: decoded.username,
				email: decoded.email,
				roles: decoded.roles,
			});

			response.valid = true;
			response.user = {
				userId: decoded.userId,
				username: decoded.username,
				email: decoded.email,
				roles: decoded.roles,
			};
			response.newAccessToken = newAccessToken;

			return response;
		} catch {
			response.valid = false;
			return response;
		}
	}

	async getUserFromRefreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
		try {
			const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
			if (isBlacklisted) {
				throw new AppException(ErrorCode.TOKEN_EXPIRED);
			}

			const decoded = await this.verifyRefreshToken(refreshToken);

			if (decoded.type !== 'refresh') {
				throw new AppException(ErrorCode.UNAUTHORIZED);
			}

			const newAccessToken = this.generateAccessToken({
				userId: decoded.userId,
				username: decoded.username,
				email: decoded.email,
				roles: decoded.roles,
			});

			return new RefreshTokenResponseDto({
				userId: decoded.userId,
				username: decoded.username,
				email: decoded.email,
				accessToken: newAccessToken,
			});
		} catch {
			throw new AppException(ErrorCode.TOKEN_EXPIRED);
		}
	}

	private async verifyAccessToken(token: string): Promise<JwtPayload> {
		return await this.jwtService.verifyAsync<JwtPayload>(token, {
			secret: this.configService.get<string>('JWT_SECRET_KEY_ACCESS'),
		});
	}

	private async verifyRefreshToken(token: string): Promise<JwtPayload> {
		return await this.jwtService.verifyAsync<JwtPayload>(token, {
			secret: this.configService.get<string>('JWT_SECRET_KEY_REFRESH'),
		});
	}

	private async isTokenBlacklisted(token: string): Promise<boolean> {
		const found = await this.removeTokenRepository.findOne({
			where: { token },
		});
		return !!found;
	}

	async me(userId: string): Promise<Omit<GetUserResponseDto, 'roles'> | null> {
		const user = await this.userRepository.findOne({
			where: { userId },
		});
		if (!user) {
			return null;
		}
		const response: Omit<GetUserResponseDto, 'roles'> = {
			userId: user.userId,
			username: user.username,
			email: user.email,
		};
		return response;
	}

	async logout(data: LogoutAuthRequestDto): Promise<void> {
		try {
			const tokensToBlacklist: Array<{
				token: string;
				type: 'access' | 'refresh';
				expiryDate: Date;
			}> = [];

			try {
				const accessDecoded = (await this.jwtService.decode(data.accessToken)) as any;
				if (accessDecoded && accessDecoded.exp) {
					tokensToBlacklist.push({
						token: data.accessToken,
						type: 'access',
						expiryDate: new Date(accessDecoded.exp * 1000),
					});
				}
			} catch (err) {
				console.error('Error decoding access token:', err);
			}

			if (data.refreshToken) {
				try {
					const refreshDecoded = (await this.jwtService.decode(data.refreshToken)) as any;
					if (refreshDecoded && refreshDecoded.exp) {
						tokensToBlacklist.push({
							token: data.refreshToken,
							type: 'refresh',
							expiryDate: new Date(refreshDecoded.exp * 1000),
						});
					}
				} catch (err) {
					console.error('Error decoding refresh token:', err);
				}
			}

			for (const tokenData of tokensToBlacklist) {
				await this.removeTokenRepository.save({
					token: tokenData.token,
					tokenType: tokenData.type,
					expiryDate: tokenData.expiryDate,
					userId: data.userId,
				});
			}
		} catch (err) {
			console.error('Error during logout:', err);
			throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}
}
