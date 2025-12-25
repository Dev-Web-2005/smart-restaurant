import {
	IsNotEmpty,
	IsString,
	IsOptional,
	IsNumber,
	Min,
	IsBoolean,
	IsArray,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for attaching a modifier group to a menu item
 */
export class AttachModifierGroupDto {
	@IsString()
	@IsNotEmpty()
	modifierGroupId: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	displayOrder?: number;

	@IsOptional()
	@IsBoolean()
	isRequired?: boolean;

	@IsOptional()
	@IsNumber()
	@Min(0)
	minSelections?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	maxSelections?: number;
}

/**
 * DTO for attaching modifier groups to a menu item
 */
export class AttachModifierGroupsRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => AttachModifierGroupDto)
	modifierGroups: AttachModifierGroupDto[];
}

/**
 * DTO for detaching a modifier group from a menu item
 */
export class DetachModifierGroupRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;

	@IsString()
	@IsNotEmpty()
	modifierGroupId: string;
}

/**
 * DTO for getting modifier groups attached to a menu item
 */
export class GetMenuItemModifierGroupsRequestDto {
	@IsString()
	@IsNotEmpty()
	productApiKey: string;

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	menuItemId: string;
}
