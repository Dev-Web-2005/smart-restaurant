export class ValidateRestaurantQrResponseDto {
	valid: boolean;
	ownerId?: string;
	ownerUsername?: string;
	qrVersion?: number;
	message?: string;
}
