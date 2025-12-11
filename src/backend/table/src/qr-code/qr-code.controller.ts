import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { QrCodeService } from 'src/qr-code/qr-code.service';
import { GenerateQrCodeDto } from 'src/qr-code/dtos/request/generate-qr-code.dto';
import { QrCodeResponseDto } from 'src/qr-code/dtos/response/qr-code-response.dto';
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
}
