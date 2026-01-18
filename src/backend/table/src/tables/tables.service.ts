import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableEntity } from 'src/common/entities/table';
import { CreateTableDto } from 'src/tables/dtos/request/create-table.dto';
import { UpdateTableDto } from 'src/tables/dtos/request/update-table.dto';
import { GetTableDto } from 'src/tables/dtos/request/get-table.dto';
import { ListTablesDto } from 'src/tables/dtos/request/list-tables.dto';
import { TableDto } from 'src/tables/dtos/response/table.dto';
import { TableStatus } from 'src/common/enums/table-status.enum';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';
import { filterNullValues } from '@shared/utils/utils';
import { plainToInstance } from 'class-transformer';

/**
 * Service for managing restaurant tables
 * Implements CRUD operations with multi-tenancy support
 */
@Injectable()
export class TablesService {
	constructor(
		@InjectRepository(TableEntity)
		private readonly tableRepository: Repository<TableEntity>,
	) {}

	/**
	 * Create a new table for a tenant
	 * Validates uniqueness of table name per tenant
	 */
	async createTable(dto: CreateTableDto): Promise<TableDto> {
		// Check for duplicate table name within same tenant
		const existingTable = await this.tableRepository.findOne({
			where: {
				tenantId: dto.tenantId,
				name: dto.name,
			},
		});

		if (existingTable) {
			throw new AppException(ErrorCode.TABLE_ALREADY_EXISTS);
		}

		const table = this.tableRepository.create({
			tenantId: dto.tenantId,
			name: dto.name,
			capacity: dto.capacity,
			status: dto.status || TableStatus.AVAILABLE,
			floorId: dto.floorId,
			gridX: dto.gridX,
			gridY: dto.gridY,
			isActive: true,
			tokenVersion: 1,
		});

		const savedTable = await this.tableRepository.save(table);
		return plainToInstance(TableDto, savedTable, { excludeExtraneousValues: false });
	}

	/**
	 * Get a single table by ID
	 * Enforces tenant isolation
	 * Supports including floor relationship via includeFloor option
	 */
	async getTableById(dto: GetTableDto): Promise<TableDto> {
		const queryBuilder = this.tableRepository
			.createQueryBuilder('table')
			.where('table.id = :tableId', { tableId: dto.tableId })
			.andWhere('table.tenantId = :tenantId', { tenantId: dto.tenantId })
			.andWhere('table.isActive = :isActive', { isActive: true });

		if (dto.includeFloor) {
			queryBuilder.leftJoinAndSelect('table.floor', 'floor');
		}

		const table = await queryBuilder.getOne();

		if (!table) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		return plainToInstance(TableDto, table, { excludeExtraneousValues: false });
	}

	/**
	 * List all tables for a tenant with optional filters
	 */
	async listTables(dto: ListTablesDto): Promise<TableDto[]> {
		const queryBuilder = this.tableRepository
			.createQueryBuilder('table')
			.where('table.tenantId = :tenantId', { tenantId: dto.tenantId });

		if (dto.isActive !== undefined && dto.isActive !== null) {
			queryBuilder.andWhere('table.isActive = :isActive', { isActive: dto.isActive });
		} else {
			// default to only active tables
			queryBuilder.andWhere('table.isActive = :isActive', { isActive: true });
		}

		if (dto.status) {
			queryBuilder.andWhere('table.status = :status', { status: dto.status });
		}

		if (dto.floorId) {
			queryBuilder.andWhere('table.floorId = :floorId', { floorId: dto.floorId });
		}

		if (dto.includeFloor) {
			queryBuilder.leftJoinAndSelect('table.floor', 'floor');
		}

		queryBuilder.orderBy('table.name', 'ASC');

		const tables = await queryBuilder.getMany();
		return tables.map((table) =>
			plainToInstance(TableDto, table, { excludeExtraneousValues: false }),
		);
	}

	/**
	 * Update table information
	 * Enforces tenant isolation and validates name uniqueness if changed
	 */
	async updateTable(
		tableId: string,
		tenantId: string,
		dto: UpdateTableDto,
	): Promise<TableDto> {
		const table = await this.tableRepository.findOne({
			where: {
				id: tableId,
				tenantId: tenantId,
			},
		});

		if (!table) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		// If name is being changed, check for duplicates
		if (dto.name && dto.name !== table.name) {
			const existingTable = await this.tableRepository.findOne({
				where: {
					tenantId: tenantId,
					name: dto.name,
				},
			});

			if (existingTable) {
				throw new AppException(ErrorCode.TABLE_ALREADY_EXISTS);
			}
		}

		// Update fields
		// if (dto.name !== undefined) table.name = dto.name;
		// if (dto.capacity !== undefined) table.capacity = dto.capacity;
		// if (dto.location !== undefined) table.location = dto.location;
		// if (dto.isActive !== undefined) table.isActive = dto.isActive;
		const updatedData = filterNullValues(dto);
		Object.assign(table, updatedData);

		const updatedTable = await this.tableRepository.save(table);
		return plainToInstance(TableDto, updatedTable, { excludeExtraneousValues: false });
	}

	/**
	 * Delete a table (soft delete by setting isActive = false)
	 * For hard delete, use deleteTablePermanently
	 */
	async deleteTable(dto: GetTableDto): Promise<void> {
		const table = await this.tableRepository.findOne({
			where: {
				id: dto.tableId,
				tenantId: dto.tenantId,
			},
		});

		if (!table) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		table.isActive = false;
		await this.tableRepository.save(table);
	}

	/**
	 * Permanently delete a table from database
	 * USE WITH CAUTION - This is irreversible
	 */
	async deleteTablePermanently(dto: GetTableDto): Promise<void> {
		const result = await this.tableRepository.delete({
			id: dto.tableId,
			tenantId: dto.tenantId,
		});

		if (result.affected === 0) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}
	}

	/**
	 * Increment token version to invalidate existing QR codes
	 * Called when regenerating QR code
	 * Also clears cached token to force regeneration
	 */
	async incrementTokenVersion(tableId: string, tenantId: string): Promise<TableEntity> {
		const table = await this.tableRepository.findOne({
			where: {
				id: tableId,
				tenantId: tenantId,
			},
		});

		if (!table) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		table.tokenVersion += 1;
		table.qrToken = null; // Clear cached token
		table.qrTokenGeneratedAt = null;
		return await this.tableRepository.save(table);
	}

	/**
	 * Save QR token to table (cache for reuse)
	 */
	async saveQrToken(
		tableId: string,
		tenantId: string,
		token: string,
	): Promise<TableEntity> {
		const table = await this.tableRepository.findOne({
			where: {
				id: tableId,
				tenantId: tenantId,
			},
		});

		if (!table) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		table.qrToken = token;
		table.qrTokenGeneratedAt = new Date();
		return await this.tableRepository.save(table);
	}

	/**
	 * Get table entity (internal use for QR service)
	 */
	async getTableEntity(tableId: string, tenantId: string): Promise<TableEntity> {
		const table = await this.tableRepository.findOne({
			where: {
				id: tableId,
				tenantId: tenantId,
			},
		});

		if (!table) {
			throw new AppException(ErrorCode.TABLE_NOT_FOUND);
		}

		return table;
	}
}
