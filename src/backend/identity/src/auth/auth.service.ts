import { User } from 'src/common/entities/user';
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import LoginAuthRequestDto from 'src/auth/dtos/request/login-auth-request.dto';
import LoginAuthResponseDto from 'src/auth/dtos/response/login-auth-response.dto';
import AppException from '@shared/exceptions/app-exception';
import { ErrorCode } from '@shared/exceptions';
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
import { ForgotPasswordRequestDto } from 'src/auth/dtos/request/forgot-password-request.dto';
import { ResetPasswordRequestDto } from 'src/auth/dtos/request/reset-password-request.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
		@InjectRepository(RemoveToken)
		private readonly removeTokenRepository: Repository<RemoveToken>,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		@Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
	) {}
	private readonly ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '5m'; // 15 phút
	private readonly REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d'; // 7 ngày
	private readonly RESET_PASSWORD_TOKEN_EXPIRY = '5m'; // 5 phút cho reset password

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
			ownerId: user.ownerId,
		});

		const refreshToken = this.generateRefreshToken({
			userId: user.userId,
			username: user.username,
			email: user.email,
			roles,
			ownerId: user.ownerId,
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

	/**
	 * Login for CUSTOMER/STAFF/CHEF under a specific restaurant
	 * Username is stored as: username_ownerId
	 */
	async loginWithOwner(
		data: LoginAuthRequestDto,
		ownerId: string,
	): Promise<LoginAuthResponseDto> {
		// Construct the unique username
		const uniqueUsername = `${data.username}_${ownerId}`;

		const user = await this.userRepository.findOne({
			where: { username: uniqueUsername, ownerId: ownerId },
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
			username: data.username, // Return original username
			email: user.email,
			roles,
			ownerId: user.ownerId,
		});

		const refreshToken = this.generateRefreshToken({
			userId: user.userId,
			username: data.username,
			email: user.email,
			roles,
			ownerId: user.ownerId,
		});

		const response = new LoginAuthResponseDto();
		response.userId = user.userId;
		response.username = data.username; // Return original username to user
		response.email = user.email;
		response.roles = roles;
		response.accessToken = accessToken;
		response.refreshToken = refreshToken;
		response.ownerId = user.ownerId;

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

	async forgotPassword(data: ForgotPasswordRequestDto): Promise<void> {
		const user = await this.userRepository.findOne({
			where: { email: data.email },
		});

		if (!user) {
			console.log(`Forgot password requested for non-existent email: ${data.email}`);
			return;
		}

		const resetToken = this.jwtService.sign(
			{
				userId: user.userId,
				email: user.email,
				purpose: 'password-reset',
			},
			{
				secret: this.configService.get<string>('JWT_SECRET_KEY_RESET_PASSWORD'),
				expiresIn: this.RESET_PASSWORD_TOKEN_EXPIRY,
			},
		);

		const frontendUrl =
			this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
		const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

		const variables = new Map<string, string>();
		variables.set('username', user.username);
		variables.set('resetUrl', resetUrl);
		variables.set('expiryMinutes', '5');

		const variablesObject: Record<string, string> = {};
		variables.forEach((value, key) => {
			variablesObject[key] = value;
		});

		const notificationApiKey = this.configService.get<string>('NOTIFICATION_API_KEY');
		const notificationRequest = {
			to: {
				email: user.email,
				name: user.username,
			},
			subject: 'Reset Your Password',
			variables: variablesObject,
			notificationApiKey: notificationApiKey,
		};

		try {
			this.notificationClient.emit('mail.send', notificationRequest);
			console.log(`Password reset email sent to: ${user.email}`);
		} catch (emitError) {
			console.error('Error emitting password reset notification:', emitError);
			throw new AppException(ErrorCode.NOTIFICATION_SERVICE_ERROR);
		}
	}

	async resetPassword(data: ResetPasswordRequestDto): Promise<void> {
		try {
			const decoded = await this.jwtService.verifyAsync(data.resetToken, {
				secret: this.configService.get<string>('JWT_SECRET_KEY_RESET_PASSWORD'),
			});

			if (decoded.purpose !== 'password-reset') {
				throw new AppException(ErrorCode.INVALID_TOKEN);
			}
			const user = await this.userRepository.findOne({
				where: { userId: decoded.userId },
			});

			if (!user) {
				throw new AppException(ErrorCode.USER_NOT_FOUND);
			}

			const hashedPassword = await bcrypt.hash(data.password, 10);
			user.password = hashedPassword;
			await this.userRepository.save(user);

			console.log(`Password reset successfully for user: ${user.userId}`);
		} catch (error) {
			if (error.name === 'TokenExpiredError') {
				throw new AppException(ErrorCode.TOKEN_EXPIRED);
			}
			if (error.name === 'JsonWebTokenError') {
				throw new AppException(ErrorCode.INVALID_TOKEN);
			}
			throw error;
		}
	}
}
