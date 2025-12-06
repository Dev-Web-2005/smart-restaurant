export default class GetProfileResponseDto {
	userId: string;
	birthDay?: Date;
	phoneNumber?: string;
	address?: string;
	restaurantName?: string;
	businessAddress?: string;
	contractNumber?: string;
	contractEmail?: string;
	cardHolderName?: string;
	accountNumber?: string;
	expirationDate?: string;
	cvv?: string;
	frontImage?: string;
	backImage?: string;
	createdAt: Date;
	updatedAt: Date;
}
