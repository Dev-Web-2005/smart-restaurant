import { IsBoolean, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class PublishItemRequestDto {
	@IsNotEmpty()
	@IsUUID()
	itemId: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsBoolean()
	published: boolean;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
