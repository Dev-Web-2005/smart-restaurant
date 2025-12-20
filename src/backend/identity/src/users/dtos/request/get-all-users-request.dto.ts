import { IsOptional } from 'class-validator';

export class GetAllUsersRequestDto {
	@IsOptional()
	identityApiKey?: string;
}
