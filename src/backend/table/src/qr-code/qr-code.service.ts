import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TablesService } from 'src/tables/tables.service';
import { QrCodeResponseDto } from 'src/qr-code/dtos/response/qr-code-response.dto';
import { ScanResponseDto } from 'src/qr-code/dtos/response/scan-response.dto';
import { DownloadQrCodeResponseDto } from 'src/qr-code/dtos/response/download-qr-code-response.dto';
import { QrCodeFormat } from 'src/qr-code/dtos/request/download-qr-code.dto';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

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
	 */
	async generateQrCode(tableId: string, tenantId: string): Promise<QrCodeResponseDto> {
		// Increment token version (invalidates old QR codes)
		const table = await this.tablesService.incrementTokenVersion(tableId, tenantId);

		// Create signed token
		const payload: QrTokenPayload = {
			tableId: table.id,
			tenantId: table.tenantId,
			tokenVersion: table.tokenVersion,
			issuedAt: Date.now(),
		};

		const token = this.signToken(payload);
		const url = `${this.BASE_URL}/tables/scan/${token}`;

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
		const redirect = `/menu?tenantId=${table.tenantId}&tableId=${table.id}`;

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
	 */
	async getQrCode(tableId: string, tenantId: string): Promise<QrCodeResponseDto> {
		const table = await this.tablesService.getTableEntity(tableId, tenantId);

		if (!table.isActive) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		// Create token with current version (no increment)
		const payload: QrTokenPayload = {
			tableId: table.id,
			tenantId: table.tenantId,
			tokenVersion: table.tokenVersion,
			issuedAt: Date.now(),
		};

		const token = this.signToken(payload);
		const url = `${this.BASE_URL}/tables/scan/${token}`;

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
	 * Download QR code in specified format
	 * Supports PNG, PDF, and SVG formats
	 */
	async downloadQrCode(
		tableId: string,
		tenantId: string,
		format: QrCodeFormat,
	): Promise<DownloadQrCodeResponseDto> {
		const table = await this.tablesService.getTableEntity(tableId, tenantId);

		if (!table.isActive) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		// Create token
		const payload: QrTokenPayload = {
			tableId: table.id,
			tenantId: table.tenantId,
			tokenVersion: table.tokenVersion,
			issuedAt: Date.now(),
		};

		const token = this.signToken(payload);
		const url = `${this.BASE_URL}/tables/scan/${token}`;

		let data: string;
		let mimeType: string;
		let filename: string;

		switch (format) {
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
			format,
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
}
