export class RestaurantQrResponseDto {
	qrUrl: string;
	token: string;
	version: number;
	generatedAt: Date;
	ownerId: string;
	ownerUsername: string;
}
