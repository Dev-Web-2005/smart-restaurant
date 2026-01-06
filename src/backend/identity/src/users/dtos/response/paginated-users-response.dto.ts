import { GetUserResponseDto } from './get-user-response.dto';

export class PaginatedUsersResponseDto {
	data: GetUserResponseDto[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
