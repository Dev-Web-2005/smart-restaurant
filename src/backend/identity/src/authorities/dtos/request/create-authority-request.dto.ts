import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export default class CreateAuthorityRequestDto {
	@IsNotEmpty({ message: 'Authority name should not be empty' })
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	identityApiKey?: string;
}
