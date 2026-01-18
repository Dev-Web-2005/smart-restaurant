import { ApiResponse } from '@shared/types';
import {
	Body,
	Controller,
	Get,
	Inject,
	Post,
	Delete,
	Patch,
	HttpStatus,
	Res,
	UseGuards,
	Param,
	Req,
	Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import Role from 'src/common/guards/check-role/check-role.guard';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';

@Controller('identity')
export class IdentityController {
	constructor(
		@Inject('IDENTITY_SERVICE') private readonly identityClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	@Post('users/register')
	registerUser(@Body() data: any) {
		return this.identityClient.send('users:register', {
			...data,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Post('users/register/:ownerId')
	registerCustomerViaUsers(@Body() data: any, @Param('ownerId') ownerId: string) {
		return this.identityClient.send('users:register-customer', {
			...data,
			ownerId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}
	@UseGuards(AuthGuard, Role('USER'))
	@Post('users/generate-account')
	generateStaffChef(@Body() data: { role: 'STAFF' | 'CHEF' }, @Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:generate-staff-chef', {
			ownerId: userId,
			role: data.role,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@UseGuards(AuthGuard, Role('USER'))
	@Get('users/staff-chef')
	getStaffChefByOwner(
		@Req() req: Request,
		@Query('role') role?: 'STAFF' | 'CHEF',
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('isActive') isActive?: string,
	) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:get-staff-chef-by-owner', {
			ownerId: userId,
			role,
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			isActive: isActive !== undefined ? isActive === 'true' : undefined,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@UseGuards(AuthGuard, Role('USER'))
	@Patch('users/:targetUserId/status')
	toggleUserStatus(
		@Param('targetUserId') targetUserId: string,
		@Body() data: { isActive: boolean },
		@Req() req: Request,
	) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:toggle-status', {
			ownerId: userId,
			targetUserId,
			isActive: data.isActive,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@UseGuards(AuthGuard, Role('USER'))
	@Delete('users/:targetUserId')
	hardDeleteUser(@Param('targetUserId') targetUserId: string, @Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:hard-delete', {
			ownerId: userId,
			targetUserId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@UseGuards(AuthGuard)
	@Post('users/send-verification-email')
	sendVerificationEmail(@Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:send-verification-email', {
			userId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@UseGuards(AuthGuard)
	@Post('users/verify-email')
	verifyEmailCode(@Body() data: { code: string }, @Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:verify-email-code', {
			userId,
			code: data.code,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Check email verification status (Public API)
	 */
	@Post('users/check-verify-email-status')
	checkVerifyEmailStatus(@Body() data: { email: string }) {
		return this.identityClient.send('users:check-verify-email-status', {
			email: data.email,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Resend verification email (Public API)
	 */
	@Post('users/resend-verification-email')
	resendVerificationEmail(@Body() data: { email: string }) {
		return this.identityClient.send('users:resend-verification-email', {
			email: data.email,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Update email when register failed (Public API)
	 */
	@Post('users/update-email-when-register-failed')
	updateEmailWhenRegisterFailed(@Body() data: { username: string; newEmail: string }) {
		return this.identityClient.send('users:update-email-when-register-failed', {
			username: data.username,
			newEmail: data.newEmail,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Generate or regenerate restaurant QR code
	 */
	@UseGuards(AuthGuard, Role('USER'))
	@Post('users/restaurant-qr')
	generateRestaurantQr(@Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:generate-restaurant-qr', {
			userId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Get existing restaurant QR code without regenerating
	 */
	@UseGuards(AuthGuard, Role('USER'))
	@Get('users/restaurant-qr')
	getRestaurantQr(@Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:get-restaurant-qr', {
			userId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Validate restaurant QR token (public endpoint)
	 * @param ownerId - Restaurant owner's userId
	 * @param token - The QR token to validate
	 */
	@Post('users/restaurant-qr/validate/:ownerId/:token')
	validateRestaurantQr(@Param('ownerId') ownerId: string, @Param('token') token: string) {
		return this.identityClient.send('users:validate-restaurant-qr', {
			ownerId,
			token,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@UseGuards(AuthGuard)
	@Get('users/my-user')
	getMyUser(@Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('users:get-user-by-id', {
			userId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@UseGuards(AuthGuard, Role('ADMIN'))
	@Get('users/get-all-users')
	getAllUsers() {
		return this.identityClient.send('users:get-all-users', {
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Get users by role with pagination and status filter (ADMIN only)
	 * @param role - The role to filter (e.g., 'USER')
	 * @param status - Filter by status: 'all', 'active', 'inactive'
	 * @param page - Page number (1-indexed, default: 1)
	 * @param limit - Items per page (default: 10)
	 */
	@UseGuards(AuthGuard, Role('ADMIN'))
	@Get('users/by-role/:role')
	getUsersByRole(
		@Param('role') role: string,
		@Query('status') status?: 'all' | 'active' | 'inactive',
		@Query('page') page?: string,
		@Query('limit') limit?: string,
	) {
		return this.identityClient.send('users:get-users-by-role', {
			role,
			status: status || 'all',
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 10,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Soft delete (deactivate) a user (ADMIN only)
	 * @param targetUserId - The userId to deactivate
	 */
	@UseGuards(AuthGuard, Role('ADMIN'))
	@Patch('users/:targetUserId/deactivate')
	softDeleteUser(@Param('targetUserId') targetUserId: string) {
		return this.identityClient.send('users:soft-delete', {
			targetUserId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	/**
	 * Restore (reactivate) a user (ADMIN only)
	 * @param targetUserId - The userId to restore
	 */
	@UseGuards(AuthGuard, Role('ADMIN'))
	@Patch('users/:targetUserId/restore')
	restoreUser(@Param('targetUserId') targetUserId: string) {
		return this.identityClient.send('users:restore', {
			targetUserId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Get('users/get-user-by-id/:userId')
	@UseGuards(AuthGuard, Role('ADMIN'))
	getUserById(@Param('userId') userId: string) {
		return this.identityClient.send('users:get-user-by-id', {
			userId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Post('roles/create-role')
	@UseGuards(AuthGuard, Role('ADMIN'))
	createRole(@Body() data: any) {
		return this.identityClient.send('roles:create-role', {
			...data,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Get('roles/get-all-roles')
	@UseGuards(AuthGuard, Role('ADMIN'))
	getAllRoles() {
		return this.identityClient.send('roles:get-all-roles', {
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Post('authorities/create-authority')
	@UseGuards(AuthGuard, Role('ADMIN'))
	createAuthority(@Body() data: any) {
		return this.identityClient.send('authorities:create-authority', {
			...data,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Get('authorities/get-all-authorities')
	@UseGuards(AuthGuard, Role('ADMIN'))
	getAllAuthorities() {
		return this.identityClient.send('authorities:get-all-authorities', {
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Post('auth/login')
	async login(@Body() data: any, @Res() res: Response) {
		const observableResponse = this.identityClient.send('auth:login', {
			...data,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
		const response = await firstValueFrom(observableResponse);

		// Check if response is valid and successful
		if (!response || !response.code || response.code !== HttpStatus.OK) {
			const statusCode =
				typeof response?.code === 'number' ? response.code : HttpStatus.UNAUTHORIZED;
			return res.status(statusCode).json(response);
		}

		const convertData: {
			code: number;
			message: string;
			data: {
				userId: string;
				username: string;
				email: string;
				roles: string[];
				accessToken: string;
				refreshToken: string;
				ownerId?: string;
			};
		} = response;

		const refreshTokenExpiry = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN');

		res.cookie('refreshToken', convertData.data.refreshToken, {
			httpOnly: true,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site', // thêm domain cho production
			}),
		});

		const type = convertData.data.roles.includes('ADMIN') ? 'admin' : 'user';
		res.cookie('type', type, {
			httpOnly: false,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site',
			}),
		});

		return res.status(HttpStatus.OK).json(
			new ApiResponse<any>({
				code: 1000,
				message: response.message,
				data: {
					userId: convertData.data.userId,
					username: convertData.data.username,
					email: convertData.data.email,
					roles: convertData.data.roles,
					accessToken: convertData.data.accessToken,
					ownerId: convertData.data.ownerId,
				},
			}),
		);
	}

	/**
	 * Login for CUSTOMER/STAFF/CHEF under a specific restaurant
	 * @param ownerId - The userId of the restaurant owner
	 */
	@Post('auth/login/:ownerId')
	async loginWithOwner(
		@Body() data: any,
		@Param('ownerId') ownerId: string,
		@Res() res: Response,
	) {
		const observableResponse = this.identityClient.send('auth:login-with-owner', {
			...data,
			ownerId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
		const response = await firstValueFrom(observableResponse);

		if (!response || !response.code || response.code !== HttpStatus.OK) {
			const statusCode =
				typeof response?.code === 'number' ? response.code : HttpStatus.UNAUTHORIZED;
			return res.status(statusCode).json(response);
		}

		const convertData: {
			code: number;
			message: string;
			data: {
				userId: string;
				username: string;
				email: string;
				roles: string[];
				accessToken: string;
				refreshToken: string;
				ownerId?: string;
			};
		} = response;

		const refreshTokenExpiry = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN');

		res.cookie('refreshToken', convertData.data.refreshToken, {
			httpOnly: true,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site',
			}),
		});

		// Determine user type based on roles
		let type = 'customer';
		if (convertData.data.roles.includes('STAFF')) {
			type = 'staff';
		} else if (convertData.data.roles.includes('CHEF')) {
			type = 'chef';
		}

		res.cookie('type', type, {
			httpOnly: false,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site',
			}),
		});

		return res.status(HttpStatus.OK).json(
			new ApiResponse<any>({
				code: 1000,
				message: response.message,
				data: {
					userId: convertData.data.userId,
					username: convertData.data.username,
					email: convertData.data.email,
					roles: convertData.data.roles,
					accessToken: convertData.data.accessToken,
					ownerId: convertData.data.ownerId,
				},
			}),
		);
	}

	@Get('auth/refresh')
	async refreshToken(@Req() req: Request, @Res() res: Response) {
		const refreshToken = req.cookies['refreshToken'];

		if (!refreshToken) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		const observableResponse = this.identityClient.send('auth:refresh-token', {
			refreshToken,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
		const response = await firstValueFrom(observableResponse);

		// Check if response is valid and successful
		if (!response || !response.code || response.code !== HttpStatus.OK) {
			const statusCode =
				typeof response?.code === 'number' ? response.code : HttpStatus.UNAUTHORIZED;
			return res.status(statusCode).json({
				code: statusCode,
				message: response?.message || 'Token refresh failed',
				timestamp: new Date().toISOString(),
				path: '/api/v1/identity/auth/refresh',
			});
		}

		const convertData: {
			code: number;
			message: string;
			data: {
				userId: string;
				username: string;
				email: string;
				roles: string[];
				accessToken: string;
			};
		} = response;

		return res.status(HttpStatus.OK).json(
			new ApiResponse<any>({
				code: 1000,
				message: response.message,
				data: {
					userId: convertData.data.userId,
					username: convertData.data.username,
					email: convertData.data.email,
					roles: convertData.data.roles,
					accessToken: convertData.data.accessToken,
				},
			}),
		);
	}

	@UseGuards(AuthGuard)
	@Get('auth/me')
	me(@Req() req: Request) {
		const user: any = req.user;
		if (!user) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('auth:me', {
			userId: user.userId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@UseGuards(AuthGuard)
	@Get('auth/logout')
	async logout(@Res() res: Response, @Req() req: Request) {
		const user: any = req.user;
		const accessToken = req.headers.authorization?.replace('Bearer ', '');
		const refreshToken = req.cookies['refreshToken'];

		if (!user || !accessToken) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		await firstValueFrom(
			this.identityClient.send('auth:logout', {
				accessToken,
				refreshToken,
				userId: user.userId,
				identityApiKey: this.configService.get('IDENTITY_API_KEY'),
			}),
		);

		res.clearCookie('refreshToken', {
			httpOnly: true,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site', // thêm domain cho production
			}),
		});

		res.clearCookie('type', {
			httpOnly: false,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site',
			}),
		});

		return res.status(HttpStatus.OK).json(
			new ApiResponse<any>({
				code: 1000,
				message: 'Logout successful',
			}),
		);
	}

	@Post('auth/forgot-password')
	async forgotPassword(@Body() data: { email: string }, @Res() res: Response) {
		try {
			const observableResponse = this.identityClient.send('auth:forgot-password', {
				...data,
				identityApiKey: this.configService.get('IDENTITY_API_KEY'),
			});
			const response = await firstValueFrom(observableResponse);

			const statusCode =
				response && typeof response.code === 'number' ? response.code : HttpStatus.OK;

			return res.status(statusCode).json(
				new ApiResponse<any>({
					code: response?.code || 1000,
					message: response?.message || 'Password reset email sent successfully',
				}),
			);
		} catch (error) {
			console.error('Error in forgot password:', error);
			return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
				new ApiResponse<any>({
					code: 9999,
					message: 'Failed to process forgot password request',
				}),
			);
		}
	}

	@Post('auth/reset-password')
	async resetPassword(
		@Body() data: { resetToken: string; password: string; confirmPassword: string },
		@Res() res: Response,
	) {
		try {
			const observableResponse = this.identityClient.send('auth:reset-password', {
				...data,
				identityApiKey: this.configService.get('IDENTITY_API_KEY'),
			});
			const response = await firstValueFrom(observableResponse);

			const statusCode =
				response && typeof response.code === 'number' ? response.code : HttpStatus.OK;

			return res.status(statusCode).json(
				new ApiResponse<any>({
					code: response?.code || 1000,
					message: response?.message || 'Password reset successfully',
				}),
			);
		} catch (error) {
			console.error('Error in reset password:', error);
			return res.status(HttpStatus.BAD_REQUEST).json(
				new ApiResponse<any>({
					code: 9999,
					message: 'Failed to reset password. Token may be invalid or expired.',
				}),
			);
		}
	}

	@Post('auth/register-customer')
	registerCustomer(@Body() data: { username: string; password: string; email: string }) {
		return this.identityClient.send('auth:register-customer', {
			...data,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Post('auth/register-customer/:ownerId')
	registerCustomerWithOwner(
		@Body() data: { username: string; password: string; email: string },
		@Param('ownerId') ownerId: string,
	) {
		return this.identityClient.send('auth:register-customer', {
			...data,
			ownerId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}

	@Post('auth/google-authenticate')
	async googleAuth(@Body() data: { code: string }, @Res() res: Response) {
		const observableResponse = this.identityClient.send('auth:google-auth', {
			...data,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
		const response = await firstValueFrom(observableResponse);

		if (!response || !response.code || response.code !== 1000) {
			const statusCode =
				typeof response?.code === 'number'
					? HttpStatus.BAD_REQUEST
					: HttpStatus.UNAUTHORIZED;
			return res.status(statusCode).json(response);
		}

		const convertData: {
			code: number;
			message: string;
			data: {
				userId: string;
				username: string;
				email: string;
				roles: string[];
				accessToken: string;
				refreshToken: string;
				ownerId?: string;
				isGoogleLogin: boolean;
			};
		} = response;

		const refreshTokenExpiry = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN');

		res.cookie('refreshToken', convertData.data.refreshToken, {
			httpOnly: true,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site',
			}),
		});

		res.cookie('type', 'customer', {
			httpOnly: false,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site',
			}),
		});

		return res.status(HttpStatus.OK).json(
			new ApiResponse<any>({
				code: 1000,
				message: response.message,
				data: {
					userId: convertData.data.userId,
					username: convertData.data.username,
					email: convertData.data.email,
					roles: convertData.data.roles,
					accessToken: convertData.data.accessToken,
					ownerId: convertData.data.ownerId,
					isGoogleLogin: convertData.data.isGoogleLogin,
				},
			}),
		);
	}

	@Post('auth/google-authenticate/:ownerId')
	async googleAuthWithOwner(
		@Body() data: { code: string },
		@Param('ownerId') ownerId: string,
		@Res() res: Response,
	) {
		const observableResponse = this.identityClient.send('auth:google-auth', {
			...data,
			ownerId,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
		const response = await firstValueFrom(observableResponse);

		if (!response || !response.code || response.code !== 1000) {
			const statusCode =
				typeof response?.code === 'number'
					? HttpStatus.BAD_REQUEST
					: HttpStatus.UNAUTHORIZED;
			return res.status(statusCode).json(response);
		}

		const convertData: {
			code: number;
			message: string;
			data: {
				userId: string;
				username: string;
				email: string;
				roles: string[];
				accessToken: string;
				refreshToken: string;
				ownerId?: string;
				isGoogleLogin: boolean;
			};
		} = response;

		const refreshTokenExpiry = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN');

		res.cookie('refreshToken', convertData.data.refreshToken, {
			httpOnly: true,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site',
			}),
		});

		res.cookie('type', 'customer', {
			httpOnly: false,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			...(process.env.MOD === 'production' && {
				domain: process.env.COOKIE_DOMAIN || '.lethanhcong.site',
			}),
		});

		return res.status(HttpStatus.OK).json(
			new ApiResponse<any>({
				code: 1000,
				message: response.message,
				data: {
					userId: convertData.data.userId,
					username: convertData.data.username,
					email: convertData.data.email,
					roles: convertData.data.roles,
					accessToken: convertData.data.accessToken,
					ownerId: convertData.data.ownerId,
					isGoogleLogin: convertData.data.isGoogleLogin,
				},
			}),
		);
	}

	@UseGuards(AuthGuard)
	@Post('auth/set-password')
	setPassword(@Body() data: { password: string }, @Req() req: Request) {
		const userId = (req as any).user?.userId;
		console.log('🔐 Set password - User from token:', (req as any).user);
		console.log('🔐 Set password - userId:', userId);

		if (!userId) {
			console.error('❌ No userId in request.user');
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('auth:set-password', {
			userId,
			password: data.password,
			identityApiKey: this.configService.get('IDENTITY_API_KEY'),
		});
	}
}
