import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetPublicMenuRequestDto {
	@IsNotEmpty()
	@IsUUID()
	@IsString()
	tenantId: string;
}
