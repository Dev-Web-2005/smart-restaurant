import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

/**
 * Connection Authentication DTO
 *
 * Validates data sent during WebSocket connection handshake
 */
export class ConnectionAuthDto {
	@IsString()
	@IsNotEmpty()
	token: string; // JWT token

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsNotEmpty()
	@IsEnum(['customer', 'waiter', 'kitchen', 'manager', 'admin'])
	role: string;

	@IsString()
	@IsNotEmpty()
	userId: string;

	@IsString()
	@IsOptional()
	tableId?: string; // Required for customers

	@IsString()
	@IsOptional()
	waiterId?: string; // Required for waiters
}
