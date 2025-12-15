import { ConfigService } from '@nestjs/config';
import {
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';

@Controller()
export class FloorController {
	constructor(
		@Inject('TABLE_SERVICE') private readonly tableClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Create a new floor
	 * POST /tenants/:tenantId/floors
	 */
	@UseGuards(AuthGuard)
	@Post('/tenants/:tenantId/floors')
	createFloor(@Param('tenantId') tenantId: string, @Body() data: any) {
		return this.tableClient.send('floors:create', {
			...data,
			tenantId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	/**
	 * List all floors for a tenant
	 * GET /tenants/:tenantId/floors
	 */
	@UseGuards(AuthGuard)
	@Get('/tenants/:tenantId/floors')
	listFloors(@Param('tenantId') tenantId: string, @Query('isActive') isActive?: string) {
		const payload: any = {
			tenantId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		};
		if (isActive !== undefined) {
			payload.isActive = isActive === 'true';
		}
		return this.tableClient.send('floors:list', payload);
	}

	/**
	 * Get a single floor by ID
	 * GET /tenants/:tenantId/floors/:floorId
	 */
	@UseGuards(AuthGuard)
	@Get('/tenants/:tenantId/floors/:floorId')
	getFloorById(@Param('tenantId') tenantId: string, @Param('floorId') floorId: string) {
		return this.tableClient.send('floors:get-by-id', {
			tenantId,
			floorId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}

	/**
	 * Update a floor
	 * PATCH /tenants/:tenantId/floors/:floorId
	 */
	@UseGuards(AuthGuard)
	@Patch('/tenants/:tenantId/floors/:floorId')
	updateFloor(
		@Param('tenantId') tenantId: string,
		@Param('floorId') floorId: string,
		@Body() data: any,
	) {
		return this.tableClient.send('floors:update', {
			tenantId,
			floorId,
			data: {
				...data,
				tableApiKey: this.configService.get('TABLE_API_KEY'),
			},
		});
	}

	/**
	 * Soft delete a floor
	 * DELETE /tenants/:tenantId/floors/:floorId
	 */
	@UseGuards(AuthGuard)
	@Delete('/tenants/:tenantId/floors/:floorId')
	deleteFloor(@Param('tenantId') tenantId: string, @Param('floorId') floorId: string) {
		return this.tableClient.send('floors:delete', {
			floorId,
			tenantId,
			tableApiKey: this.configService.get('TABLE_API_KEY'),
		});
	}
}
