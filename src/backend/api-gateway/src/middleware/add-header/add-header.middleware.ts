import { JwtService } from '@nestjs/jwt';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'src/configuration/jwt-strategy.config';
import { ConfigService } from '@nestjs/config';
import { checkValidTime, generateToken } from 'src/utils/helper-function';
@Injectable()
export class AddHeaderMiddleware implements NestMiddleware {
	PUBLIC_URLS: string[] = [
		'/api/v1/identity/auth/login',
		'/api/v1/health',
		'/api/v1/identity/users/register',
	];
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}
	use(req: Request, res: Response, next: NextFunction) {
		const url = req.originalUrl || req.url;

		if (this.PUBLIC_URLS.includes(url)) {
			console.log('Public URL accessed, skipping JWT addition');
			return next();
		}

		const jwt = req.cookies['jwt'];
		if (jwt) {
			req.headers['authorization'] = `Bearer ${jwt}`;
			const payload: JwtPayload = this.jwtService.decode(jwt);

			const expiresIn = payload.claims.expires;
			const expiresRefresh = payload.claims.expiresRefresh;

			if (!checkValidTime(expiresIn)) {
				if (!checkValidTime(expiresRefresh)) {
					return res.status(401).json({
						code: 401,
						message: 'Unauthorized: Both JWT and Refresh Token have expired',
						timestamp: new Date().toISOString(),
					});
				}

				const newToken = generateToken(
					{
						userId: payload.userId,
						username: payload.username,
						email: payload.email,
						roles: payload.claims.roles,
					},
					this.jwtService,
				);

				const expiresRefreshInMs = parseInt(process.env.JWT_EXPIRES_REFRESH_IN) * 1000;

				const type = (payload.claims.roles as string).includes('ADMIN')
					? 'admin'
					: 'user';

				res.cookie('jwt', newToken, {
					httpOnly: true,
					secure: this.configService.get<string>('MOD') === 'production',
					sameSite:
						this.configService.get<string>('MOD') === 'production' ? 'none' : 'lax',
					path: '/',
					expires: new Date(Date.now() + expiresRefreshInMs),
					maxAge: expiresRefreshInMs,
				});

				res.cookie('type', type, {
					httpOnly: false,
					maxAge: expiresRefreshInMs,
					sameSite: process.env.MOD === 'production' ? 'none' : 'lax',
					secure: process.env.MOD === 'production' ? true : false,
					path: '/',
					expires: new Date(Date.now() + expiresRefreshInMs),
				});

				req.headers['authorization'] = `Bearer ${newToken}`;
			}
			console.log('JWT added to Authorization header');
		} else {
			res.status(401).json({
				code: 401,
				message: 'Unauthorized: No JWT cookie found',
				timestamp: new Date().toISOString(),
			});
			console.log('No JWT cookie found');
		}
		next();
	}
}
