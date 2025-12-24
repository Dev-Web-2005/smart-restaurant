import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';

export class CreateItemRequestDto {
	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	categoryId: string;

	@IsNotEmpty()
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	imageUrl?: string;

	@IsNotEmpty()
	@IsNumber()
	price: number;

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
