import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO for retrieving a single order by ID
 */
export class GetOrderRequestDto {
	@IsString()
	@IsNotEmpty()
	orderApiKey: string;

	@IsUUID()
	@IsNotEmpty()
	tenantId: string;

	@IsUUID()
	@IsNotEmpty()
	orderId: string;
}
