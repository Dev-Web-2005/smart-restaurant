import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for generating/regenerating QR code for a table
 */
export class GenerateQrCodeDto {
	@IsUUID()
	tableId: string;

	@IsString()
	tenantId: string;

	@IsOptional()
	tableApiKey?: string;
}
