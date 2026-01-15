import { Controller, Logger } from '@nestjs/common';
import {
	MessagePattern,
	EventPattern,
	Payload,
	Ctx,
	RmqContext,
} from '@nestjs/microservices';
import { KitchenService } from './kitchen.service';
import HttpResponse from '@shared/utils/http-response';
import { handleRpcCall } from '@shared/utils/rpc-error-handler';
import {
	PrepareItemsEventDto,
	GetTicketsRequestDto,
	GetTicketRequestDto,
	StartTicketRequestDto,
	StartItemsRequestDto,
	MarkItemsReadyRequestDto,
	BumpTicketRequestDto,
	RecallItemsRequestDto,
	CancelItemsRequestDto,
	CancelTicketRequestDto,
	UpdatePriorityRequestDto,
	ToggleTimerRequestDto,
	GetKitchenStatsRequestDto,
} from './dtos/request';

/**
 * KitchenController
 *
 * Handles RPC messages and events for Kitchen Display System (KDS)
 *
 * BEST PRACTICE ARCHITECTURE (Toast POS, Square KDS, Oracle MICROS):
 * - Receives items from Order Service when waiter accepts
 * - Manages ticket lifecycle: PENDING → IN_PROGRESS → READY → COMPLETED
 * - Real-time timer tracking for preparation times
 * - Bump screen workflow for completing tickets
 *
 * Event Patterns (Fire-and-forget from other services):
 * - kitchen.prepare_items: Receive accepted items from Order Service
 *
 * Message Patterns (Request-response for KDS frontend):
 * - kitchen:get-display: Get active kitchen display data
 * - kitchen:get-tickets: Get tickets with filtering/pagination
 * - kitchen:get-ticket: Get single ticket details
 * - kitchen:start-ticket: Start preparing a ticket
 * - kitchen:start-items: Start preparing specific items
 * - kitchen:mark-items-ready: Mark items as ready
 * - kitchen:bump-ticket: Complete/bump a ticket
 * - kitchen:recall-items: Recall items for remake
 * - kitchen:cancel-items: Cancel specific items
 * - kitchen:cancel-ticket: Cancel entire ticket
 * - kitchen:update-priority: Change ticket priority (Fire/Urgent)
 * - kitchen:toggle-timer: Pause/resume ticket timer
 * - kitchen:get-stats: Get kitchen statistics
 */
@Controller()
export class KitchenController {
	private readonly logger = new Logger(KitchenController.name);

	constructor(private readonly kitchenService: KitchenService) {}

	// ==================== EVENT HANDLERS ====================

	/**
	 * EVENT: Receive items to prepare from Order Service
	 *
	 * Triggered when waiter accepts order items
	 * Creates a new kitchen ticket with the items
	 *
	 * Flow: Order Service → RabbitMQ → Kitchen Service
	 */
	@EventPattern('kitchen.prepare_items')
	async handlePrepareItems(
		@Payload() data: PrepareItemsEventDto,
		@Ctx() context: RmqContext,
	) {
		const channel = context.getChannelRef();
		const message = context.getMessage();

		this.logger.log(
			`🍳 [EVENT] Received kitchen.prepare_items for order ${data.orderId}`,
		);

		try {
			const result = await this.kitchenService.handlePrepareItems(data);

			this.logger.log(
				`✅ [EVENT] Created ticket ${result.ticketNumber} with ${result.items.length} items`,
			);

			channel.ack(message);
		} catch (error) {
			this.logger.error(
				`❌ [EVENT] Failed to create ticket: ${error.message}`,
				error.stack,
			);

			// Get retry count
			const xDeath = message.properties.headers?.['x-death'];
			const retryCount = xDeath ? xDeath[0].count : 0;
			const maxRetries = parseInt(process.env.LIMIT_REQUEUE || '10', 10);

			if (retryCount >= maxRetries) {
				this.logger.error(`[EVENT] Max retries reached. Sending to DLQ.`);
				channel.ack(message);
			} else {
				this.logger.warn(`[EVENT] Retry ${retryCount + 1}/${maxRetries}`);
				channel.nack(message, false, false);
			}
		}
	}

	// ==================== QUERY ENDPOINTS ====================

	/**
	 * Get active kitchen display data
	 * Optimized for KDS frontend polling
	 *
	 * RPC Pattern: 'kitchen:get-display'
	 */
	@MessagePattern('kitchen:get-display')
	async getKitchenDisplay(dto: { kitchenApiKey: string; tenantId: string }) {
		return handleRpcCall(async () => {
			const display = await this.kitchenService.getKitchenDisplay(dto);
			return new HttpResponse(1000, 'Kitchen display retrieved', display);
		});
	}

	/**
	 * Get tickets with filtering and pagination
	 *
	 * RPC Pattern: 'kitchen:get-tickets'
	 */
	@MessagePattern('kitchen:get-tickets')
	async getTickets(dto: GetTicketsRequestDto) {
		return handleRpcCall(async () => {
			const result = await this.kitchenService.getTickets(dto);
			return new HttpResponse(1000, 'Tickets retrieved', result);
		});
	}

	/**
	 * Get single ticket by ID
	 *
	 * RPC Pattern: 'kitchen:get-ticket'
	 */
	@MessagePattern('kitchen:get-ticket')
	async getTicket(dto: GetTicketRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.getTicket(dto);
			return new HttpResponse(1000, 'Ticket retrieved', ticket);
		});
	}

	// ==================== TICKET OPERATIONS ====================

	/**
	 * Start preparing a ticket (PENDING → IN_PROGRESS)
	 *
	 * RPC Pattern: 'kitchen:start-ticket'
	 */
	@MessagePattern('kitchen:start-ticket')
	async startTicket(dto: StartTicketRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.startTicket(dto);
			return new HttpResponse(1000, `Ticket ${ticket.ticketNumber} started`, ticket);
		});
	}

	/**
	 * Start preparing specific items
	 *
	 * RPC Pattern: 'kitchen:start-items'
	 */
	@MessagePattern('kitchen:start-items')
	async startItems(dto: StartItemsRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.startItems(dto);
			return new HttpResponse(1000, 'Items started', ticket);
		});
	}

	/**
	 * Mark items as ready
	 *
	 * RPC Pattern: 'kitchen:mark-items-ready'
	 */
	@MessagePattern('kitchen:mark-items-ready')
	async markItemsReady(dto: MarkItemsReadyRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.markItemsReady(dto);
			return new HttpResponse(1000, 'Items marked ready', ticket);
		});
	}

	/**
	 * Bump (complete) a ticket
	 *
	 * RPC Pattern: 'kitchen:bump-ticket'
	 */
	@MessagePattern('kitchen:bump-ticket')
	async bumpTicket(dto: BumpTicketRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.bumpTicket(dto);
			return new HttpResponse(1000, `Ticket ${ticket.ticketNumber} bumped`, ticket);
		});
	}

	/**
	 * Recall items (need to remake)
	 *
	 * RPC Pattern: 'kitchen:recall-items'
	 */
	@MessagePattern('kitchen:recall-items')
	async recallItems(dto: RecallItemsRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.recallItems(dto);
			return new HttpResponse(1000, 'Items recalled', ticket);
		});
	}

	/**
	 * Cancel specific items
	 *
	 * RPC Pattern: 'kitchen:cancel-items'
	 */
	@MessagePattern('kitchen:cancel-items')
	async cancelItems(dto: CancelItemsRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.cancelItems(dto);
			return new HttpResponse(1000, 'Items cancelled', ticket);
		});
	}

	/**
	 * Cancel entire ticket
	 *
	 * RPC Pattern: 'kitchen:cancel-ticket'
	 */
	@MessagePattern('kitchen:cancel-ticket')
	async cancelTicket(dto: CancelTicketRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.cancelTicket(dto);
			return new HttpResponse(1000, `Ticket ${ticket.ticketNumber} cancelled`, ticket);
		});
	}

	/**
	 * Update ticket priority
	 *
	 * RPC Pattern: 'kitchen:update-priority'
	 */
	@MessagePattern('kitchen:update-priority')
	async updatePriority(dto: UpdatePriorityRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.updatePriority(dto);
			return new HttpResponse(
				1000,
				`Ticket ${ticket.ticketNumber} priority updated to ${ticket.priority}`,
				ticket,
			);
		});
	}

	/**
	 * Toggle ticket timer (pause/resume)
	 *
	 * RPC Pattern: 'kitchen:toggle-timer'
	 */
	@MessagePattern('kitchen:toggle-timer')
	async toggleTimer(dto: ToggleTimerRequestDto) {
		return handleRpcCall(async () => {
			const ticket = await this.kitchenService.toggleTimer(dto);
			return new HttpResponse(
				1000,
				`Ticket ${ticket.ticketNumber} timer ${dto.pause ? 'paused' : 'resumed'}`,
				ticket,
			);
		});
	}

	// ==================== STATISTICS ====================

	/**
	 * Get kitchen statistics
	 *
	 * RPC Pattern: 'kitchen:get-stats'
	 */
	@MessagePattern('kitchen:get-stats')
	async getStats(dto: GetKitchenStatsRequestDto) {
		return handleRpcCall(async () => {
			const stats = await this.kitchenService.getStats(dto);
			return new HttpResponse(1000, 'Kitchen statistics retrieved', stats);
		});
	}
}
