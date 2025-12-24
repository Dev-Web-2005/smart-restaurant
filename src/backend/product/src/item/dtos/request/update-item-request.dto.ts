import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';

export class UpdateItemRequestDto {
	@IsNotEmpty()
	@IsUUID()
	itemId: string;

	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	imageUrl?: string;

	@IsOptional()
	@IsNumber()
	price?: number;

	@IsOptional()
	@IsString()
	currency?: string;

	@IsOptional()
	@IsBoolean()
	available?: boolean;

	@IsNotEmpty()
	@IsString()
	productApiKey: string;
}
