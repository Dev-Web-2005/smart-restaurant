import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetModifierGroupRequestDto {
	@IsNotEmpty()
	@IsString()
	productApiKey: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	modifierGroupId: string;
}
