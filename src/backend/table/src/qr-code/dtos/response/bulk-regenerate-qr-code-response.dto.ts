/**
 * Response DTO for bulk QR code regeneration
 */
export class BulkRegenerateQrCodeResponseDto {
	/**
	 * Number of tables whose QR codes were regenerated
	 */
	tableCount: number;

	/**
	 * IDs of tables that were regenerated
	 */
	tableIds: string[];

	/**
	 * Number of tables that failed to regenerate (if any)
	 */
	failedCount: number;

	/**
	 * IDs of tables that failed (if any)
	 */
	failedTableIds: string[];

	/**
	 * Success status
	 */
	success: boolean;

	constructor(partial: Partial<BulkRegenerateQrCodeResponseDto>) {
		Object.assign(this, partial);
	}
}
