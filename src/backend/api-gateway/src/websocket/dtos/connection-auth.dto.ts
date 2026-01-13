import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { WsRole } from '../utils/role-mapping.util';

/**
 * Connection Authentication DTO
 *
 * Validates data sent during WebSocket connection handshake
 */
export class ConnectionAuthDto {
	@IsString()
	@IsOptional() // ✅ Optional for guest users
	token?: string; // JWT token (optional for guests)

	@IsString()
	@IsNotEmpty()
	tenantId: string;

	@IsString()
	@IsOptional() // Extracted from JWT or guest mode
	@IsEnum(WsRole)
	role?: WsRole;

	@IsString()
	@IsOptional() // Extracted from JWT or generated for guest
	userId?: string;

	@IsString()
	@IsOptional()
	tableId?: string; // Required for customers and guests

	@IsString()
	@IsOptional()
	waiterId?: string; // Required for waiters

	@IsString()
	@IsOptional()
	guestName?: string; // Optional display name for guest users
}
