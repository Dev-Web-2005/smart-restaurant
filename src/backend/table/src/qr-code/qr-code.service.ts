import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TablesService } from 'src/tables/tables.service';
import { GenerateQrCodeDto } from 'src/qr-code/dtos/request/generate-qr-code.dto';
import { GetQrCodeDto } from 'src/qr-code/dtos/request/get-qr-code.dto';
import { DownloadQrCodeDto } from 'src/qr-code/dtos/request/download-qr-code.dto';
import { BatchDownloadQrCodeDto } from 'src/qr-code/dtos/request/batch-download-qr-code.dto';
import { BulkRegenerateQrCodeDto } from 'src/qr-code/dtos/request/bulk-regenerate-qr-code.dto';
import { QrCodeResponseDto } from 'src/qr-code/dtos/response/qr-code-response.dto';
import { ScanResponseDto } from 'src/qr-code/dtos/response/scan-response.dto';
import { DownloadQrCodeResponseDto } from 'src/qr-code/dtos/response/download-qr-code-response.dto';
import { BatchDownloadQrCodeResponseDto } from 'src/qr-code/dtos/response/batch-download-qr-code-response.dto';
import { BulkRegenerateQrCodeResponseDto } from 'src/qr-code/dtos/response/bulk-regenerate-qr-code-response.dto';
import { QrCodeFormat } from 'src/qr-code/dtos/request/download-qr-code.dto';
import { BatchQrCodeFormat } from 'src/qr-code/dtos/request/batch-download-qr-code.dto';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';

/**
 * Payload structure for QR code tokens
 */
interface QrTokenPayload {
	tableId: string;
	tenantId: string;
	tokenVersion: number;
	issuedAt: number; // Unix timestamp
}

/**
 * Service for QR code generation and validation
 * Uses HMAC-SHA256 for signing tokens
 */
@Injectable()
export class QrCodeService {
	private readonly SECRET_KEY: string;
	private readonly BASE_URL: string;
	private readonly TOKEN_EXPIRY_HOURS = 24 * 365; // 1 year (effectively non-expiring)

	constructor(
		private readonly tablesService: TablesService,
		private readonly configService: ConfigService,
	) {
		this.SECRET_KEY =
			this.configService.get<string>('QR_SECRET_KEY') || 'change-me-in-production';
		this.BASE_URL =
			this.configService.get<string>('QR_BASE_URL') || 'http://localhost:3000';
	}

	/**
	 * Generate or regenerate QR code for a table
	 * Increments token version to invalidate old QR codes
	 * Caches token for future reuse
	 */
	async generateQrCode(dto: GenerateQrCodeDto): Promise<QrCodeResponseDto> {
		// Increment token version (invalidates old QR codes and clears cache)
		const table = await this.tablesService.incrementTokenVersion(
			dto.tableId,
			dto.tenantId,
		);

		// Create signed token
		const payload: QrTokenPayload = {
			tableId: table.id,
			tenantId: table.tenantId,
			tokenVersion: table.tokenVersion,
			issuedAt: Date.now(),
		};

		const token = this.signToken(payload);

		// Cache token for reuse
		await this.tablesService.saveQrToken(dto.tableId, dto.tenantId, token);

		const url = `${this.BASE_URL}/tenants/${dto.tenantId}/tables/scan/${token}`;

		// Generate QR code image
		let qrImage: string;
		try {
			qrImage = await QRCode.toDataURL(url, {
				errorCorrectionLevel: 'M',
				type: 'image/png',
				width: 512,
				margin: 2,
			});
		} catch {
			throw new AppException(ErrorCode.QR_GENERATION_FAILED);
		}

		// Remove data URL prefix to return only base64
		const base64Image = qrImage.replace(/^data:image\/png;base64,/, '');

		return new QrCodeResponseDto({
			url,
			image: base64Image,
			tableId: table.id,
			tableName: table.name,
			tokenVersion: table.tokenVersion,
		});
	}

	/**
	 * Validate QR code token from public scan
	 * Returns redirect URL if valid
	 */
	async validateScanToken(token: string): Promise<ScanResponseDto> {
		// Verify and decode token
		const payload = this.verifyToken(token);

		if (!payload) {
			throw new AppException(ErrorCode.INVALID_QR_TOKEN);
		}

		// Check if token version matches current table version
		const table = await this.tablesService.getTableEntity(
			payload.tableId,
			payload.tenantId,
		);

		if (table.tokenVersion !== payload.tokenVersion) {
			// Token has been invalidated by regeneration
			throw new AppException(ErrorCode.INVALID_QR_TOKEN);
		}

		if (!table.isActive) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		// Check token expiry (optional, can be very long)
		const ageInHours = (Date.now() - payload.issuedAt) / (1000 * 60 * 60);
		if (ageInHours > this.TOKEN_EXPIRY_HOURS) {
			throw new AppException(ErrorCode.INVALID_QR_TOKEN);
		}

		// Return redirect URL for frontend
		// const redirect = `/menu?tenantId=${table.tenantId}&tableId=${table.id}`;
		const redirect = `/tenants/${table.tenantId}/login`;

		return new ScanResponseDto({
			tenantId: table.tenantId,
			tableId: table.id,
			tableName: table.name,
			redirect,
		});
	}

	/**
	 * Get existing QR code without regenerating
	 * Returns current QR code for the table
	 * Reuses cached token for better performance
	 */
	async getQrCode(dto: GetQrCodeDto): Promise<QrCodeResponseDto> {
		const table = await this.tablesService.getTableEntity(dto.tableId, dto.tenantId);

		if (!table.isActive) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		let token: string;

		// Reuse cached token if available
		if (table.qrToken) {
			token = table.qrToken;
		} else {
			// Generate new token if not cached (shouldn't happen, but safe fallback)
			const payload: QrTokenPayload = {
				tableId: table.id,
				tenantId: table.tenantId,
				tokenVersion: table.tokenVersion,
				issuedAt: Date.now(),
			};

			token = this.signToken(payload);
			// Cache it for next time
			await this.tablesService.saveQrToken(dto.tableId, dto.tenantId, token);
		}

		const url = `${this.BASE_URL}/tenants/${dto.tenantId}/tables/scan/${token}`;

		// Generate QR code image from cached token
		let qrImage: string;
		try {
			qrImage = await QRCode.toDataURL(url, {
				errorCorrectionLevel: 'M',
				type: 'image/png',
				width: 512,
				margin: 2,
			});
		} catch {
			throw new AppException(ErrorCode.QR_GENERATION_FAILED);
		}

		// Remove data URL prefix to return only base64
		const base64Image = qrImage.replace(/^data:image\/png;base64,/, '');

		return new QrCodeResponseDto({
			url,
			image: base64Image,
			tableId: table.id,
			tableName: table.name,
			tokenVersion: table.tokenVersion,
		});
	}

	/**
	 * Download QR code in specified format
	 * Supports PNG, PDF, and SVG formats
	 * Reuses cached token for better performance
	 */
	async downloadQrCode(dto: DownloadQrCodeDto): Promise<DownloadQrCodeResponseDto> {
		const table = await this.tablesService.getTableEntity(dto.tableId, dto.tenantId);

		if (!table.isActive) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		let token: string;

		// Reuse cached token if available
		if (table.qrToken) {
			token = table.qrToken;
		} else {
			// Generate new token if not cached
			const payload: QrTokenPayload = {
				tableId: table.id,
				tenantId: table.tenantId,
				tokenVersion: table.tokenVersion,
				issuedAt: Date.now(),
			};

			token = this.signToken(payload);
			// Cache it for next time
			await this.tablesService.saveQrToken(dto.tableId, dto.tenantId, token);
		}

		const url = `${this.BASE_URL}/tenants/${dto.tenantId}/tables/scan/${token}`;

		let data: string;
		let mimeType: string;
		let filename: string;

		switch (dto.format) {
			case QrCodeFormat.PNG:
				data = await this.generatePNG(url);
				mimeType = 'image/png';
				filename = `table-${table.name}-qr.png`;
				break;

			case QrCodeFormat.PDF:
				data = await this.generatePDF(url, table.name);
				mimeType = 'application/pdf';
				filename = `table-${table.name}-qr.pdf`;
				break;

			case QrCodeFormat.SVG:
				data = await this.generateSVG(url);
				mimeType = 'image/svg+xml';
				filename = `table-${table.name}-qr.svg`;
				break;

			default:
				throw new AppException(ErrorCode.QR_GENERATION_FAILED);
		}

		return new DownloadQrCodeResponseDto({
			data,
			format: dto.format,
			mimeType,
			filename,
			tableId: table.id,
			tableName: table.name,
		});
	}

	/**
	 * Generate QR code as PNG (base64)
	 */ private async generatePNG(url: string): Promise<string> {
		try {
			const qrImage = await QRCode.toDataURL(url, {
				errorCorrectionLevel: 'M',
				type: 'image/png',
				width: 1024, // Higher resolution for download
				margin: 2,
			});
			return qrImage.replace(/^data:image\/png;base64,/, '');
		} catch {
			throw new AppException(ErrorCode.QR_GENERATION_FAILED);
		}
	}

	/**
	 * Generate QR code as SVG (base64 encoded)
	 */
	private async generateSVG(url: string): Promise<string> {
		try {
			const svg = await QRCode.toString(url, {
				errorCorrectionLevel: 'M',
				type: 'svg',
				width: 512,
				margin: 2,
			});
			return Buffer.from(svg).toString('base64');
		} catch {
			throw new AppException(ErrorCode.QR_GENERATION_FAILED);
		}
	}

	/**
	 * Generate QR code as PDF (base64 encoded)
	 * Creates a PDF with QR code and table information
	 */
	private async generatePDF(url: string, tableName: string): Promise<string> {
		// Generate QR code as buffer first
		const qrBuffer = await QRCode.toBuffer(url, {
			errorCorrectionLevel: 'M',
			type: 'png',
			width: 400,
			margin: 2,
		});

		return new Promise((resolve, reject) => {
			try {
				// Create PDF
				const doc = new PDFDocument({
					size: 'A4',
					margin: 50,
				});

				const chunks: Buffer[] = [];

				doc.on('data', (chunk) => chunks.push(chunk));
				doc.on('end', () => {
					const pdfBuffer = Buffer.concat(chunks);
					resolve(pdfBuffer.toString('base64'));
				});
				doc.on('error', reject);

				// Add title
				doc
					.fontSize(24)
					.font('Helvetica-Bold')
					.text(`QR Code - Table ${tableName}`, { align: 'center' });

				doc.moveDown(2);

				// Add QR code image (centered)
				const pageWidth = doc.page.width;
				const imageWidth = 400;
				const xPosition = (pageWidth - imageWidth) / 2;

				doc.image(qrBuffer, xPosition, doc.y, {
					width: imageWidth,
					align: 'center',
				});

				doc.moveDown(3);

				// Add instructions
				doc
					.fontSize(12)
					.font('Helvetica')
					.text('Scan this QR code to view the menu', { align: 'center' });

				doc.moveDown(1);

				// Add URL as text (for reference)
				doc
					.fontSize(10)
					.font('Helvetica')
					.fillColor('gray')
					.text(url, { align: 'center' });

				doc.end();
			} catch {
				reject(new AppException(ErrorCode.QR_GENERATION_FAILED));
			}
		});
	}

	/**
	 * Sign token payload using HMAC-SHA256
	 * Format: base64(payload).base64(signature)
	 */
	private signToken(payload: QrTokenPayload): string {
		const payloadStr = JSON.stringify(payload);
		const payloadBase64 = Buffer.from(payloadStr).toString('base64url');

		const signature = crypto
			.createHmac('sha256', this.SECRET_KEY)
			.update(payloadBase64)
			.digest('base64url');

		return `${payloadBase64}.${signature}`;
	}

	/**
	 * Verify and decode token
	 * Returns payload if valid, null if invalid
	 */
	private verifyToken(token: string): QrTokenPayload | null {
		try {
			const parts = token.split('.');
			if (parts.length !== 2) {
				return null;
			}

			const [payloadBase64, signature] = parts;

			// Verify signature
			const expectedSignature = crypto
				.createHmac('sha256', this.SECRET_KEY)
				.update(payloadBase64)
				.digest('base64url');

			if (signature !== expectedSignature) {
				return null;
			}

			// Decode payload
			const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
			const payload = JSON.parse(payloadStr) as QrTokenPayload;

			return payload;
		} catch {
			return null;
		}
	}

	/**
	 * Batch download QR codes for multiple tables
	 * Supports ZIP (individual files) or combined PDF
	 */
	async batchDownloadQrCode(
		dto: BatchDownloadQrCodeDto,
	): Promise<BatchDownloadQrCodeResponseDto> {
		// Get tables to generate QR codes for
		let tables;
		if (dto.tableIds && dto.tableIds.length > 0) {
			// Specific tables - fetch each one
			const tablePromises = dto.tableIds.map((id) =>
				this.tablesService.getTableEntity(id, dto.tenantId),
			);
			tables = await Promise.all(tablePromises);
		} else {
			// All active tables (optionally filtered by floor)
			const listDto: any = {
				tenantId: dto.tenantId,
				isActive: true,
			};
			if (dto.floorId) {
				listDto.floorId = dto.floorId;
			}
			const tableDtos = await this.tablesService.listTables(listDto);

			// Convert DTOs to entities (need full entity for qrToken field)
			const entityPromises = tableDtos.map((tableDto) =>
				this.tablesService.getTableEntity(tableDto.id, dto.tenantId),
			);
			tables = await Promise.all(entityPromises);
		}

		// Filter only active tables
		tables = tables.filter((t) => t && t.isActive);

		if (tables.length === 0) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		let data: string;
		let mimeType: string;
		let filename: string;

		switch (dto.format) {
			case BatchQrCodeFormat.ZIP_PNG:
				data = await this.generateZipArchive(tables, 'png');
				mimeType = 'application/zip';
				filename = `qr-codes-${dto.tenantId}.zip`;
				break;

			case BatchQrCodeFormat.ZIP_PDF:
				data = await this.generateZipArchive(tables, 'pdf');
				mimeType = 'application/zip';
				filename = `qr-codes-${dto.tenantId}.zip`;
				break;

			case BatchQrCodeFormat.ZIP_SVG:
				data = await this.generateZipArchive(tables, 'svg');
				mimeType = 'application/zip';
				filename = `qr-codes-${dto.tenantId}.zip`;
				break;

			case BatchQrCodeFormat.COMBINED_PDF:
				data = await this.generateCombinedPDF(tables);
				mimeType = 'application/pdf';
				filename = `all-qr-codes-${dto.tenantId}.pdf`;
				break;

			default:
				throw new AppException(ErrorCode.QR_GENERATION_FAILED);
		}

		return new BatchDownloadQrCodeResponseDto({
			data,
			format: dto.format,
			mimeType,
			filename,
			tableCount: tables.length,
			tableIds: tables.map((t) => t.id),
		});
	}

	/**
	 * Generate ZIP archive with individual QR code files
	 */
	private async generateZipArchive(
		tables: any[],
		format: 'png' | 'pdf' | 'svg',
	): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const archive = archiver('zip', {
				zlib: { level: 9 }, // Maximum compression
			});

			const chunks: Buffer[] = [];

			archive.on('data', (chunk: Buffer) => chunks.push(chunk));
			archive.on('end', () => {
				const zipBuffer = Buffer.concat(chunks);
				resolve(zipBuffer.toString('base64'));
			});
			archive.on('error', () => {
				reject(new AppException(ErrorCode.QR_GENERATION_FAILED));
			});

			// Process tables and add to archive
			(async () => {
				try {
					for (const table of tables) {
						let token: string;

						// Reuse cached token if available
						if (table.qrToken) {
							token = table.qrToken;
						} else {
							const payload: QrTokenPayload = {
								tableId: table.id,
								tenantId: table.tenantId,
								tokenVersion: table.tokenVersion,
								issuedAt: Date.now(),
							};
							token = this.signToken(payload);
							await this.tablesService.saveQrToken(table.id, table.tenantId, token);
						}

						const url = `${this.BASE_URL}/tenants/${table.tenantId}/tables/scan/${token}`;
						let fileData: Buffer;
						let ext: string;

						switch (format) {
							case 'png': {
								const pngBase64 = await this.generatePNG(url);
								fileData = Buffer.from(pngBase64, 'base64');
								ext = 'png';
								break;
							}
							case 'pdf': {
								const pdfBase64 = await this.generatePDF(url, table.name);
								fileData = Buffer.from(pdfBase64, 'base64');
								ext = 'pdf';
								break;
							}
							case 'svg': {
								const svgBase64 = await this.generateSVG(url);
								fileData = Buffer.from(svgBase64, 'base64');
								ext = 'svg';
								break;
							}
						}

						// Sanitize filename (remove special characters)
						const safeName = table.name.replace(/[^a-zA-Z0-9-_]/g, '_');
						archive.append(fileData, { name: `table-${safeName}-qr.${ext}` });
					}

					archive.finalize();
				} catch {
					reject(new AppException(ErrorCode.QR_GENERATION_FAILED));
				}
			})();
		});
	}

	/**
	 * Generate combined PDF with all QR codes
	 * Each table gets one page
	 */
	private async generateCombinedPDF(tables: any[]): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const doc = new PDFDocument({
				size: 'A4',
				margin: 50,
				autoFirstPage: false,
			});

			const chunks: Buffer[] = [];

			doc.on('data', (chunk: Buffer) => chunks.push(chunk));
			doc.on('end', () => {
				const pdfBuffer = Buffer.concat(chunks);
				resolve(pdfBuffer.toString('base64'));
			});
			doc.on('error', () => {
				reject(new AppException(ErrorCode.QR_GENERATION_FAILED));
			});

			// Process tables and generate PDF pages
			(async () => {
				try {
					for (let i = 0; i < tables.length; i++) {
						const table = tables[i];

						// Add new page
						doc.addPage();

						let token: string;

						// Reuse cached token if available
						if (table.qrToken) {
							token = table.qrToken;
						} else {
							const payload: QrTokenPayload = {
								tableId: table.id,
								tenantId: table.tenantId,
								tokenVersion: table.tokenVersion,
								issuedAt: Date.now(),
							};
							token = this.signToken(payload);
							await this.tablesService.saveQrToken(table.id, table.tenantId, token);
						}

						const url = `${this.BASE_URL}/tenants/${table.tenantId}/tables/scan/${token}`;

						// Generate QR code as buffer
						const qrBuffer = await QRCode.toBuffer(url, {
							errorCorrectionLevel: 'M',
							type: 'png',
							width: 400,
							margin: 2,
						});

						// Add title
						doc
							.fontSize(24)
							.font('Helvetica-Bold')
							.text(`QR Code - ${table.name}`, { align: 'center' });

						doc.moveDown(2);

						// Add QR code image (centered)
						const pageWidth = doc.page.width;
						const imageWidth = 400;
						const xPosition = (pageWidth - imageWidth) / 2;

						doc.image(qrBuffer, xPosition, doc.y, {
							width: imageWidth,
							align: 'center',
						});

						doc.moveDown(3);

						// Add capacity info
						doc
							.fontSize(14)
							.font('Helvetica')
							.text(`Capacity: ${table.capacity} people`, { align: 'center' });

						doc.moveDown(1);

						// Add instructions
						doc
							.fontSize(12)
							.font('Helvetica')
							.text('Scan this QR code to view the menu', { align: 'center' });

						doc.moveDown(1);

						// Add page number
						doc
							.fontSize(10)
							.fillColor('gray')
							.text(`Page ${i + 1} of ${tables.length}`, { align: 'center' });
					}

					doc.end();
				} catch {
					reject(new AppException(ErrorCode.QR_GENERATION_FAILED));
				}
			})();
		});
	}

	/**
	 * Bulk regenerate QR codes for multiple tables
	 * Increments token version for each table to invalidate old QR codes
	 * Provides progress tracking and error handling
	 */
	async bulkRegenerateQrCode(
		dto: BulkRegenerateQrCodeDto,
	): Promise<BulkRegenerateQrCodeResponseDto> {
		// Get tables to regenerate QR codes for
		let tables;
		if (dto.tableIds && dto.tableIds.length > 0) {
			// Specific tables - fetch each one
			const tablePromises = dto.tableIds.map((id) =>
				this.tablesService.getTableEntity(id, dto.tenantId),
			);
			tables = await Promise.all(tablePromises);
		} else {
			// All active tables (optionally filtered by floor)
			const listDto: any = {
				tenantId: dto.tenantId,
				isActive: true,
			};
			if (dto.floorId) {
				listDto.floorId = dto.floorId;
			}
			const tableDtos = await this.tablesService.listTables(listDto);

			// Convert DTOs to entities (need full entity for token operations)
			const entityPromises = tableDtos.map((tableDto) =>
				this.tablesService.getTableEntity(tableDto.id, dto.tenantId),
			);
			tables = await Promise.all(entityPromises);
		}

		// Filter only active tables
		tables = tables.filter((t) => t && t.isActive);

		if (tables.length === 0) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		const successfulTableIds: string[] = [];
		const failedTableIds: string[] = [];

		// Regenerate QR codes for each table
		for (const table of tables) {
			try {
				// Increment token version (invalidates old QR codes and clears cache)
				const updatedTable = await this.tablesService.incrementTokenVersion(
					table.id,
					table.tenantId,
				);

				// Create new signed token
				const payload: QrTokenPayload = {
					tableId: updatedTable.id,
					tenantId: updatedTable.tenantId,
					tokenVersion: updatedTable.tokenVersion,
					issuedAt: Date.now(),
				};

				const token = this.signToken(payload);

				// Cache token for future reuse
				await this.tablesService.saveQrToken(
					updatedTable.id,
					updatedTable.tenantId,
					token,
				);

				successfulTableIds.push(table.id);
			} catch (error) {
				// Track failed tables but continue processing
				failedTableIds.push(table.id);
				console.error(`Failed to regenerate QR code for table ${table.id}:`, error);
			}
		}

		return new BulkRegenerateQrCodeResponseDto({
			tableCount: successfulTableIds.length,
			tableIds: successfulTableIds,
			failedCount: failedTableIds.length,
			failedTableIds: failedTableIds,
			success: failedTableIds.length === 0,
		});
	}
}
