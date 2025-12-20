import { HttpResponse } from '@shared/utils';
import { firstValueFrom } from 'rxjs';
import {
	Body,
	Controller,
	Get,
	Inject,
	Param,
	Patch,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { Request } from 'express';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import Role from 'src/common/guards/check-role/check-role.guard';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';

@Controller('profiles')
export class ProfileController {
	constructor(
		@Inject('PROFILE_SERVICE') private readonly profileClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	@UseGuards(AuthGuard)
	@Get('my-profile')
	getMyProfile(@Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.profileClient.send('profiles:get-profile', {
			userId,
			profileApiKey: this.configService.get('PROFILE_API_KEY'),
		});
	}

	@UseGuards(AuthGuard)
	@Patch('modify')
	modifyProfile(@Body() data: any, @Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return this.profileClient.send('profiles:modify-profile', {
			...data,
			userId,
			profileApiKey: this.configService.get('PROFILE_API_KEY'),
		});
	}

	@UseGuards(AuthGuard)
	@Get('/verify-state')
	async getVerifiedState(@Req() req: Request) {
		const userId = (req as any).user?.userId;
		if (!userId) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		const res = await firstValueFrom(
			this.profileClient.send('profiles:get-verified-state', {
				userId,
				profileApiKey: this.configService.get('PROFILE_API_KEY'),
			}),
		);

		return new HttpResponse(100, 'Get verified state successful', {
			verified: res,
		});
	}

	@UseGuards(AuthGuard, Role('ADMIN'))
	@Get(':userId')
	getProfile(@Param('userId') userId: string) {
		return this.profileClient.send('profiles:get-profile', {
			userId,
			profileApiKey: this.configService.get('PROFILE_API_KEY'),
		});
	}
}
