import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ListFloorsDto {
	@IsString()
	@IsNotEmpty()
	tableApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
