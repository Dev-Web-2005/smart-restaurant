import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	Inject,
	UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from 'src/common/guards/get-role/auth.guard';
import Role from 'src/common/guards/check-role/check-role.guard';

/**
 * Waiter Controller - API Gateway
 *
 * Handles all waiter notification-related REST API endpoints
 * Proxies to Waiter Service (RabbitMQ microservice)
 * Implements multi-tenant isolation and authentication
 *
 * PURE ALERT LAYER - Architecture:
 * - Notifications are alerts only (UNREAD, READ, ARCHIVED)
 * - Business actions (accept/reject items) go through Order Controller
 * - Follows Toast POS, Square Restaurant pattern
 *
 * Endpoints:
 * - GET  /tenants/:tenantId/waiter/notifications - Get pending notifications
 * - POST /tenants/:tenantId/waiter/notifications/:notificationId/read - Mark as read
 * - POST /tenants/:tenantId/waiter/notifications/:notificationId/archive - Archive notification
 */
@Controller()
export class WaiterController {
	constructor(
		@Inject('WAITER_SERVICE') private readonly waiterClient: ClientProxy,
		private readonly configService: ConfigService,
	) {}

	/**
	 * Get pending notifications for waiter dashboard
	 * GET /tenants/:tenantId/waiter/notifications
	 *
	 * Query params:
	 * - waiterId: uuid (optional - filter by specific waiter)
	 * - tableId: string (optional - filter by specific table)
	 * - page: number (default: 1)
	 * - limit: number (default: 10)
	 *
	 * Returns:
	 * {
	 *   "notifications": [...],
	 *   "total": 100,
	 *   "page": 1,
	 *   "limit": 10,
	 *   "totalPages": 10
	 * }
	 */
	@Get('tenants/:tenantId/waiter/notifications')
	@UseGuards(AuthGuard, Role('USER'))
	getPendingNotifications(
		@Param('tenantId') tenantId: string,
		@Query('waiterId') waiterId?: string,
		@Query('tableId') tableId?: string,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
	) {
		return this.waiterClient.send('waiter.get_pending_notifications', {
			tenantId,
			waiterId,
			tableId,
			page: page || 1,
			limit: limit || 10,
			waiterApiKey: this.configService.get('WAITER_API_KEY'),
		});
	}

	/**
	 * Mark notification as read
	 * POST /tenants/:tenantId/waiter/notifications/:notificationId/read
	 *
	 * Body:
	 * {
	 *   "waiterId": "uuid"
	 * }
	 *
	 * Updates notification status from UNREAD → READ
	 * Records readAt timestamp
	 */
	@Post('tenants/:tenantId/waiter/notifications/:notificationId/read')
	@UseGuards(AuthGuard, Role('USER'))
	markNotificationRead(
		@Param('tenantId') tenantId: string,
		@Param('notificationId') notificationId: string,
		@Body() data: any,
	) {
		return this.waiterClient.send('waiter.mark_read', {
			notificationId,
			waiterId: data.waiterId,
			waiterApiKey: this.configService.get('WAITER_API_KEY'),
		});
	}

	/**
	 * Archive notification
	 * POST /tenants/:tenantId/waiter/notifications/:notificationId/archive
	 *
	 * Used when:
	 * - Waiter dismisses notification
	 * - Order completed
	 * - Notification no longer relevant
	 *
	 * Updates notification status → ARCHIVED
	 * Removes from pending notifications list
	 */
	@Post('tenants/:tenantId/waiter/notifications/:notificationId/archive')
	@UseGuards(AuthGuard, Role('USER'))
	archiveNotification(
		@Param('tenantId') tenantId: string,
		@Param('notificationId') notificationId: string,
	) {
		return this.waiterClient.send('waiter.archive', {
			notificationId,
			waiterApiKey: this.configService.get('WAITER_API_KEY'),
		});
	}
}
