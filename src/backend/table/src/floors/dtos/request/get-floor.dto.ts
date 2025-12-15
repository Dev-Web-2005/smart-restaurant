import { IsString, IsNotEmpty } from 'class-validator';

export class GetFloorDto {
	@IsString()
	@IsNotEmpty()
	tableApiKey: string;

	@IsString()
	@IsNotEmpty()
	floorId: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;
}
