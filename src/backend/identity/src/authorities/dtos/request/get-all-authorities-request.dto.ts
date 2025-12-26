import { IsOptional } from 'class-validator';

export class GetAllAuthoritiesRequestDto {
	@IsOptional()
	identityApiKey?: string;
}
