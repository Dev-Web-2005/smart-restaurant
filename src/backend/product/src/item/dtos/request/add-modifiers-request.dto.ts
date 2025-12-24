import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ModifierOptionDto {
	@IsNotEmpty()
	@IsString()
	groupName: string;

	@IsNotEmpty()
	@IsString()
	label: string;

	@IsNotEmpty()
	@IsNumber()
	priceDelta: number;

	@IsNotEmpty()
	@IsString()
	type: string; // 'single' or 'multiple'
}

export class AddModifiersRequestDto {
	@IsNotEmpty()
	@IsUUID()
	itemId: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ModifierOptionDto)
	modifiers: ModifierOptionDto[];

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
