import { IsString, IsNotEmpty, IsInt, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateFloorDto {
	@IsString()
	@IsNotEmpty()
	tableApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	name: string;

	@IsInt()
	@Min(0)
	floorNumber: number;

	@IsInt()
	@Min(1)
	@IsOptional()
	gridWidth?: number; // Default: 10

	@IsInt()
	@Min(1)
	@IsOptional()
	gridHeight?: number; // Default: 10

	@IsString()
	@IsOptional()
	description?: string;
}
