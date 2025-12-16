import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QrCodeService } from 'src/qr-code/qr-code.service';
import { GenerateQrCodeDto } from 'src/qr-code/dtos/request/generate-qr-code.dto';
import { GetQrCodeDto } from 'src/qr-code/dtos/request/get-qr-code.dto';
import { DownloadQrCodeDto } from 'src/qr-code/dtos/request/download-qr-code.dto';
import { BatchDownloadQrCodeDto } from 'src/qr-code/dtos/request/batch-download-qr-code.dto';
import { QrCodeResponseDto } from 'src/qr-code/dtos/response/qr-code-response.dto';
import { DownloadQrCodeResponseDto } from 'src/qr-code/dtos/response/download-qr-code-response.dto';
import { BatchDownloadQrCodeResponseDto } from 'src/qr-code/dtos/response/batch-download-qr-code-response.dto';
import { ScanResponseDto } from 'src/qr-code/dtos/response/scan-response.dto';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { ConfigService } from '@nestjs/config/dist/config.service';

/**
 * Controller for QR code operations
 * Handles QR generation and public scan validation
 */
@Controller()
export class QrCodeController {
	constructor(
		private readonly qrCodeService: QrCodeService,
		private readonly config: ConfigService,
	) {}

	/**
	 * Generate or regenerate QR code for a table
	 * Pattern: qr:generate
	 */
	@MessagePattern('qr:generate')
	async generateQrCode(@Payload() dto: GenerateQrCodeDto): Promise<QrCodeResponseDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.qrCodeService.generateQrCode(dto.tableId, dto.tenantId);
	}

	/**
	 * Get existing QR code without regenerating
	 * Pattern: qr:get
	 */
	@MessagePattern('qr:get')
	async getQrCode(@Payload() dto: GetQrCodeDto): Promise<QrCodeResponseDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.qrCodeService.getQrCode(dto.tableId, dto.tenantId);
	}

	/**
	 * Download QR code in specified format
	 * Pattern: qr:download
	 */
	@MessagePattern('qr:download')
	async downloadQrCode(
		@Payload() dto: DownloadQrCodeDto,
	): Promise<DownloadQrCodeResponseDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.qrCodeService.downloadQrCode(dto.tableId, dto.tenantId, dto.format);
	}

	/**
	 * Validate QR code token from public scan
	 * Pattern: qr:validate-scan
	 */
	@MessagePattern('qr:validate-scan')
	async validateScan(
		@Payload() payload: { token: string; tableApiKey?: string },
	): Promise<ScanResponseDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (payload.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}
		return await this.qrCodeService.validateScanToken(payload.token);
	}

	/**
	 * Batch download QR codes for multiple tables
	 * Pattern: qr:batch-download
	 */
	@MessagePattern('qr:batch-download')
	async batchDownloadQrCode(
		@Payload() dto: BatchDownloadQrCodeDto,
	): Promise<BatchDownloadQrCodeResponseDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.qrCodeService.batchDownloadQrCode(
			dto.tenantId,
			dto.format,
			dto.tableIds,
			dto.floorId,
		);
	}
}
