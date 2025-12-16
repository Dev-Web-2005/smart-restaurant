import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FloorEntity } from 'src/common/entities/floor';
import { CreateFloorDto } from 'src/floors/dtos/request/create-floor.dto';
import { UpdateFloorDto } from 'src/floors/dtos/request/update-floor.dto';
import { GetFloorDto } from 'src/floors/dtos/request/get-floor.dto';
import { ListFloorsDto } from 'src/floors/dtos/request/list-floors.dto';
import { FloorDto } from 'src/floors/dtos/response/floor.dto';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { filterNullValues } from '@shared/utils/utils';
import { plainToInstance } from 'class-transformer';

/**
 * Service for managing restaurant floors
 * Implements CRUD operations with multi-tenancy support
 */
@Injectable()
export class FloorsService {
	constructor(
		@InjectRepository(FloorEntity)
		private readonly floorRepository: Repository<FloorEntity>,
	) {}

	/**
	 * Create a new floor for a tenant
	 * Validates uniqueness of floor name per tenant
	 */
	async createFloor(dto: CreateFloorDto): Promise<FloorDto> {
		// Check for duplicate floor name within same tenant
		const existingFloor = await this.floorRepository.findOne({
			where: {
				tenantId: dto.tenantId,
				name: dto.name,
			},
		});

		if (existingFloor) {
			throw new AppException(ErrorCode.FLOOR_ALREADY_EXISTS);
		}

		const floor = this.floorRepository.create({
			tenantId: dto.tenantId,
			name: dto.name,
			floorNumber: dto.floorNumber,
			gridWidth: dto.gridWidth || 10,
			gridHeight: dto.gridHeight || 10,
			description: dto.description,
			isActive: true,
		});

		const savedFloor = await this.floorRepository.save(floor);
		return plainToInstance(FloorDto, savedFloor, { excludeExtraneousValues: false });
	}

	/**
	 * Get a single floor by ID
	 * Enforces tenant isolation
	 */
	async getFloorById(dto: GetFloorDto): Promise<FloorDto> {
		const floor = await this.floorRepository.findOne({
			where: {
				id: dto.floorId,
				tenantId: dto.tenantId,
				isActive: true,
			},
		});

		if (!floor) {
			throw new AppException(ErrorCode.FLOOR_NOT_FOUND);
		}

		return plainToInstance(FloorDto, floor, { excludeExtraneousValues: false });
	}

	/**
	 * List all floors for a tenant with optional filters
	 */
	async listFloors(dto: ListFloorsDto): Promise<FloorDto[]> {
		const queryBuilder = this.floorRepository
			.createQueryBuilder('floor')
			.where('floor.tenantId = :tenantId', { tenantId: dto.tenantId });

		if (dto.isActive !== undefined && dto.isActive !== null) {
			queryBuilder.andWhere('floor.isActive = :isActive', { isActive: dto.isActive });
		} else {
			// default to only active floors
			queryBuilder.andWhere('floor.isActive = :isActive', { isActive: true });
		}

		queryBuilder.orderBy('floor.floorNumber', 'ASC');

		const floors = await queryBuilder.getMany();
		return floors.map((floor) =>
			plainToInstance(FloorDto, floor, { excludeExtraneousValues: false }),
		);
	}

	/**
	 * Update floor information
	 * Enforces tenant isolation and validates name uniqueness if changed
	 */
	async updateFloor(
		floorId: string,
		tenantId: string,
		dto: UpdateFloorDto,
	): Promise<FloorDto> {
		const floor = await this.floorRepository.findOne({
			where: {
				id: floorId,
				tenantId: tenantId,
			},
		});

		if (!floor) {
			throw new AppException(ErrorCode.FLOOR_NOT_FOUND);
		}

		// If name is being changed, check for duplicates
		if (dto.name && dto.name !== floor.name) {
			const existingFloor = await this.floorRepository.findOne({
				where: {
					tenantId: tenantId,
					name: dto.name,
				},
			});

			if (existingFloor) {
				throw new AppException(ErrorCode.FLOOR_ALREADY_EXISTS);
			}
		}

		// Update fields
		const updatedData = filterNullValues(dto);
		Object.assign(floor, updatedData);

		const updatedFloor = await this.floorRepository.save(floor);
		return plainToInstance(FloorDto, updatedFloor, { excludeExtraneousValues: false });
	}

	/**
	 * Delete a floor (soft delete by setting isActive = false)
	 * For hard delete, use deleteFloorPermanently
	 */
	async deleteFloor(dto: GetFloorDto): Promise<void> {
		const floor = await this.floorRepository.findOne({
			where: {
				id: dto.floorId,
				tenantId: dto.tenantId,
			},
		});

		if (!floor) {
			throw new AppException(ErrorCode.FLOOR_NOT_FOUND);
		}

		floor.isActive = false;
		await this.floorRepository.save(floor);
	}

	/**
	 * Permanently delete a floor from database
	 * USE WITH CAUTION - This is irreversible
	 */
	async deleteFloorPermanently(dto: GetFloorDto): Promise<void> {
		const result = await this.floorRepository.delete({
			id: dto.floorId,
			tenantId: dto.tenantId,
		});

		if (result.affected === 0) {
			throw new AppException(ErrorCode.FLOOR_NOT_FOUND);
		}
	}

	/**
	 * Get floor entity (internal use)
	 */
	async getFloorEntity(floorId: string, tenantId: string): Promise<FloorEntity> {
		const floor = await this.floorRepository.findOne({
			where: {
				id: floorId,
				tenantId: tenantId,
			},
		});

		if (!floor) {
			throw new AppException(ErrorCode.FLOOR_NOT_FOUND);
		}

		return floor;
	}
}
