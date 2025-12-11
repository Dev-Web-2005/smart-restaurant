/**
 * Response DTO for QR code generation
 * Matches OpenAPI spec response for /tables/{tableId}/qrcode
 */
export class QrCodeResponseDto {
	/**
	 * Public scan URL containing signed token
	 * Format: https://domain.com/public/scan/{token}
	 */
	url: string;

	/**
	 * Base64 encoded QR code image (PNG format)
	 */
	image: string;

	/**
	 * Table metadata
	 */
	tableId: string;
	tableName: string;
	tokenVersion: number;

	constructor(partial: Partial<QrCodeResponseDto>) {
		Object.assign(this, partial);
	}
}
