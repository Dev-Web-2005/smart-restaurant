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
	Res,
	UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';
import type { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import Role from 'src/common/guards/check-role/check-role.guard';

@Controller()
export class TableController {
	constructor(
		@Inject('TABLE_SERVICE') private readonly tableClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	@UseGuards(AuthGuard, Role('USER'))
	@Post('/tenants/:tenantId/tables')
	createTable(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.tableClient.send('tables:create', {
			...data,
			tenantId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	@UseGuards(AuthGuard, Role('USER'))
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

	@UseGuards(AuthGuard, Role('USER'))
	@Get('/tenants/:tenantId/tables/:tableId')
	getTableById(@Param('tenantId') tenantId: string, @Param('tableId') tableId: string) {
		return this.tableClient.send('tables:get-by-id', {
			tenantId,
			tableId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	@UseGuards(AuthGuard, Role('USER'))
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

	@UseGuards(AuthGuard, Role('USER'))
	@Delete('/tenants/:tenantId/tables/:tableId')
	deleteTable(@Param('tenantId') tenantId: string, @Param('tableId') tableId: string) {
		return this.tableClient.send('tables:delete', {
			tableId,
			tenantId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	// QR Code Management Endpoints

	/**
	 * Generate new QR code (invalidates old ones)
	 * POST /tenants/:tenantId/tables/:tableId/qrcode
	 */
	@UseGuards(AuthGuard, Role('USER'))
	@Post('/tenants/:tenantId/tables/:tableId/qrcode')
	generateQrCode(@Param('tenantId') tenantId: string, @Param('tableId') tableId: string) {
		return this.tableClient.send('qr:generate', {
			tenantId,
			tableId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	/**
	 * Get existing QR code without regenerating
	 * GET /tenants/:tenantId/tables/:tableId/qrcode
	 */
	@UseGuards(AuthGuard, Role('USER'))
	@Get('/tenants/:tenantId/tables/:tableId/qrcode')
	getQrCode(@Param('tenantId') tenantId: string, @Param('tableId') tableId: string) {
		return this.tableClient.send('qr:get', {
			tenantId,
			tableId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	/**
	 * Download QR code in specific format (PNG, PDF, SVG)
	 * GET /tenants/:tenantId/tables/:tableId/qrcode/download?format=png|pdf|svg
	 */
	@UseGuards(AuthGuard, Role('USER'))
	@Get('/tenants/:tenantId/tables/:tableId/qrcode/download')
	async downloadQrCode(
		@Param('tenantId') tenantId: string,
		@Param('tableId') tableId: string,
		@Query('format') format: string = 'png',
		@Res() res: Response,
	) {
		// Validate format
		const validFormats = ['png', 'pdf', 'svg'];
		if (!validFormats.includes(format.toLowerCase())) {
			return res.status(400).json({
				statusCode: 400,
				message: 'Invalid format. Supported formats: png, pdf, svg',
			});
		}

		const result: any = await firstValueFrom(
			this.tableClient.send('qr:download', {
				tenantId,
				tableId,
				format: format.toLowerCase(),
				tableApiKey: this.configService.get('TABLE_API_KEY'),
			}),
		);

		// Convert base64 to buffer
		const buffer = Buffer.from(result.data, 'base64');

		// Set appropriate headers for file download
		res.setHeader('Content-Type', result.mimeType);
		res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
		res.setHeader('Content-Length', buffer.length);

		return res.send(buffer);
	}

	/**
	 * Batch download QR codes for multiple tables
	 * GET /tenants/:tenantId/tables/qrcode/batch-download?format=zip-png|zip-pdf|zip-svg|combined-pdf
	 */
	@UseGuards(AuthGuard, Role('USER'))
	@Get('/tenants/:tenantId/tables/qrcode/batch-download')
	async batchDownloadQrCode(
		@Res() res: Response,
		@Param('tenantId') tenantId: string,
		@Query('format') format: string = 'combined-pdf',
		@Query('tableIds') tableIds?: string,
		@Query('floorId') floorId?: string,
	) {
		// Validate format
		const validFormats = ['zip-png', 'zip-pdf', 'zip-svg', 'combined-pdf'];
		if (!validFormats.includes(format.toLowerCase())) {
			return res.status(400).json({
				statusCode: 400,
				message:
					'Invalid format. Supported formats: zip-png, zip-pdf, zip-svg, combined-pdf',
			});
		}

		// Parse tableIds if provided
		let tableIdArray: string[] | undefined;
		if (tableIds) {
			tableIdArray = tableIds.split(',').filter((id) => id.trim());
		}

		const result: any = await firstValueFrom(
			this.tableClient.send('qr:batch-download', {
				tenantId,
				format: format.toLowerCase(),
				tableIds: tableIdArray,
				floorId,
				tableApiKey: this.configService.get('TABLE_API_KEY'),
			}),
		);

		// Convert base64 to buffer
		const buffer = Buffer.from(result.data, 'base64');

		// Set appropriate headers for file download
		res.setHeader('Content-Type', result.mimeType);
		res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
		res.setHeader('Content-Length', buffer.length);

		return res.send(buffer);
	}

	/**
	 * Validate QR code scan (public endpoint)
	 * GET /tenants/:tenantId/tables/scan/:token
	 */
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

	/**
	 * Bulk regenerate QR codes for multiple tables
	 * POST /tenants/:tenantId/tables/qrcode/bulk-regenerate
	 */
	@UseGuards(AuthGuard, Role('USER'))
	@Post('/tenants/:tenantId/tables/qrcode/bulk-regenerate')
	bulkRegenerateQrCode(
		@Param('tenantId') tenantId: string,
		@Body() body: { tableIds?: string[]; floorId?: string },
	) {
		return this.tableClient.send('qr:bulk-regenerate', {
			tenantId,
			tableIds: body?.tableIds,
			floorId: body?.floorId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}
}
