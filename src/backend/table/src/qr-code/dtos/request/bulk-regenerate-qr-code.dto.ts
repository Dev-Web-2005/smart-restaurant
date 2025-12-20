import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Request DTO for bulk QR code regeneration
 * Regenerates QR codes for multiple tables simultaneously
 */
export class BulkRegenerateQrCodeDto {
	@IsString({ message: 'Tenant ID must be a string' })
	tenantId: string;

	/**
	 * Optional: specific table IDs to regenerate
	 * If empty, regenerate all active tables
	 */
	@IsOptional()
	@IsUUID('4', { each: true, message: 'Each table ID must be a valid UUID' })
	tableIds?: string[];

	/**
	 * Optional: filter by floor
	 */
	@IsOptional()
	@IsUUID('4', { message: 'Floor ID must be a valid UUID' })
	floorId?: string;

	@IsString({ message: 'Table API key must be a string' })
	tableApiKey: string;
}
