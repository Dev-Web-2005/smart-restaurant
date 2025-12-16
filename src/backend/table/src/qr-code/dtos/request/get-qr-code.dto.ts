import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for getting existing QR code without regeneration
 */
export class GetQrCodeDto {
	@IsUUID()
	tableId: string;

	@IsString({ message: 'Tenant ID must be a string' })
	tenantId: string;

	@IsOptional()
	tableApiKey?: string;
}
