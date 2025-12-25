import {
	IsNotEmpty,
	IsString,
	IsOptional,
	IsNumber,
	Min,
	Max,
	Length,
	IsBoolean,
} from 'class-validator';

/**
 * DTO for creating a new modifier option
 */
export class CreateModifierOptionRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	modifierGroupId: string;

	@IsString()
	@IsNotEmpty()
	@Length(2, 100, { message: 'Option label must be between 2 and 100 characters' })
	label: string;

	@IsOptional()
	@IsNumber()
	@Min(-999999)
	@Max(999999)
	priceDelta?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	displayOrder?: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

/**
 * DTO for getting all modifier options in a group
 */
export class GetModifierOptionsRequestDto {
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
	@IsBoolean()
	isActive?: boolean;
}

/**
 * DTO for updating a modifier option
 */
export class UpdateModifierOptionRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	modifierGroupId: string;

	@IsString()
	@IsNotEmpty()
	optionId: string;

	@IsOptional()
	@IsString()
	@Length(2, 100, { message: 'Option label must be between 2 and 100 characters' })
	label?: string;

	@IsOptional()
	@IsNumber()
	@Min(-999999)
	@Max(999999)
	priceDelta?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	displayOrder?: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}

/**
 * DTO for deleting a modifier option
 */
export class DeleteModifierOptionRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	modifierGroupId: string;

	@IsString()
	@IsNotEmpty()
	optionId: string;
}
