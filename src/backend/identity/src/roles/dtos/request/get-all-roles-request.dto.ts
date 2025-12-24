import { IsOptional } from 'class-validator';

export class GetAllRolesRequestDto {
	@IsOptional()
	identityApiKey?: string;
}
