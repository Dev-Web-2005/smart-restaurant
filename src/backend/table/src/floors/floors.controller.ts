import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FloorsService } from 'src/floors/floors.service';
import { CreateFloorDto } from 'src/floors/dtos/request/create-floor.dto';
import { UpdateFloorDto } from 'src/floors/dtos/request/update-floor.dto';
import { GetFloorDto } from 'src/floors/dtos/request/get-floor.dto';
import { ListFloorsDto } from 'src/floors/dtos/request/list-floors.dto';
import { FloorDto } from 'src/floors/dtos/response/floor.dto';
import { ConfigService } from '@nestjs/config/dist/config.service';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';

/**
 * Controller for floor management operations
 * Exposes TCP message patterns for microservice communication
 */
@Controller()
export class FloorsController {
	constructor(
		private readonly floorsService: FloorsService,
		private readonly config: ConfigService,
	) {}

	/**
	 * Create a new floor
	 * Pattern: floors:create
	 */
	@MessagePattern('floors:create')
	async createFloor(@Payload() dto: CreateFloorDto): Promise<FloorDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.floorsService.createFloor(dto);
	}

	/**
	 * Get a single floor by ID
	 * Pattern: floors:get-by-id
	 */
	@MessagePattern('floors:get-by-id')
	async getFloorById(@Payload() dto: GetFloorDto): Promise<FloorDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.floorsService.getFloorById(dto.floorId, dto.tenantId);
	}

	/**
	 * List all floors for a tenant
	 * Pattern: floors:list
	 */
	@MessagePattern('floors:list')
	async listFloors(@Payload() dto: ListFloorsDto): Promise<FloorDto[]> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.floorsService.listFloors(dto.tenantId, dto.isActive);
	}

	/**
	 * Update a floor
	 * Pattern: floors:update
	 */
	@MessagePattern('floors:update')
	async updateFloor(
		@Payload() payload: { floorId: string; tenantId: string; data: UpdateFloorDto },
	): Promise<FloorDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (payload.data.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.floorsService.updateFloor(
			payload.floorId,
			payload.tenantId,
			payload.data,
		);
	}

	/**
	 * Soft delete a floor (set isActive = false)
	 * Pattern: floors:delete
	 */
	@MessagePattern('floors:delete')
	async deleteFloor(@Payload() dto: GetFloorDto): Promise<{ success: boolean }> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		await this.floorsService.deleteFloor(dto.floorId, dto.tenantId);
		return { success: true };
	}

	/**
	 * Permanently delete a floor
	 * Pattern: floors:delete-permanent
	 */
	@MessagePattern('floors:delete-permanent')
	async deleteFloorPermanently(
		@Payload() dto: GetFloorDto,
	): Promise<{ success: boolean }> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		await this.floorsService.deleteFloorPermanently(dto.floorId, dto.tenantId);
		return { success: true };
	}
}
