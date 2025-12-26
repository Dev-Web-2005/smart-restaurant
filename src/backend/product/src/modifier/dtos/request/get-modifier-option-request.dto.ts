import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetModifierOptionRequestDto {
	@IsNotEmpty()
	@IsString()
	productApiKey: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	modifierGroupId: string;

	@IsNotEmpty()
	@IsUUID()
	modifierOptionId: string;
}
