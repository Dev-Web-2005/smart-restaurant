import RegisterUserRequestDto from 'src/users/dtos/request/register-user-request.dto';
export default class RegisterUserWithProfileRequestDto extends RegisterUserRequestDto {
    identityApiKey?: string;
    userId?: string;
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
}
