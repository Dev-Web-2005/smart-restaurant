import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TablesService } from 'src/tables/tables.service';
import { CreateTableDto } from 'src/tables/dtos/request/create-table.dto';
import { UpdateTableDto } from 'src/tables/dtos/request/update-table.dto';
import { GetTableDto } from 'src/tables/dtos/request/get-table.dto';
import { ListTablesDto } from 'src/tables/dtos/request/list-tables.dto';
import { TableDto } from 'src/tables/dtos/response/table.dto';
import { ConfigService } from '@nestjs/config/dist/config.service';
import AppException from '@shared/exceptions/app-exception';
import ErrorCode from '@shared/exceptions/error-code';

/**
 * Controller for table management operations
 * Exposes TCP message patterns for microservice communication
 */
@Controller()
export class TablesController {
	constructor(
		private readonly tablesService: TablesService,
		private readonly config: ConfigService,
	) {}

	/**
	 * Create a new table
	 * Pattern: tables:create
	 */
	@MessagePattern('tables:create')
	async createTable(@Payload() dto: CreateTableDto): Promise<TableDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.tablesService.createTable(dto);
	}

	/**
	 * Get a single table by ID
	 * Pattern: tables:get-by-id
	 */
	@MessagePattern('tables:get-by-id')
	async getTableById(@Payload() dto: GetTableDto): Promise<TableDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.tablesService.getTableById(dto.tableId, dto.tenantId);
	}

	/**
	 * List all tables for a tenant
	 * Pattern: tables:list
	 */
	@MessagePattern('tables:list')
	async listTables(@Payload() dto: ListTablesDto): Promise<TableDto[]> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.tablesService.listTables(dto.tenantId, dto.isActive, dto.location);
	}

	/**
	 * Update a table
	 * Pattern: tables:update
	 */
	@MessagePattern('tables:update')
	async updateTable(
		@Payload() payload: { tableId: string; tenantId: string; data: UpdateTableDto },
	): Promise<TableDto> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (payload.data.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		return await this.tablesService.updateTable(
			payload.tableId,
			payload.tenantId,
			payload.data,
		);
	}

	/**
	 * Soft delete a table (set isActive = false)
	 * Pattern: tables:delete
	 */
	@MessagePattern('tables:delete')
	async deleteTable(@Payload() dto: GetTableDto): Promise<{ success: boolean }> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		await this.tablesService.deleteTable(dto.tableId, dto.tenantId);
		return { success: true };
	}

	/**
	 * Permanently delete a table
	 * Pattern: tables:delete-permanent
	 */
	@MessagePattern('tables:delete-permanent')
	async deleteTablePermanently(
		@Payload() dto: GetTableDto,
	): Promise<{ success: boolean }> {
		const expectedApiKey = this.config.get<string>('TABLE_API_KEY');
		if (dto.tableApiKey !== expectedApiKey) {
			throw new AppException(ErrorCode.UNAUTHORIZED);
		}

		await this.tablesService.deleteTablePermanently(dto.tableId, dto.tenantId);
		return { success: true };
	}
}
