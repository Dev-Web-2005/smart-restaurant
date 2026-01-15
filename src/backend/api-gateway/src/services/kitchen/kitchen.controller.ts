import {
	Controller,
	Get,
	Post,
	Body,
	Query,
	Inject,
	Req,
	UseGuards,
	Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';
import Role from 'src/common/guards/check-role/check-role.guard';

/**
 * Kitchen Controller (API Gateway)
 *
 * Handles HTTP requests for Kitchen Display System
 * Forwards requests to Kitchen Service via TCP
 *
 * Authentication:
 * - Requires JWT authentication
 * - Only CHEF role can access (kitchen staff)
 *
 * Endpoints:
 * GET  /kitchen/items        - Get items for KDS display
 * GET  /kitchen/stats        - Get kitchen statistics
 * POST /kitchen/start        - Start preparing an item
 * POST /kitchen/ready        - Mark item as ready
 * POST /kitchen/batch-start  - Batch start preparing
 * POST /kitchen/batch-ready  - Batch mark ready
 * GET  /kitchen/history      - Get preparation history
 */
@Controller('kitchen')
export class KitchenController {
	private readonly logger = new Logger(KitchenController.name);

	constructor(
		@Inject('KITCHEN_SERVICE') private readonly kitchenClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Get kitchen items for KDS display
	 *
	 * Query params:
	 * - status: PENDING | PREPARING | READY (optional)
	 * - page: number (default: 1)
	 * - limit: number (default: 50)
	 */
	@Get('items')
	@UseGuards(AuthGuard, Role('CHEF', 'USER'))
	async getKitchenItems(@Query() query: any, @Req() req: any) {
		const tenantId = req.user.tenantId;
		const kitchenApiKey = this.configService.get<string>('KITCHEN_API_KEY');

		this.logger.log(`[GET /kitchen/items] tenantId: ${tenantId}`);

		const result = await firstValueFrom(
			this.kitchenClient.send('kitchen:get-items', {
				kitchenApiKey,
				tenantId,
				status: query.status,
				page: query.page ? parseInt(query.page) : 1,
				limit: query.limit ? parseInt(query.limit) : 50,
			}),
		);

		return result;
	}

	/**
	 * Get kitchen statistics for dashboard
	 */
	@Get('stats')
	@UseGuards(AuthGuard, Role('CHEF', 'USER'))
	async getKitchenStats(@Req() req: any) {
		const tenantId = req.user.tenantId;
		const kitchenApiKey = this.configService.get<string>('KITCHEN_API_KEY');

		this.logger.log(`[GET /kitchen/stats] tenantId: ${tenantId}`);

		const result = await firstValueFrom(
			this.kitchenClient.send('kitchen:get-stats', {
				kitchenApiKey,
				tenantId,
			}),
		);

		return result;
	}

	/**
	 * Start preparing an item
	 *
	 * Body:
	 * - kitchenItemId: string (required)
	 */
	@Post('start')
	@UseGuards(AuthGuard, Role('CHEF', 'USER'))
	async startPreparing(@Body() body: any, @Req() req: any) {
		const tenantId = req.user.tenantId;
		const chefId = req.user.userId;
		const kitchenApiKey = this.configService.get<string>('KITCHEN_API_KEY');

		this.logger.log(`[POST /kitchen/start] item: ${body.kitchenItemId}, chef: ${chefId}`);

		const result = await firstValueFrom(
			this.kitchenClient.send('kitchen:start-preparing', {
				kitchenApiKey,
				tenantId,
				kitchenItemId: body.kitchenItemId,
				chefId,
			}),
		);

		return result;
	}

	/**
	 * Mark item as ready
	 *
	 * Body:
	 * - kitchenItemId: string (required)
	 */
	@Post('ready')
	@UseGuards(AuthGuard, Role('CHEF', 'USER'))
	async markReady(@Body() body: any, @Req() req: any) {
		const tenantId = req.user.tenantId;
		const chefId = req.user.userId;
		const kitchenApiKey = this.configService.get<string>('KITCHEN_API_KEY');

		this.logger.log(`[POST /kitchen/ready] item: ${body.kitchenItemId}, chef: ${chefId}`);

		const result = await firstValueFrom(
			this.kitchenClient.send('kitchen:mark-ready', {
				kitchenApiKey,
				tenantId,
				kitchenItemId: body.kitchenItemId,
				chefId,
			}),
		);

		return result;
	}

	/**
	 * Batch start preparing items
	 *
	 * Body:
	 * - kitchenItemIds: string[] (required)
	 */
	@Post('batch-start')
	@UseGuards(AuthGuard, Role('CHEF', 'USER'))
	async batchStartPreparing(@Body() body: any, @Req() req: any) {
		const tenantId = req.user.tenantId;
		const chefId = req.user.userId;
		const kitchenApiKey = this.configService.get<string>('KITCHEN_API_KEY');

		this.logger.log(
			`[POST /kitchen/batch-start] items: ${body.kitchenItemIds?.length}, chef: ${chefId}`,
		);

		const result = await firstValueFrom(
			this.kitchenClient.send('kitchen:batch-start-preparing', {
				kitchenApiKey,
				tenantId,
				kitchenItemIds: body.kitchenItemIds,
				chefId,
			}),
		);

		return result;
	}

	/**
	 * Batch mark items as ready
	 *
	 * Body:
	 * - kitchenItemIds: string[] (required)
	 */
	@Post('batch-ready')
	@UseGuards(AuthGuard, Role('CHEF', 'USER'))
	async batchMarkReady(@Body() body: any, @Req() req: any) {
		const tenantId = req.user.tenantId;
		const chefId = req.user.userId;
		const kitchenApiKey = this.configService.get<string>('KITCHEN_API_KEY');

		this.logger.log(
			`[POST /kitchen/batch-ready] items: ${body.kitchenItemIds?.length}, chef: ${chefId}`,
		);

		const result = await firstValueFrom(
			this.kitchenClient.send('kitchen:batch-mark-ready', {
				kitchenApiKey,
				tenantId,
				kitchenItemIds: body.kitchenItemIds,
				chefId,
			}),
		);

		return result;
	}

	/**
	 * Get preparation history
	 *
	 * Query params:
	 * - startDate: ISO date string (optional)
	 * - endDate: ISO date string (optional)
	 * - page: number (default: 1)
	 * - limit: number (default: 50)
	 */
	@Get('history')
	@UseGuards(AuthGuard, Role('CHEF', 'USER'))
	async getHistory(@Query() query: any, @Req() req: any) {
		const tenantId = req.user.tenantId;
		const kitchenApiKey = this.configService.get<string>('KITCHEN_API_KEY');

		this.logger.log(`[GET /kitchen/history] tenantId: ${tenantId}`);

		const result = await firstValueFrom(
			this.kitchenClient.send('kitchen:get-history', {
				kitchenApiKey,
				tenantId,
				startDate: query.startDate,
				endDate: query.endDate,
				page: query.page ? parseInt(query.page) : 1,
				limit: query.limit ? parseInt(query.limit) : 50,
			}),
		);

		return result;
	}
}
