import { IsString, IsNotEmpty } from 'class-validator';

export class GetCartDto {
	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	tableId: string;
}
