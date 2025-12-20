import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Supported QR code download formats
 */
export enum QrCodeFormat {
	PNG = 'png',
	PDF = 'pdf',
	SVG = 'svg',
}

/**
 * DTO for downloading QR code in specific format
 */
export class DownloadQrCodeDto {
	@IsUUID()
	tableId: string;

	@IsString({ message: 'Tenant ID must be a string' })
	tenantId: string;

	@IsEnum(QrCodeFormat)
	format: QrCodeFormat;

	@IsOptional()
	tableApiKey?: string;
}
