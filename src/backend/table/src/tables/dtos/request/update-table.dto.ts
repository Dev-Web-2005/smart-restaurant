import { IsString, IsInt, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';

/**
 * DTO for updating an existing table
 * All fields are optional for partial updates
 */
export class UpdateTableDto {
	@IsString()
	@IsOptional()
	@MaxLength(50)
	name?: string;

	@IsInt()
	@IsOptional()
	@Min(1)
	capacity?: number;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	location?: string;

	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@IsOptional()
	tableApiKey?: string;
}
