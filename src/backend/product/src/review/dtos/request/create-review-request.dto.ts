import {
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
} from 'class-validator';

export class CreateReviewRequestDto {
	@IsNotEmpty()
	@IsUUID()
	tenantId: string;

	@IsNotEmpty()
	@IsUUID()
	menuItemId: string;

	@IsNotEmpty()
	@IsUUID()
	userId: string;

	@IsNotEmpty()
	@IsString()
	userName: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Max(5)
	rating: number;

	@IsOptional()
	@IsString()
	comment?: string;

	@IsOptional()
	@IsString()
	productApiKey?: string;
}
