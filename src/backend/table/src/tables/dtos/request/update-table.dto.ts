import {
	IsString,
	IsInt,
	IsOptional,
	IsBoolean,
	Min,
	MaxLength,
	IsEnum,
} from 'class-validator';
import { TableStatus } from 'src/common/enums/table-status.enum';

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

	@IsEnum(TableStatus)
	@IsOptional()
	status?: TableStatus;

	@IsString()
	@IsOptional()
	floorId?: string;

	@IsInt()
	@IsOptional()
	@Min(0)
	gridX?: number;

	@IsInt()
	@IsOptional()
	@Min(0)
	gridY?: number;

	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@IsOptional()
	tableApiKey?: string;
}
