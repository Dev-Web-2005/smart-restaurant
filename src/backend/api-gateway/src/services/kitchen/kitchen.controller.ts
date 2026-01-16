import {
	Controller,
	Get,
	Post,
	Patch,
	Param,
	Body,
	Query,
	Inject,
	UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';
import Role from 'src/common/guards/check-role/check-role.guard';

/**
 * Kitchen Controller - API Gateway
 *
 * Handles all kitchen-related REST API endpoints and proxies to Kitchen Service
 * Implements Kitchen Display System (KDS) operations
 *
 * Endpoints:
 * - GET    /tenants/:tenantId/kitchen/display - Get active kitchen display data
 * - GET    /tenants/:tenantId/kitchen/tickets - Get tickets (filtered/paginated)
 * - GET    /tenants/:tenantId/kitchen/tickets/:ticketId - Get ticket by ID
 * - POST   /tenants/:tenantId/kitchen/tickets/:ticketId/start - Start preparing ticket
 * - POST   /tenants/:tenantId/kitchen/tickets/:ticketId/items/start - Start preparing items
 * - POST   /tenants/:tenantId/kitchen/tickets/:ticketId/items/ready - Mark items ready
 * - POST   /tenants/:tenantId/kitchen/tickets/:ticketId/bump - Bump/complete ticket
 * - POST   /tenants/:tenantId/kitchen/tickets/:ticketId/items/recall - Recall items
 * - POST   /tenants/:tenantId/kitchen/tickets/:ticketId/items/cancel - Cancel items
 * - DELETE /tenants/:tenantId/kitchen/tickets/:ticketId - Cancel entire ticket
 * - PATCH  /tenants/:tenantId/kitchen/tickets/:ticketId/priority - Update priority
 * - PATCH  /tenants/:tenantId/kitchen/tickets/:ticketId/timer - Toggle timer
 * - GET    /tenants/:tenantId/kitchen/stats - Get kitchen statistics
 */
@Controller()
export class KitchenController {
	constructor(
		@Inject('KITCHEN_SERVICE') private readonly kitchenClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Get active kitchen display data
	 * GET /tenants/:tenantId/kitchen/display
	 *
	 * Optimized for KDS frontend polling
	 * Returns all active tickets with real-time timer data
	 */
	@Get('tenants/:tenantId/kitchen/display')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async getKitchenDisplay(@Param('tenantId') tenantId: string) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:get-display', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				tenantId,
			}),
		);
	}

	/**
	 * Get tickets with filtering and pagination
	 * GET /tenants/:tenantId/kitchen/tickets
	 *
	 * Query params:
	 * - page: number (default: 1)
	 * - limit: number (default: 20)
	 * - status: string (PENDING, IN_PROGRESS, READY, COMPLETED, CANCELLED)
	 * - priority: string (NORMAL, HIGH, URGENT, FIRE)
	 * - tableId: uuid
	 * - orderId: uuid
	 */
	@Get('tenants/:tenantId/kitchen/tickets')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async getTickets(
		@Param('tenantId') tenantId: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
		@Query('status') status?: string,
		@Query('priority') priority?: string,
		@Query('tableId') tableId?: string,
		@Query('orderId') orderId?: string,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:get-tickets', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				tenantId,
				page: page ? parseInt(page.toString(), 10) : 1,
				limit: limit ? parseInt(limit.toString(), 10) : 20,
				status,
				priority,
				tableId,
				orderId,
			}),
		);
	}

	/**
	 * Get ticket by ID
	 * GET /tenants/:tenantId/kitchen/tickets/:ticketId
	 */
	@Get('tenants/:tenantId/kitchen/tickets/:ticketId')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async getTicket(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:get-ticket', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				tenantId,
				ticketId,
			}),
		);
	}

	/**
	 * Start preparing a ticket
	 * POST /tenants/:tenantId/kitchen/tickets/:ticketId/start
	 *
	 * Changes ticket status from PENDING → IN_PROGRESS
	 * Calls Order Service to update item status to PREPARING
	 *
	 * Body:
	 * {
	 *   "cookId": "uuid",      // Optional: assign cook
	 *   "cookName": "John Doe" // Optional: cook name for display
	 * }
	 */
	@Post('tenants/:tenantId/kitchen/tickets/:ticketId/start')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async startTicket(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:start-ticket', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				ticketId,
				cookId: data.cookId,
				cookName: data.cookName,
			}),
		);
	}

	/**
	 * Start preparing specific items
	 * POST /tenants/:tenantId/kitchen/tickets/:ticketId/items/start
	 *
	 * Allows cooks to start individual items (for multi-station kitchens)
	 * Calls Order Service to update item status to PREPARING
	 *
	 * Body:
	 * {
	 *   "itemIds": ["uuid1", "uuid2"]
	 * }
	 */
	@Post('tenants/:tenantId/kitchen/tickets/:ticketId/items/start')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async startItems(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:start-items', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				ticketId,
				itemIds: data.itemIds,
			}),
		);
	}

	/**
	 * Mark items as ready
	 * POST /tenants/:tenantId/kitchen/tickets/:ticketId/items/ready
	 *
	 * Called when cook finishes preparing items
	 * Calls Order Service to update item status to READY
	 *
	 * Body:
	 * {
	 *   "itemIds": ["uuid1", "uuid2"]
	 * }
	 */
	@Post('tenants/:tenantId/kitchen/tickets/:ticketId/items/ready')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async markItemsReady(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:mark-items-ready', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				ticketId,
				itemIds: data.itemIds,
			}),
		);
	}

	/**
	 * Bump (complete) a ticket
	 * POST /tenants/:tenantId/kitchen/tickets/:ticketId/bump
	 *
	 * Called when waiter picks up food or expo confirms all items served
	 * Marks ticket as COMPLETED and stops timer
	 *
	 * Body: {} (empty)
	 */
	@Post('tenants/:tenantId/kitchen/tickets/:ticketId/bump')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async bumpTicket(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:bump-ticket', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				tenantId,
				ticketId,
			}),
		);
	}

	/**
	 * Recall items (need to remake)
	 * POST /tenants/:tenantId/kitchen/tickets/:ticketId/items/recall
	 *
	 * Used when items need to be remade (wrong order, quality issue, etc.)
	 * Creates new display tracking for remade items
	 *
	 * Body:
	 * {
	 *   "itemIds": ["uuid1", "uuid2"],
	 *   "reason": "Customer requested modification"
	 * }
	 */
	@Post('tenants/:tenantId/kitchen/tickets/:ticketId/items/recall')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async recallItems(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:recall-items', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				tenantId,
				ticketId,
				itemIds: data.itemIds,
				reason: data.reason,
			}),
		);
	}

	/**
	 * Cancel specific items
	 * POST /tenants/:tenantId/kitchen/tickets/:ticketId/items/cancel
	 *
	 * Calls Order Service to update item status to CANCELLED
	 *
	 * Body:
	 * {
	 *   "itemIds": ["uuid1", "uuid2"],
	 *   "reason": "Ingredient unavailable"
	 * }
	 */
	@Post('tenants/:tenantId/kitchen/tickets/:ticketId/items/cancel')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async cancelItems(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:cancel-items', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				ticketId,
				itemIds: data.itemIds,
				reason: data.reason,
			}),
		);
	}

	/**
	 * Cancel entire ticket
	 * DELETE /tenants/:tenantId/kitchen/tickets/:ticketId
	 *
	 * Cancels all items in the ticket
	 * Calls Order Service to update all item statuses to CANCELLED
	 *
	 * Query params:
	 * - reason: string (cancellation reason)
	 */
	@Patch('tenants/:tenantId/kitchen/tickets/:ticketId/cancel')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async cancelTicket(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:cancel-ticket', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				orderApiKey: this.configService.get<string>('ORDER_API_KEY'),
				tenantId,
				ticketId,
				reason: data.reason,
			}),
		);
	}

	/**
	 * Update ticket priority
	 * PATCH /tenants/:tenantId/kitchen/tickets/:ticketId/priority
	 *
	 * Used by expediter/manager to prioritize orders
	 *
	 * Body:
	 * {
	 *   "priority": "URGENT"  // NORMAL | HIGH | URGENT | FIRE
	 * }
	 */
	@Patch('tenants/:tenantId/kitchen/tickets/:ticketId/priority')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async updatePriority(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:update-priority', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				tenantId,
				ticketId,
				priority: data.priority,
			}),
		);
	}

	/**
	 * Toggle ticket timer (pause/resume)
	 * PATCH /tenants/:tenantId/kitchen/tickets/:ticketId/timer
	 *
	 * Used when waiting for customer (pause) or resuming preparation
	 *
	 * Body:
	 * {
	 *   "action": "pause"  // "pause" | "resume"
	 * }
	 */
	@Patch('tenants/:tenantId/kitchen/tickets/:ticketId/timer')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async toggleTimer(
		@Param('tenantId') tenantId: string,
		@Param('ticketId') ticketId: string,
		@Body() data: any,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:toggle-timer', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				tenantId,
				ticketId,
				pause: data.action === 'pause',
			}),
		);
	}

	/**
	 * Get kitchen statistics
	 * GET /tenants/:tenantId/kitchen/stats
	 *
	 * Query params:
	 * - startDate: ISO date string (default: today 00:00)
	 * - endDate: ISO date string (default: now)
	 */
	@Get('tenants/:tenantId/kitchen/stats')
	@UseGuards(AuthGuard, Role('USER', 'CHEF'))
	async getStats(
		@Param('tenantId') tenantId: string,
		@Query('startDate') startDate?: string,
		@Query('endDate') endDate?: string,
	) {
		return firstValueFrom(
			this.kitchenClient.send('kitchen:get-stats', {
				kitchenApiKey: this.configService.get<string>('KITCHEN_API_KEY'),
				tenantId,
				startDate: startDate ? new Date(startDate) : undefined,
				endDate: endDate ? new Date(endDate) : undefined,
			}),
		);
	}
}
