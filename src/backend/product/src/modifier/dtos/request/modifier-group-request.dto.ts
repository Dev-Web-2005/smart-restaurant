import {
	IsNotEmpty,
	IsString,
	IsOptional,
	IsNumber,
	Min,
	Length,
	IsBoolean,
} from 'class-validator';

/**
 * DTO for creating a new modifier group
 */
export class CreateModifierGroupRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	@Length(2, 100, { message: 'Group name must be between 2 and 100 characters' })
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	displayOrder?: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

/**
 * DTO for getting all modifier groups
 */
export class GetModifierGroupsRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsString()
	search?: string;
}

/**
 * DTO for updating a modifier group
 */
export class UpdateModifierGroupRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	modifierGroupId: string;

	@IsOptional()
	@IsString()
	@Length(2, 100, { message: 'Group name must be between 2 and 100 characters' })
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	displayOrder?: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

/**
 * DTO for deleting a modifier group
 */
export class DeleteModifierGroupRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	modifierGroupId: string;
}
