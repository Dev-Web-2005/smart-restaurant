import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TablesService } from 'src/tables/tables.service';
import { QrCodeResponseDto } from 'src/qr-code/dtos/qr-code-response.dto';
import { ScanResponseDto } from 'src/qr-code/dtos/scan-response.dto';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

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
