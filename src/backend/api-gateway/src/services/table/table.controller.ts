import { ConfigService } from '@nestjs/config';
import {
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Patch,
	Post,
	Query,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';
import type { Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Controller()
export class TableController {
	constructor(
		@Inject('TABLE_SERVICE') private readonly tableClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	@UseGuards(AuthGuard)
	@Post('/tenants/:tenantId/tables')
	createTable(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.tableClient.send('tables:create', {
			...data,
			tenantId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	@UseGuards(AuthGuard)
	@Get('/tenants/:tenantId/tables')
	listTables(
		@Param('tenantId') tenantId: string,
		@Query('isActive') isActive?: string,
		@Query('status') status?: string,
		@Query('floorId') floorId?: string,
		@Query('includeFloor') includeFloor?: string,
	) {
		const payload: any = {
			tenantId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		};
		if (isActive !== undefined) {
			payload.isActive = isActive === 'true';
		}
		if (status) {
			payload.status = status;
		}
		if (floorId) {
			payload.floorId = floorId;
		}
		if (includeFloor !== undefined) {
			payload.includeFloor = includeFloor === 'true';
		}
		return this.tableClient.send('tables:list', payload);
	}

	@UseGuards(AuthGuard)
	@Get('/tenants/:tenantId/tables/:tableId')
	getTableById(@Param('tenantId') tenantId: string, @Param('tableId') tableId: string) {
		return this.tableClient.send('tables:get-by-id', {
			tenantId,
			tableId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	@UseGuards(AuthGuard)
	@Patch('/tenants/:tenantId/tables/:tableId')
	updateTable(
		@Param('tenantId') tenantId: string,
		@Param('tableId') tableId: string,
		@Body() data: any,
	) {
		return this.tableClient.send('tables:update', {
			tenantId,
			tableId,
			data: {
				...data,
				tableApiKey: this.configService.get('TABLE_API_KEY'),
			},
		});
	}

	@UseGuards(AuthGuard)
	@Delete('/tenants/:tenantId/tables/:tableId')
	deleteTable(@Param('tenantId') tenantId: string, @Param('tableId') tableId: string) {
		return this.tableClient.send('tables:delete', {
			tableId,
			tenantId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	// QR Code Endpoints
	// @UseGuards(AuthGuard)
	// @Post('tables/:tableId/qrcode')
	// generateQrCode(@Param('tableId') tableId: string, @Req() req: Request) {
	// 	const userId = (req as any).user?.userId;
	// 	return this.tableClient.send('qr:generate', {
	// 		tableId,
	// 		tenantId: userId,
	// 		tableApiKey: this.configService.get('TABLE_API_KEY'),
	// 	});
	// }

	// @Get('tables/scan/:token')
	// async validateScan(@Param('token') token: string, @Res() res: Response) {
	// 	try {
	// 		const result: any = await firstValueFrom(
	// 			this.tableClient.send('qr:validate-scan', {
	// 				token,
	// 				tableApiKey: this.configService.get('TABLE_API_KEY'),
	// 			}),
	// 		);

	// 		// Server-side redirect đến trang menu

	// 		// Test response in development mode
	// 		if (this.configService.get('MOD') === 'development') {
	// 			console.log('QR Scan Validated:', result);
	// 			return res.status(200).json({ redirect: result.redirect });
	// 		}

	// 		// Production mode - perform redirect
	// 		const frontendUrl =
	// 			this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
	// 		const redirectUrl = frontendUrl + result.redirect;

	// 		return res.redirect(302, redirectUrl);
	// 	} catch (error) {
	// 		// Nếu QR invalid, redirect đến error page
	// 		const frontendUrl =
	// 			this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
	// 		return res.redirect(
	// 			302,
	// 			`${frontendUrl}/qr-error?message=${encodeURIComponent(error.message || 'Invalid QR Code')}`,
	// 		);
	// 	}
	// }

	@UseGuards(AuthGuard)
	@Post('/tenants/:tenantId/tables/:tableId/qrcode')
	generateQrCode(@Param('tenantId') tenantId: string, @Param('tableId') tableId: string) {
		return this.tableClient.send('qr:generate', {
			tenantId,
			tableId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	@Get('/tenants/:tenantId/tables/scan/:token')
	async validateScan(
		@Param('tenantId') tenantId: string,
		@Param('token') token: string,
		@Res() res: Response,
	) {
		try {
			const result: any = await firstValueFrom(
				this.tableClient.send('qr:validate-scan', {
					tenantId,
					token,
					tableApiKey: this.configService.get('TABLE_API_KEY'),
				}),
			);

			// Server-side redirect đến trang menu

			// Test response in development mode
			if (this.configService.get('MOD') === 'development') {
				console.log('QR Scan Validated:', result);
				return res.status(200).json({ redirect: result.redirect });
			}

			// Production mode - perform redirect
			const frontendUrl =
				this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
			const redirectUrl = frontendUrl + result.redirect;

			return res.redirect(302, redirectUrl);
		} catch (error) {
			// Nếu QR invalid, redirect đến error page
			const frontendUrl =
				this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
			return res.redirect(
				302,
				`${frontendUrl}/qr-error?message=${encodeURIComponent(error.message || 'Invalid QR Code')}`,
			);
		}
	}
}
