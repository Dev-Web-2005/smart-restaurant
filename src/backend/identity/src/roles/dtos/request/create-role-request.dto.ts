import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export default class CreateRoleRequestDto {
	@IsNotEmpty({ message: 'name should not be empty' })
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsArray()
	authorities?: string[];

	@IsOptional()
	identityApiKey?: string;
}
