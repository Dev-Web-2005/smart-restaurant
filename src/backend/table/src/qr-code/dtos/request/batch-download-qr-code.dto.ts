import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum BatchQrCodeFormat {
	ZIP_PNG = 'zip-png',
	ZIP_PDF = 'zip-pdf',
	ZIP_SVG = 'zip-svg',
	COMBINED_PDF = 'combined-pdf',
}

/**
 * Request DTO for batch QR code download
 */
export class BatchDownloadQrCodeDto {
	@IsString({ message: 'Tenant ID must be a string' })
	tenantId: string;

	@IsEnum(BatchQrCodeFormat)
	format: BatchQrCodeFormat;

	/**
	 * Optional: specific table IDs to include
	 * If empty, download all active tables
	 */
	@IsOptional()
	tableIds?: string[];

	/**
	 * Optional: filter by floor
	 */
	@IsOptional()
	floorId?: string;

	@IsString({ message: 'Table API key must be a string' })
	tableApiKey: string;
}
