import { IsString, IsInt, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';

export class UpdateFloorDto {
	@IsString()
	@IsOptional()
	tableApiKey?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	name?: string;

	@IsInt()
	@Min(0)
	@IsOptional()
	floorNumber?: number;

	@IsInt()
	@Min(1)
	@IsOptional()
	gridWidth?: number;

	@IsInt()
	@Min(1)
	@IsOptional()
	gridHeight?: number;

	@IsString()
	@IsOptional()
	description?: string;

	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
