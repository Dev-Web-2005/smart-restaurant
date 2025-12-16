/**
 * Response DTO for batch QR code download
 */
export class BatchDownloadQrCodeResponseDto {
	/**
	 * Base64 encoded ZIP or PDF data
	 */
	data: string;

	/**
	 * Format type
	 */
	format: string;

	/**
	 * MIME type
	 */
	mimeType: string;

	/**
	 * Suggested filename
	 */
	filename: string;

	/**
	 * Number of tables included
	 */
	tableCount: number;

	/**
	 * List of table IDs included
	 */
	tableIds: string[];

	constructor(partial: Partial<BatchDownloadQrCodeResponseDto>) {
		Object.assign(this, partial);
	}
}
