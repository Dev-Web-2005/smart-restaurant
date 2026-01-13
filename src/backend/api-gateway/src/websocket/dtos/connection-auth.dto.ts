import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { WsRole } from '../utils/role-mapping.util';

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
	@IsEnum(WsRole)
	role: WsRole;

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
