import { ApiResponse } from '@shared/types';
import {
	Body,
	Controller,
	Get,
	Inject,
	Post,
	HttpStatus,
	Res,
	UseGuards,
	Param,
	Req,
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

		if (!response || !response.code || response.code !== HttpStatus.OK) {
			return res.status(response?.code || HttpStatus.UNAUTHORIZED).json(response);
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
			};
		} = response;

		const refreshTokenExpiry = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN');

		res.cookie('refreshToken', convertData.data.refreshToken, {
			httpOnly: true,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
		});

		const type = convertData.data.roles.includes('ADMIN') ? 'admin' : 'user';
		res.cookie('type', type, {
			httpOnly: false,
			maxAge: refreshTokenExpiry,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
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

		if (!response || !response.code || response.code !== 1000) {
			return res.status(response?.code || HttpStatus.UNAUTHORIZED).json(response);
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
		});

		res.clearCookie('type', {
			httpOnly: false,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
		});

		return res.status(HttpStatus.OK).json(
			new ApiResponse<any>({
				code: 1000,
				message: 'Logout successful',
			}),
		);
	}
}
