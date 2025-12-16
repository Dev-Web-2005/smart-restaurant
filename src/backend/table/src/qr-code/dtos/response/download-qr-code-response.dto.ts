/**
 * Response DTO for QR code download
 * Contains binary data and metadata
 */
export class DownloadQrCodeResponseDto {
	/**
	 * Base64 encoded file data
	 */
	data: string;

	/**
	 * File format
	 */
	format: string;

	/**
	 * MIME type for the file
	 */
	mimeType: string;

	/**
	 * Suggested filename
	 */
	filename: string;

	/**
	 * Table metadata
	 */
	tableId: string;
	tableName: string;

	constructor(partial: Partial<DownloadQrCodeResponseDto>) {
		Object.assign(this, partial);
	}
}
