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
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { JwtPayload } from 'src/configuration/jwt-strategy.config';
import AppException from 'src/exception/app-exception';
import ErrorCode from 'src/exception/error-code';
import Role from 'src/guard/check-role/check-role.guard';

@Controller('identity')
export class IdentityController {
	constructor(
		@Inject('IDENTITY_SERVICE') private readonly identityClient: ClientProxy,
		private jwtService: JwtService,
	) {}

	@Post('users/register')
	registerUser(@Body() data: any) {
		return this.identityClient.send('users:register', data);
	}
	@UseGuards(AuthGuard('jwt'), Role('ADMIN'))
	@Get('users/get-all-users')
	getAllUsers() {
		return this.identityClient.send('users:get-all-users', {});
	}

	@Get('users/get-user-by-id/:userId')
	@UseGuards(AuthGuard('jwt'), Role('ADMIN'))
	getUserById(@Param('userId') userId: string) {
		return this.identityClient.send('users:get-user-by-id', userId);
	}

	@Post('roles/create-role')
	@UseGuards(AuthGuard('jwt'), Role('ADMIN'))
	createRole(@Body() data: any) {
		return this.identityClient.send('roles:create-role', data);
	}

	@Get('roles/get-all-roles')
	@UseGuards(AuthGuard('jwt'), Role('ADMIN'))
	getAllRoles() {
		return this.identityClient.send('roles:get-all-roles', {});
	}

	@Post('authorities/create-authority')
	@UseGuards(AuthGuard('jwt'), Role('ADMIN'))
	createAuthority(@Body() data: any) {
		return this.identityClient.send('authorities:create-authority', data);
	}

	@Get('authorities/get-all-authorities')
	@UseGuards(AuthGuard('jwt'), Role('ADMIN'))
	getAllAuthorities() {
		return this.identityClient.send('authorities:get-all-authorities', {});
	}

	@Post('auth/login')
	async login(@Body() data: any, @Res() res: Response) {
		const observableResponse = this.identityClient.send('auth:login', data);
		const response = await firstValueFrom(observableResponse);

		if (!response || !response.code || response.code !== HttpStatus.OK) {
			return observableResponse;
		}

		const convertData: {
			code: number;
			message: string;
			data: {
				userId: string;
				username: string;
				email: string;
				roles: string[];
			};
		} = response;

		const expiresInMs = parseInt(process.env.JWT_EXPIRES_IN) * 1000;
		const expiresRefreshInMs = parseInt(process.env.JWT_EXPIRES_REFRESH_IN) * 1000;

		const payload: JwtPayload = {
			userId: convertData.data.userId,
			username: convertData.data.username,
			email: convertData.data.email,
			claims: {
				roles: convertData.data.roles.join(' '),
				expires: new Date(Date.now() + expiresInMs).toUTCString(),

				expiresRefresh: new Date(Date.now() + expiresRefreshInMs).toUTCString(),
			},
		};
		const token = this.jwtService.sign(payload);

		res.cookie('jwt', token, {
			httpOnly: true,
			maxAge: expiresRefreshInMs,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			expires: new Date(Date.now() + expiresRefreshInMs),
		});

		const type = convertData.data.roles.includes('ADMIN') ? 'admin' : 'user';

		res.cookie('type', type, {
			httpOnly: false,
			maxAge: expiresRefreshInMs,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			expires: new Date(Date.now() + expiresRefreshInMs),
		});

		return res.status(HttpStatus.OK).json({
			code: response.code,
			message: response.message,
			data: {
				userId: convertData.data.userId,
				username: convertData.data.username,
				email: convertData.data.email,
				accessToken: token,
				expiresIn: new Date(Date.now() + expiresInMs),
			},
		});
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('auth/me')
	me(@Req() req: Request) {
		const user: any = req.user;
		if (!user) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.identityClient.send('auth:me', user.userId);
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('auth/logout')
	async logout(@Res() res: Response, @Req() req: Request) {
		res.clearCookie('jwt', {
			httpOnly: true,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			expires: new Date(0),
		});

		res.clearCookie('type', {
			httpOnly: false,
			sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
			secure: process.env.MOD === 'production' ? true : false,
			path: '/',
			expires: new Date(0),
		});

		const user: any = req.user;
		if (!user) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		// Await để đảm bảo token được lưu vào DB
		await firstValueFrom(
			this.identityClient.send('auth:logout', {
				token: req.cookies['jwt'],
				expiresAt: new Date(user.claims.expiresRefresh),
			}),
		);

		return res.status(HttpStatus.OK).json({
			code: HttpStatus.OK,
			message: 'Logout successful',
		});
	}
}
