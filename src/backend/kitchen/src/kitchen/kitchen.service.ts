import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
	Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, MoreThan } from 'typeorm';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import * as amqp from 'amqplib';

import { KitchenTicket, KitchenTicketItem } from '../common/entities';
import {
	KitchenTicketStatus,
	KitchenTicketStatusLabels,
	KitchenTicketStatusFromString,
} from '../common/enums/ticket-status.enum';
import {
	KitchenTicketItemStatus,
	KitchenTicketItemStatusLabels,
} from '../common/enums/ticket-item-status.enum';
import {
	KitchenTicketPriority,
	KitchenTicketPriorityLabels,
} from '../common/enums/ticket-priority.enum';
import { KitchenStationType } from '../common/enums/station-type.enum';

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
import {
	KitchenTicketResponseDto,
	KitchenTicketItemResponseDto,
	PaginatedTicketsResponseDto,
	KitchenStatsResponseDto,
	KitchenDisplayResponseDto,
} from './dtos/response';

import ErrorCode from '@shared/exceptions/error-code';

/**
 * KitchenService
 *
 * THIN KITCHEN LAYER - Display Enrichment Service
 *
 * ARCHITECTURE PRINCIPLE:
 * Order Service is the SINGLE SOURCE OF TRUTH for item status.
 * Kitchen Service only manages display-related data:
 * - Timers (elapsed time tracking)
 * - Priority (expediting workflow)
 * - Station assignments (routing items to stations)
 * - Ticket grouping (visual organization for KDS)
 *
 * KEY FLOWS:
 * 1. Order.items.accepted → Kitchen creates display tracking record
 * 2. Cook starts → Kitchen calls Order Service RPC → Order broadcasts order.items.preparing
 * 3. Cook ready → Kitchen calls Order Service RPC → Order broadcasts order.items.ready
 * 4. All apps receive the same order.items.* events (single source of truth)
 *
 * WHAT KITCHEN OWNS:
 * - KitchenTicket: Display grouping, timers, priority
 * - Elapsed time tracking with color thresholds
 * - Statistics and KPI tracking
 *
 * WHAT KITCHEN DOES NOT OWN:
 * - Item status (PENDING, PREPARING, READY) - owned by Order Service
 * - Broadcasting item status changes - done by Order Service
 */
@Injectable()
export class KitchenService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(KitchenService.name);
	private amqpConnection: amqp.ChannelModel;
	private amqpChannel: amqp.Channel;
	private ticketTimerInterval: NodeJS.Timeout;
	private dailyTicketCounter: number = 0;
	private lastTicketDate: string = '';

	// Default thresholds (can be overridden per tenant)
	private readonly DEFAULT_WARNING_THRESHOLD = 600; // 10 minutes
	private readonly DEFAULT_CRITICAL_THRESHOLD = 900; // 15 minutes
	private readonly TIMER_UPDATE_INTERVAL = 1000; // 1 second

	constructor(
		@InjectRepository(KitchenTicket)
		private readonly ticketRepository: Repository<KitchenTicket>,
		@InjectRepository(KitchenTicketItem)
		private readonly ticketItemRepository: Repository<KitchenTicketItem>,
		private readonly configService: ConfigService,
		@Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
		@Inject('TABLE_SERVICE') private readonly tableClient: ClientProxy,
	) {}

	/**
	 * Module initialization - start timer and RabbitMQ
	 */
	async onModuleInit() {
		await this.initializeRabbitMQ();
		this.startTicketTimers();
		this.logger.log('✅ KitchenService initialized (Thin Kitchen Layer)');
	}

	/**
	 * Module destruction - cleanup
	 */
	async onModuleDestroy() {
		this.stopTicketTimers();
		await this.cleanupRabbitMQ();
		this.logger.log('✅ KitchenService destroyed');
	}

	/**
	 * Initialize RabbitMQ connection (only for timer broadcasts)
	 */
	private async initializeRabbitMQ() {
		try {
			const amqpUrl = this.configService.get<string>('CONNECTION_AMQP');
			this.amqpConnection = await amqp.connect(amqpUrl);
			this.amqpChannel = await this.amqpConnection.createChannel();
			this.logger.log('✅ RabbitMQ channel initialized for timer broadcasts');
		} catch (error) {
			this.logger.error(`❌ Failed to initialize RabbitMQ: ${error.message}`);
		}
	}

	/**
	 * Cleanup RabbitMQ connection
	 */
	private async cleanupRabbitMQ() {
		try {
			if (this.amqpChannel) await this.amqpChannel.close();
			if (this.amqpConnection) await this.amqpConnection.close();
		} catch (error) {
			this.logger.error(`❌ Error closing RabbitMQ: ${error.message}`);
		}
	}

	/**
	 * Publish event to RabbitMQ exchange (only for kitchen.timers.update)
	 */
	private async publishToExchange(
		exchangeName: string,
		eventPattern: string,
		payload: any,
	): Promise<void> {
		try {
			if (!this.amqpChannel) await this.initializeRabbitMQ();

			const nestJsMessage = {
				pattern: eventPattern,
				data: payload,
			};

			const message = Buffer.from(JSON.stringify(nestJsMessage));
			this.amqpChannel.publish(exchangeName, '', message, {
				persistent: true,
				contentType: 'application/json',
				headers: { pattern: eventPattern },
			});

			// Only log for non-timer events to reduce noise
			if (!eventPattern.includes('timers')) {
				this.logger.log(`✅ Published '${eventPattern}' to '${exchangeName}'`);
			}
		} catch (error) {
			this.logger.error(`❌ Error publishing: ${error.message}`);
		}
	}

	/**
	 * Fetch table snapshot data from Table Service
	 * Returns denormalized table info for kitchen ticket display
	 */
	private async fetchTableSnapshot(
		tenantId: string,
		tableId: string,
	): Promise<{
		snapshotTableName?: string;
		snapshotFloorName?: string;
		snapshotFloorNumber?: number;
	}> {
		try {
			// Call Table Service to get table details with floor info
			const tableResponse = await firstValueFrom(
				this.tableClient.send('tables:get-by-id', {
					tenantId,
					tableId,
					includeFloor: true, // Request floor relationship
					tableApiKey: this.configService.get<string>('TABLE_API_KEY'),
				}),
			);

			// Table Service returns TableDto directly (not wrapped)
			if (tableResponse) {
				this.logger.log(
					`✅ Fetched table snapshot: ${tableResponse.name} (Floor: ${tableResponse.floor?.name || 'N/A'})`,
				);
				return {
					snapshotTableName: tableResponse.name || null,
					snapshotFloorName: tableResponse.floor?.name || null,
					snapshotFloorNumber: tableResponse.floor?.floorNumber || null,
				};
			}

			// If table not found or no data, return empty snapshot
			this.logger.warn(
				`⚠️ Table ${tableId} not found in Table Service - creating ticket without table snapshot`,
			);
			return {};
		} catch (error) {
			// Non-critical: Don't block ticket creation if Table Service is down
			this.logger.error(
				`❌ Failed to fetch table snapshot for ${tableId}: ${error.message}`,
			);
			return {};
		}
	}

	/**
	 * Call Order Service RPC to update item status
	 * This is the KEY integration point - Kitchen delegates status to Order Service
	 */
	private async callOrderServiceUpdateItems(
		orderId: string,
		tenantId: string,
		itemIds: string[],
		status: string,
	): Promise<void> {
		try {
			const orderApiKey = this.configService.get<string>('ORDER_API_KEY');

			await firstValueFrom(
				this.orderClient.send('orders:update-items-status', {
					orderApiKey,
					orderId,
					tenantId,
					itemIds,
					status, // 'PREPARING' | 'READY'
				}),
			);

			this.logger.log(
				`✅ Order Service updated ${itemIds.length} items to ${status} for order ${orderId}`,
			);
		} catch (error) {
			this.logger.error(`❌ Failed to call Order Service: ${error.message}`, error.stack);
			throw new RpcException({
				code: ErrorCode.INTERNAL_SERVER_ERROR.code,
				message: `Failed to update order items: ${error.message}`,
				status: ErrorCode.INTERNAL_SERVER_ERROR.httpStatus,
			});
		}
	}

	/**
	 * Start the ticket timer update loop
	 * Updates elapsed seconds for all active tickets every second
	 */
	private startTicketTimers() {
		this.ticketTimerInterval = setInterval(async () => {
			await this.updateActiveTicketTimers();
		}, this.TIMER_UPDATE_INTERVAL);
		this.logger.log('✅ Ticket timers started');
	}

	/**
	 * Stop the ticket timer loop
	 */
	private stopTicketTimers() {
		if (this.ticketTimerInterval) {
			clearInterval(this.ticketTimerInterval);
			this.logger.log('✅ Ticket timers stopped');
		}
	}

	/**
	 * Update elapsed time for all active tickets
	 * This runs every second to keep KDS displays accurate
	 */
	private async updateActiveTicketTimers() {
		try {
			// Get all active tickets (PENDING or IN_PROGRESS, not paused)
			const activeTickets = await this.ticketRepository.find({
				where: {
					status: In([KitchenTicketStatus.PENDING, KitchenTicketStatus.IN_PROGRESS]),
					isTimerPaused: false,
				},
			});

			if (activeTickets.length === 0) return;

			// Update each ticket's elapsed time
			for (const ticket of activeTickets) {
				ticket.elapsedSeconds += 1;
			}

			await this.ticketRepository.save(activeTickets);

			// Publish timer updates to RabbitMQ for WebSocket broadcast (throttled to every 5 seconds)
			// Group tickets by tenantId and emit separate events for multi-tenant support
			if (Date.now() % 5000 < 1000) {
				const ticketsByTenant = activeTickets.reduce(
					(acc, t) => {
						if (!acc[t.tenantId]) acc[t.tenantId] = [];
						acc[t.tenantId].push({
							id: t.id,
							ticketNumber: t.ticketNumber,
							elapsedSeconds: t.elapsedSeconds,
							elapsedFormatted: this.formatElapsedTime(t.elapsedSeconds),
							ageColor: this.getAgeColor(t),
						});
						return acc;
					},
					{} as Record<string, any[]>,
				);

				for (const [tenantId, tickets] of Object.entries(ticketsByTenant)) {
					await this.publishToExchange(
						this.configService.get<string>('ORDER_EVENTS_EXCHANGE') || 'order_events_exchange',
						'kitchen.timers.update',
						{
							tenantId,
							tickets,
							timestamp: new Date(),
						},
					);
				}
			}
		} catch (error) {
			// Silently handle - timer will try again next second
		}
	}

	/**
	 * Get age color based on thresholds
	 */
	private getAgeColor(ticket: KitchenTicket): 'green' | 'yellow' | 'red' {
		const warning = ticket.warningThreshold || this.DEFAULT_WARNING_THRESHOLD;
		const critical = ticket.criticalThreshold || this.DEFAULT_CRITICAL_THRESHOLD;

		if (ticket.elapsedSeconds > critical) return 'red';
		if (ticket.elapsedSeconds > warning) return 'yellow';
		return 'green';
	}

	/**
	 * Validate API key
	 */
	private validateApiKey(providedKey: string): void {
		const validKey = this.configService.get<string>('KITCHEN_API_KEY');
		if (providedKey !== validKey) {
			throw new RpcException({
				code: ErrorCode.UNAUTHORIZED.code,
				message: 'Invalid API key',
				status: ErrorCode.UNAUTHORIZED.httpStatus,
			});
		}
	}

	/**
	 * Generate sequential ticket number for the day
	 */
	private generateTicketNumber(): string {
		const today = new Date().toISOString().split('T')[0];

		if (this.lastTicketDate !== today) {
			this.dailyTicketCounter = 0;
			this.lastTicketDate = today;
		}

		this.dailyTicketCounter++;
		return `#${this.dailyTicketCounter.toString().padStart(3, '0')}`;
	}

	/**
	 * Format elapsed seconds to MM:SS
	 */
	private formatElapsedTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	// ==================== EVENT HANDLERS ====================

	/**
	 * Handle incoming order.items.accepted event from Order Service
	 * Creates a display tracking record (ticket) for kitchen
	 *
	 * UNIFIED EVENT ARCHITECTURE:
	 * - Waiter accepts items → Order Service broadcasts order.items.accepted
	 * - Kitchen Service listens to order.items.accepted (same event as API Gateway)
	 * - Creates local tracking record for timers, priority, and display grouping
	 * - Broadcasts kitchen.ticket.new for KDS display updates
	 *
	 * This replaces the old kitchen.prepare_items event for simpler architecture
	 */
	async handlePrepareItems(dto: any): Promise<KitchenTicketResponseDto> {
		// Validate API key (if present in payload)
		if (dto.kitchenApiKey) {
			this.validateApiKey(dto.kitchenApiKey);
		}

		this.logger.log(
			`📥 Creating display ticket for order ${dto.orderId}, table ${dto.tableId} with ${dto.items.length} items`,
		);

		// Generate ticket number
		const ticketNumber = this.generateTicketNumber();

		this.logger.log(`🎟 Generated ticket number ${ticketNumber}`);

		this.logger.log(`🪑 Table ID: ${dto.tableId}, Table Number: ${dto.tableNumber}`);

		// 🆕 DATA ENRICHMENT: Fetch table snapshot for denormalization
		const tableSnapshot = await this.fetchTableSnapshot(dto.tenantId, dto.tableId);

		// Create ticket (display grouping record)
		const ticket = this.ticketRepository.create({
			tenantId: dto.tenantId,
			orderId: dto.orderId,
			tableId: dto.tableId,
			tableNumber: dto.tableNumber || dto.tableId,
			ticketNumber,
			status: KitchenTicketStatus.PENDING,
			priority: dto.priority || KitchenTicketPriority.NORMAL,
			customerName: dto.customerName,
			orderType: dto.orderType,
			notes: dto.notes,
			elapsedSeconds: 0,
			warningThreshold: this.DEFAULT_WARNING_THRESHOLD,
			criticalThreshold: this.DEFAULT_CRITICAL_THRESHOLD,
			isTimerPaused: false,
			totalPausedSeconds: 0,
			// 🆕 Save table snapshot (hard save for display)
			...tableSnapshot,
		});

		// Save ticket first to get ID
		const savedTicket = await this.ticketRepository.save(ticket);

		// Create ticket items (display references to OrderItem)
		const ticketItems: KitchenTicketItem[] = [];
		for (const item of dto.items) {
			const ticketItem = this.ticketItemRepository.create({
				ticketId: savedTicket.id,
				orderItemId: item.id,
				menuItemId: item.menuItemId,
				name: item.name,
				quantity: item.quantity,
				status: KitchenTicketItemStatus.PENDING, // Display status mirrors order
				station: KitchenStationType.GENERAL, // TODO: Route based on menu item category
				modifiers: item.modifiers?.map((m) => ({
					groupName: m.modifierGroupName || 'Modifier',
					optionName: m.optionName || m.label || 'Option',
					isAddition: true,
				})),
				notes: item.notes,
				isAllergy: false,
				isRush: dto.priority >= KitchenTicketPriority.URGENT,
				elapsedSeconds: 0,
				recallCount: 0,
			});
			ticketItems.push(ticketItem);
		}

		await this.ticketItemRepository.save(ticketItems);
		savedTicket.items = ticketItems;

		this.logger.log(
			`✅ Created display ticket ${ticketNumber} with ${ticketItems.length} items`,
		);

		// Broadcast kitchen.ticket.new for KDS real-time display
		// This is a DISPLAY event (not status) - tells KDS frontend about new ticket
		// Order Service already broadcast order.items.accepted for status updates
		await this.publishToExchange(
			this.configService.get<string>('ORDER_EVENTS_EXCHANGE') || 'order_events_exchange',
			'kitchen.ticket.new',
			{
				tenantId: dto.tenantId,
				orderId: dto.orderId,
				tableId: dto.tableId,
				ticket: this.mapToTicketResponse(savedTicket),
				timestamp: new Date(),
			},
		);

		return this.mapToTicketResponse(savedTicket);
	}

	// ==================== QUERY METHODS ====================

	/**
	 * Get tickets with filtering and pagination
	 */
	async getTickets(dto: GetTicketsRequestDto): Promise<PaginatedTicketsResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const page = dto.page || 1;
		const limit = dto.limit || 50;
		const skip = (page - 1) * limit;

		const queryBuilder = this.ticketRepository
			.createQueryBuilder('ticket')
			.leftJoinAndSelect('ticket.items', 'items')
			.where('ticket.tenantId = :tenantId', { tenantId: dto.tenantId });

		// Apply filters
		if (dto.status) {
			const statusEnum = KitchenTicketStatusFromString[dto.status];
			if (statusEnum !== undefined) {
				queryBuilder.andWhere('ticket.status = :status', { status: statusEnum });
			}
		}

		if (dto.tableId) {
			queryBuilder.andWhere('ticket.tableId = :tableId', { tableId: dto.tableId });
		}

		if (dto.priority !== undefined) {
			queryBuilder.andWhere('ticket.priority = :priority', { priority: dto.priority });
		}

		if (dto.station) {
			queryBuilder.andWhere('items.station = :station', { station: dto.station });
		}

		// Apply sorting (default: priority DESC, createdAt ASC)
		const sortBy = dto.sortBy || 'createdAt';
		const sortOrder = dto.sortOrder || 'ASC';

		if (sortBy === 'priority') {
			queryBuilder
				.orderBy('ticket.priority', 'DESC')
				.addOrderBy('ticket.createdAt', 'ASC');
		} else {
			queryBuilder.orderBy(`ticket.${sortBy}`, sortOrder);
		}

		const [tickets, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

		return {
			tickets: tickets.map((t) => this.mapToTicketResponse(t)),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	/**
	 * Get single ticket by ID
	 */
	async getTicket(dto: GetTicketRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Get active kitchen display data
	 * Optimized for KDS frontend polling
	 */
	async getKitchenDisplay(dto: {
		kitchenApiKey: string;
		tenantId: string;
	}): Promise<KitchenDisplayResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		// Get all non-completed tickets
		const tickets = await this.ticketRepository.find({
			where: {
				tenantId: dto.tenantId,
				status: Not(In([KitchenTicketStatus.COMPLETED, KitchenTicketStatus.CANCELLED])),
			},
			relations: ['items'],
			order: { priority: 'DESC', createdAt: 'ASC' },
		});

		// Categorize tickets
		const fireTickets = tickets.filter((t) => t.priority === KitchenTicketPriority.FIRE);
		const urgentTickets = tickets.filter(
			(t) => t.priority === KitchenTicketPriority.URGENT,
		);
		const activeTickets = tickets.filter(
			(t) =>
				t.status === KitchenTicketStatus.IN_PROGRESS &&
				t.priority < KitchenTicketPriority.URGENT,
		);
		const pendingTickets = tickets.filter(
			(t) => t.status === KitchenTicketStatus.PENDING,
		);
		const readyTickets = tickets.filter((t) => t.status === KitchenTicketStatus.READY);

		// Calculate summary
		const allActive = tickets.filter((t) => t.status === KitchenTicketStatus.IN_PROGRESS);
		const ages = tickets.map((t) => t.elapsedSeconds);
		const oldestAge = ages.length > 0 ? Math.max(...ages) : 0;
		const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

		return {
			tenantId: dto.tenantId,
			timestamp: new Date(),
			fireTickets: fireTickets.map((t) => this.mapToTicketResponse(t)),
			urgentTickets: urgentTickets.map((t) => this.mapToTicketResponse(t)),
			activeTickets: activeTickets.map((t) => this.mapToTicketResponse(t)),
			pendingTickets: pendingTickets.map((t) => this.mapToTicketResponse(t)),
			readyTickets: readyTickets.map((t) => this.mapToTicketResponse(t)),
			summary: {
				totalActive: allActive.length,
				totalPending: pendingTickets.length,
				totalReady: readyTickets.length,
				oldestTicketAge: oldestAge,
				averageAge: Math.round(avgAge),
			},
		};
	}

	// ==================== TICKET OPERATIONS (Calls Order Service RPC) ====================

	/**
	 * Start preparing a ticket
	 * - Updates local display status
	 * - Calls Order Service RPC to update item status to PREPARING
	 * - Order Service will broadcast order.items.preparing to all clients
	 */
	async startTicket(dto: StartTicketRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		if (ticket.status !== KitchenTicketStatus.PENDING) {
			throw new RpcException({
				code: ErrorCode.INVALID_ORDER_STATUS_TRANSITION.code,
				message: `Ticket is ${KitchenTicketStatusLabels[ticket.status]}, cannot start`,
				status: ErrorCode.INVALID_ORDER_STATUS_TRANSITION.httpStatus,
			});
		}

		// 1. Call Order Service RPC to update items to PREPARING
		const orderItemIds = ticket.items.map((i) => i.orderItemId);
		await this.callOrderServiceUpdateItems(
			ticket.orderId,
			dto.tenantId,
			orderItemIds,
			'PREPARING',
		);

		// 2. Update local display status
		ticket.status = KitchenTicketStatus.IN_PROGRESS;
		ticket.startedAt = new Date();
		if (dto.cookId) ticket.assignedCookId = dto.cookId;
		if (dto.cookName) ticket.assignedCookName = dto.cookName;

		for (const item of ticket.items) {
			if (item.status === KitchenTicketItemStatus.PENDING) {
				item.status = KitchenTicketItemStatus.PREPARING;
				item.startedAt = new Date();
			}
		}

		await this.ticketRepository.save(ticket);
		await this.ticketItemRepository.save(ticket.items);

		this.logger.log(`✅ Started ticket ${ticket.ticketNumber} - Order Service notified`);

		// NOTE: We do NOT publish kitchen.ticket.started
		// Order Service broadcasts order.items.preparing which all clients receive

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Start preparing specific items
	 */
	async startItems(dto: StartItemsRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		const itemsToStart = ticket.items.filter((i) => dto.itemIds.includes(i.id));

		if (itemsToStart.length === 0) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: 'No valid items to start',
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		const now = new Date();
		for (const item of itemsToStart) {
			if (item.status === KitchenTicketItemStatus.PENDING) {
				item.status = KitchenTicketItemStatus.PREPARING;
				item.startedAt = now;
			}
		}

		// Auto-start ticket if it was pending
		if (ticket.status === KitchenTicketStatus.PENDING) {
			ticket.status = KitchenTicketStatus.IN_PROGRESS;
			ticket.startedAt = now;
			if (dto.cookId) ticket.assignedCookId = dto.cookId;
			if (dto.cookName) ticket.assignedCookName = dto.cookName;
		}

		await this.ticketRepository.save(ticket);
		await this.ticketItemRepository.save(itemsToStart);

		// Update item status in Order Service (source of truth)
		const orderItemIds = itemsToStart.map((i) => i.orderItemId);
		await this.callOrderServiceUpdateItems(
			ticket.orderId,
			dto.tenantId,
			orderItemIds,
			'PREPARING',
		);

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Mark items as ready
	 */
	async markItemsReady(dto: MarkItemsReadyRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		const itemsToMark = ticket.items.filter((i) => dto.itemIds.includes(i.id));
		const now = new Date();

		for (const item of itemsToMark) {
			if (item.status === KitchenTicketItemStatus.PREPARING) {
				item.status = KitchenTicketItemStatus.READY;
				item.readyAt = now;
				item.elapsedSeconds = Math.round(
					(now.getTime() - item.startedAt.getTime()) / 1000,
				);
			}
		}

		await this.ticketItemRepository.save(itemsToMark);

		// Check if all items are ready → auto-update ticket status
		const allReady = ticket.items.every(
			(i) =>
				i.status === KitchenTicketItemStatus.READY ||
				i.status === KitchenTicketItemStatus.CANCELLED,
		);

		if (allReady) {
			ticket.status = KitchenTicketStatus.READY;
			ticket.readyAt = now;
			await this.ticketRepository.save(ticket);

			this.logger.log(`✅ Ticket ${ticket.ticketNumber} is fully ready`);

			// Publish ticket-level ready event for expo/waiter notification (display-only)
			// This is a Kitchen display event, not an item status event
			await this.publishToExchange(
				this.configService.get<string>('ORDER_EVENTS_EXCHANGE') || 'order_events_exchange',
				'kitchen.ticket.ready',
				{
					tenantId: dto.tenantId,
					orderId: ticket.orderId,
					tableId: ticket.tableId,
					ticket: this.mapToTicketResponse(ticket),
					timestamp: new Date(),
				},
			);
		}

		// Update item status in Order Service (source of truth)
		// Order Service will broadcast order.items.ready to all clients
		const orderItemIds = itemsToMark.map((i) => i.orderItemId);
		await this.callOrderServiceUpdateItems(
			ticket.orderId,
			dto.tenantId,
			orderItemIds,
			'READY',
		);

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Bump (complete) a ticket
	 */
	async bumpTicket(dto: BumpTicketRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		if (ticket.status === KitchenTicketStatus.COMPLETED) {
			throw new RpcException({
				code: ErrorCode.INVALID_ORDER_STATUS_TRANSITION.code,
				message: 'Ticket is already completed',
				status: ErrorCode.INVALID_ORDER_STATUS_TRANSITION.httpStatus,
			});
		}

		ticket.status = KitchenTicketStatus.COMPLETED;
		ticket.completedAt = new Date();

		await this.ticketRepository.save(ticket);

		this.logger.log(`✅ Bumped ticket ${ticket.ticketNumber}`);

		// Publish event to RabbitMQ for WebSocket broadcast
		await this.publishToExchange(
			this.configService.get<string>('ORDER_EVENTS_EXCHANGE') || 'order_events_exchange',
			'kitchen.ticket.completed',
			{
				tenantId: dto.tenantId,
				orderId: ticket.orderId,
				tableId: ticket.tableId,
				ticketId: ticket.id,
				ticketNumber: ticket.ticketNumber,
				timestamp: new Date(),
			},
		);

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Recall items (need to remake)
	 */
	async recallItems(dto: RecallItemsRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		const itemsToRecall = ticket.items.filter((i) => dto.itemIds.includes(i.id));

		for (const item of itemsToRecall) {
			item.status = KitchenTicketItemStatus.RECALLED;
			item.recallCount += 1;
			item.recallReason = dto.reason;
			item.elapsedSeconds = 0; // Reset timer
			item.startedAt = null;
			item.readyAt = null;
		}

		await this.ticketItemRepository.save(itemsToRecall);

		// If ticket was READY, move back to IN_PROGRESS
		if (ticket.status === KitchenTicketStatus.READY) {
			ticket.status = KitchenTicketStatus.IN_PROGRESS;
			ticket.readyAt = null;
			await this.ticketRepository.save(ticket);
		}

		this.logger.log(
			`⚠️ Recalled ${itemsToRecall.length} items on ticket ${ticket.ticketNumber}: ${dto.reason}`,
		);

		// Publish recall event to RabbitMQ for WebSocket broadcast
		await this.publishToExchange(
			this.configService.get<string>('ORDER_EVENTS_EXCHANGE') || 'order_events_exchange',
			'kitchen.items.recalled',
			{
				tenantId: dto.tenantId,
				orderId: ticket.orderId,
				tableId: ticket.tableId,
				ticketId: ticket.id,
				ticketNumber: ticket.ticketNumber,
				items: itemsToRecall.map((i) => ({
					id: i.id,
					name: i.name,
					orderItemId: i.orderItemId,
				})),
				reason: dto.reason,
				timestamp: new Date(),
			},
		);

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Cancel specific items
	 */
	async cancelItems(dto: CancelItemsRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		const itemsToCancel = ticket.items.filter((i) => dto.itemIds.includes(i.id));
		const now = new Date();

		for (const item of itemsToCancel) {
			item.status = KitchenTicketItemStatus.CANCELLED;
			item.cancelledAt = now;
		}

		await this.ticketItemRepository.save(itemsToCancel);

		// Check if all items are cancelled → cancel ticket
		const allCancelled = ticket.items.every(
			(i) => i.status === KitchenTicketItemStatus.CANCELLED,
		);

		if (allCancelled) {
			ticket.status = KitchenTicketStatus.CANCELLED;
			ticket.cancelledAt = now;
			await this.ticketRepository.save(ticket);
		}

		this.logger.log(
			`❌ Cancelled ${itemsToCancel.length} items on ticket ${ticket.ticketNumber}`,
		);

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Cancel entire ticket
	 */
	async cancelTicket(dto: CancelTicketRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		const now = new Date();
		ticket.status = KitchenTicketStatus.CANCELLED;
		ticket.cancelledAt = now;

		for (const item of ticket.items) {
			if (item.status !== KitchenTicketItemStatus.CANCELLED) {
				item.status = KitchenTicketItemStatus.CANCELLED;
				item.cancelledAt = now;
			}
		}

		await this.ticketRepository.save(ticket);
		await this.ticketItemRepository.save(ticket.items);

		this.logger.log(
			`❌ Cancelled ticket ${ticket.ticketNumber}: ${dto.reason || 'No reason'}`,
		);

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Update ticket priority
	 */
	async updatePriority(dto: UpdatePriorityRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		const oldPriority = ticket.priority;
		ticket.priority = dto.priority;

		await this.ticketRepository.save(ticket);

		this.logger.log(
			`🔥 Updated ticket ${ticket.ticketNumber} priority: ${KitchenTicketPriorityLabels[oldPriority]} → ${KitchenTicketPriorityLabels[dto.priority]}`,
		);

		// Publish priority change event to RabbitMQ for WebSocket broadcast
		await this.publishToExchange(
			this.configService.get<string>('ORDER_EVENTS_EXCHANGE') || 'order_events_exchange',
			'kitchen.ticket.priority',
			{
				tenantId: dto.tenantId,
				orderId: ticket.orderId,
				tableId: ticket.tableId,
				ticket: this.mapToTicketResponse(ticket),
				oldPriority: KitchenTicketPriorityLabels[oldPriority],
				newPriority: KitchenTicketPriorityLabels[dto.priority],
				timestamp: new Date(),
			},
		);

		return this.mapToTicketResponse(ticket);
	}

	/**
	 * Toggle ticket timer (pause/resume)
	 */
	async toggleTimer(dto: ToggleTimerRequestDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const ticket = await this.ticketRepository.findOne({
			where: { id: dto.ticketId, tenantId: dto.tenantId },
			relations: ['items'],
		});

		if (!ticket) {
			throw new RpcException({
				code: ErrorCode.NOT_FOUND_RESOURCE.code,
				message: `Ticket ${dto.ticketId} not found`,
				status: ErrorCode.NOT_FOUND_RESOURCE.httpStatus,
			});
		}

		if (dto.pause) {
			ticket.isTimerPaused = true;
			ticket.timerPausedAt = new Date();
		} else {
			if (ticket.timerPausedAt) {
				const pausedDuration = Math.round(
					(Date.now() - ticket.timerPausedAt.getTime()) / 1000,
				);
				ticket.totalPausedSeconds += pausedDuration;
			}
			ticket.isTimerPaused = false;
			ticket.timerPausedAt = null;
		}

		await this.ticketRepository.save(ticket);

		this.logger.log(
			`⏸️ Ticket ${ticket.ticketNumber} timer ${dto.pause ? 'paused' : 'resumed'}`,
		);

		return this.mapToTicketResponse(ticket);
	}

	// ==================== STATISTICS ====================

	/**
	 * Get kitchen statistics
	 */
	async getStats(dto: GetKitchenStatsRequestDto): Promise<KitchenStatsResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		const dateFrom = dto.dateFrom
			? new Date(dto.dateFrom)
			: new Date(Date.now() - 24 * 60 * 60 * 1000);
		const dateTo = dto.dateTo ? new Date(dto.dateTo) : new Date();

		const tickets = await this.ticketRepository.find({
			where: {
				tenantId: dto.tenantId,
				createdAt: MoreThan(dateFrom),
			},
			relations: ['items'],
		});

		const completed = tickets.filter((t) => t.status === KitchenTicketStatus.COMPLETED);
		const cancelled = tickets.filter((t) => t.status === KitchenTicketStatus.CANCELLED);
		const pending = tickets.filter((t) => t.status === KitchenTicketStatus.PENDING);
		const inProgress = tickets.filter(
			(t) => t.status === KitchenTicketStatus.IN_PROGRESS,
		);

		// Calculate timing stats
		const prepTimes = completed
			.filter((t) => t.completedAt && t.createdAt)
			.map((t) => (t.completedAt.getTime() - t.createdAt.getTime()) / 1000);

		const avgPrepTime =
			prepTimes.length > 0 ? prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length : 0;

		const waitTimes = completed
			.filter((t) => t.startedAt && t.createdAt)
			.map((t) => (t.startedAt.getTime() - t.createdAt.getTime()) / 1000);

		const avgWaitTime =
			waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;

		// Calculate hourly rate
		const hoursDiff = (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60);
		const ticketsPerHour = hoursDiff > 0 ? completed.length / hoursDiff : 0;

		const totalItems = completed.reduce((sum, t) => sum + (t.items?.length || 0), 0);
		const itemsPerHour = hoursDiff > 0 ? totalItems / hoursDiff : 0;

		// Recall rate
		const recalledItems = completed
			.flatMap((t) => t.items || [])
			.filter((i) => i.recallCount > 0);
		const recallRate = totalItems > 0 ? (recalledItems.length / totalItems) * 100 : 0;

		return {
			tenantId: dto.tenantId,
			period: {
				from: dateFrom.toISOString(),
				to: dateTo.toISOString(),
			},
			totalTickets: tickets.length,
			pendingTickets: pending.length,
			inProgressTickets: inProgress.length,
			completedTickets: completed.length,
			cancelledTickets: cancelled.length,
			averagePrepTime: Math.round(avgPrepTime),
			averageWaitTime: Math.round(avgWaitTime),
			longestPrepTime: prepTimes.length > 0 ? Math.round(Math.max(...prepTimes)) : 0,
			shortestPrepTime: prepTimes.length > 0 ? Math.round(Math.min(...prepTimes)) : 0,
			ticketsPerHour: Math.round(ticketsPerHour * 10) / 10,
			itemsPerHour: Math.round(itemsPerHour * 10) / 10,
			onTimePercentage: 85, // TODO: Calculate based on estimated vs actual
			recallRate: Math.round(recallRate * 10) / 10,
		};
	}

	// ==================== HELPER METHODS ====================

	/**
	 * Map entity to response DTO
	 */
	private mapToTicketResponse(ticket: KitchenTicket): KitchenTicketResponseDto {
		const items = ticket.items || [];

		return {
			id: ticket.id,
			tenantId: ticket.tenantId,
			orderId: ticket.orderId,
			tableId: ticket.tableId,
			tableNumber: ticket.tableNumber,
			ticketNumber: ticket.ticketNumber,
			status: KitchenTicketStatusLabels[ticket.status],
			priority: KitchenTicketPriorityLabels[ticket.priority],
			priorityLevel: ticket.priority,
			customerName: ticket.customerName,
			orderType: ticket.orderType,
			notes: ticket.notes,
			assignedCookId: ticket.assignedCookId,
			assignedCookName: ticket.assignedCookName,
			elapsedSeconds: ticket.elapsedSeconds,
			elapsedFormatted: this.formatElapsedTime(ticket.elapsedSeconds),
			estimatedPrepTime: ticket.estimatedPrepTime,
			warningThreshold: ticket.warningThreshold,
			criticalThreshold: ticket.criticalThreshold,
			isTimerPaused: ticket.isTimerPaused,
			totalPausedSeconds: ticket.totalPausedSeconds,
			ageColor: this.getAgeColor(ticket),
			totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
			pendingItems: items
				.filter((i) => i.status === KitchenTicketItemStatus.PENDING)
				.reduce((sum, i) => sum + i.quantity, 0),
			preparingItems: items
				.filter((i) => i.status === KitchenTicketItemStatus.PREPARING)
				.reduce((sum, i) => sum + i.quantity, 0),
			readyItems: items
				.filter((i) => i.status === KitchenTicketItemStatus.READY)
				.reduce((sum, i) => sum + i.quantity, 0),
			startedAt: ticket.startedAt,
			readyAt: ticket.readyAt,
			completedAt: ticket.completedAt,
			cancelledAt: ticket.cancelledAt,
			createdAt: ticket.createdAt,
			updatedAt: ticket.updatedAt,
			items: items.map((i) => this.mapToItemResponse(i)),
			// Data Enrichment - Table snapshot
			snapshotTableName: ticket.snapshotTableName,
			snapshotFloorName: ticket.snapshotFloorName,
			snapshotFloorNumber: ticket.snapshotFloorNumber,
		};
	}

	/**
	 * Map item entity to response DTO
	 */
	private mapToItemResponse(item: KitchenTicketItem): KitchenTicketItemResponseDto {
		return {
			id: item.id,
			ticketId: item.ticketId,
			orderItemId: item.orderItemId,
			menuItemId: item.menuItemId,
			name: item.name,
			quantity: item.quantity,
			status: KitchenTicketItemStatusLabels[item.status],
			station: item.station,
			courseNumber: item.courseNumber,
			modifiers: item.modifiers,
			notes: item.notes,
			isAllergy: item.isAllergy,
			allergyInfo: item.allergyInfo,
			isRush: item.isRush,
			estimatedPrepTime: item.estimatedPrepTime,
			elapsedSeconds: item.elapsedSeconds,
			recallCount: item.recallCount,
			recallReason: item.recallReason,
			startedAt: item.startedAt,
			readyAt: item.readyAt,
			cancelledAt: item.cancelledAt,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}
}
