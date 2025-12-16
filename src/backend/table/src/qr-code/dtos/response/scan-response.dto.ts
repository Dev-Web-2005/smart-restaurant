/**
 * Response DTO for public QR scan validation
 * Matches OpenAPI spec response for /public/scan/{token}
 */
export class ScanResponseDto {
	tenantId: string;
	tableId: string;
	tableName?: string;

	/**
	 * Frontend redirect URL for the customer
	 * e.g., /menu?tenantId=xxx&tableId=yyy
	 */
	redirect: string;

	constructor(partial: Partial<ScanResponseDto>) {
		Object.assign(this, partial);
	}
}
