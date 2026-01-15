import {
	Inject,
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, LessThan, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import * as amqp from 'amqplib';

import { KitchenTicket, KitchenTicketItem } from '../common/entities';
import {
	KitchenTicketStatus,
	KitchenTicketStatusLabels,
	KitchenTicketStatusFromString,
	isValidKitchenTicketStatusTransition,
} from '../common/enums/ticket-status.enum';
import {
	KitchenTicketItemStatus,
	KitchenTicketItemStatusLabels,
	KitchenTicketItemStatusFromString,
	isValidKitchenItemStatusTransition,
} from '../common/enums/ticket-item-status.enum';
import {
	KitchenTicketPriority,
	KitchenTicketPriorityLabels,
	KitchenTicketPriorityFromString,
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
 * Core business logic for Kitchen Display System (KDS)
 *
 * BEST PRACTICE ARCHITECTURE (Toast POS, Square KDS, Oracle MICROS):
 * - Tickets are created when waiter accepts order items
 * - Real-time timer tracking for preparation times
 * - Priority management for expediting
 * - Station routing for multi-station kitchens
 * - Bump screen workflow for completion
 * - Recall functionality for remakes
 *
 * Key Features:
 * 1. Receive items from Order Service via RabbitMQ
 * 2. Create and manage kitchen tickets
 * 3. Track elapsed time with configurable thresholds
 * 4. Update Order Service when items are ready
 * 5. Emit WebSocket events for real-time KDS updates
 */
@Injectable()
export class KitchenService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(KitchenService.name);
	private amqpConnection: amqp.Connection;
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
		private readonly eventEmitter: EventEmitter2,
		@Inject('KITCHEN_EVENTS') private readonly kitchenEventsClient: ClientProxy,
	) {}

	/**
	 * Module initialization - start timer and RabbitMQ
	 */
	async onModuleInit() {
		await this.initializeRabbitMQ();
		this.startTicketTimers();
		this.logger.log('✅ KitchenService initialized');
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
	 * Initialize RabbitMQ connection
	 */
	private async initializeRabbitMQ() {
		try {
			const amqpUrl = this.configService.get<string>('CONNECTION_AMQP');
			this.amqpConnection = await amqp.connect(amqpUrl);
			this.amqpChannel = await this.amqpConnection.createChannel();
			this.logger.log('✅ RabbitMQ channel initialized');
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
	 * Publish event to RabbitMQ exchange
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

			this.logger.log(`✅ Published '${eventPattern}' to '${exchangeName}'`);
		} catch (error) {
			this.logger.error(`❌ Error publishing: ${error.message}`);
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

			// Emit timer updates for WebSocket broadcast (throttled to every 5 seconds)
			if (Date.now() % 5000 < 1000) {
				this.eventEmitter.emit('kitchen.timers.update', {
					tickets: activeTickets.map((t) => ({
						id: t.id,
						tenantId: t.tenantId,
						elapsedSeconds: t.elapsedSeconds,
						ageColor: this.getAgeColor(t),
					})),
				});
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
	 * Handle incoming prepare items event from Order Service
	 * Creates a new kitchen ticket with the items
	 */
	async handlePrepareItems(dto: PrepareItemsEventDto): Promise<KitchenTicketResponseDto> {
		this.validateApiKey(dto.kitchenApiKey);

		this.logger.log(
			`Creating ticket for order ${dto.orderId}, table ${dto.tableId} with ${dto.items.length} items`,
		);

		// Generate ticket number
		const ticketNumber = this.generateTicketNumber();

		// Create ticket
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
		});

		// Save ticket first to get ID
		const savedTicket = await this.ticketRepository.save(ticket);

		// Create ticket items
		const ticketItems: KitchenTicketItem[] = [];
		for (const item of dto.items) {
			const ticketItem = this.ticketItemRepository.create({
				ticketId: savedTicket.id,
				orderItemId: item.id,
				menuItemId: item.menuItemId,
				name: item.name,
				quantity: item.quantity,
				status: KitchenTicketItemStatus.PENDING,
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

		this.logger.log(`✅ Created ticket ${ticketNumber} with ${ticketItems.length} items`);

		// Emit event for WebSocket broadcast
		this.eventEmitter.emit('kitchen.ticket.new', {
			tenantId: dto.tenantId,
			ticket: this.mapToTicketResponse(savedTicket),
		});

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

	// ==================== TICKET OPERATIONS ====================

	/**
	 * Start preparing a ticket (PENDING → IN_PROGRESS)
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

		// Update ticket
		ticket.status = KitchenTicketStatus.IN_PROGRESS;
		ticket.startedAt = new Date();
		if (dto.cookId) ticket.assignedCookId = dto.cookId;
		if (dto.cookName) ticket.assignedCookName = dto.cookName;

		// Start all pending items
		for (const item of ticket.items) {
			if (item.status === KitchenTicketItemStatus.PENDING) {
				item.status = KitchenTicketItemStatus.PREPARING;
				item.startedAt = new Date();
			}
		}

		await this.ticketRepository.save(ticket);
		await this.ticketItemRepository.save(ticket.items);

		this.logger.log(`✅ Started ticket ${ticket.ticketNumber}`);

		// Emit event
		this.eventEmitter.emit('kitchen.ticket.started', {
			tenantId: dto.tenantId,
			ticket: this.mapToTicketResponse(ticket),
		});

		// Update Order Service - items now PREPARING
		await this.notifyOrderService(ticket, 'PREPARING');

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

		// Notify Order Service
		await this.notifyOrderServiceItems(ticket, itemsToStart, 'PREPARING');

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

			// Emit ready event for expo/waiter notification
			this.eventEmitter.emit('kitchen.ticket.ready', {
				tenantId: dto.tenantId,
				ticket: this.mapToTicketResponse(ticket),
			});
		}

		// Notify Order Service
		await this.notifyOrderServiceItems(ticket, itemsToMark, 'READY');

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

		// Emit event
		this.eventEmitter.emit('kitchen.ticket.bumped', {
			tenantId: dto.tenantId,
			ticketId: ticket.id,
			ticketNumber: ticket.ticketNumber,
		});

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

		// Emit recall event
		this.eventEmitter.emit('kitchen.items.recalled', {
			tenantId: dto.tenantId,
			ticketId: ticket.id,
			items: itemsToRecall.map((i) => ({ id: i.id, name: i.name })),
			reason: dto.reason,
		});

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

		// Emit priority change event
		if (dto.priority >= KitchenTicketPriority.URGENT) {
			this.eventEmitter.emit('kitchen.ticket.priority', {
				tenantId: dto.tenantId,
				ticket: this.mapToTicketResponse(ticket),
				newPriority: KitchenTicketPriorityLabels[dto.priority],
			});
		}

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
	 * Notify Order Service about item status changes
	 */
	private async notifyOrderService(ticket: KitchenTicket, status: string): Promise<void> {
		try {
			const orderApiKey = this.configService.get<string>('ORDER_API_KEY');

			await this.publishToExchange(
				'order_events_exchange',
				`kitchen.items.${status.toLowerCase()}`,
				{
					orderApiKey,
					orderId: ticket.orderId,
					tenantId: ticket.tenantId,
					ticketId: ticket.id,
					status,
					itemIds: ticket.items.map((i) => i.orderItemId),
					updatedAt: new Date(),
				},
			);
		} catch (error) {
			this.logger.error(`Failed to notify Order Service: ${error.message}`);
		}
	}

	/**
	 * Notify Order Service about specific item status changes
	 */
	private async notifyOrderServiceItems(
		ticket: KitchenTicket,
		items: KitchenTicketItem[],
		status: string,
	): Promise<void> {
		try {
			const orderApiKey = this.configService.get<string>('ORDER_API_KEY');

			await this.publishToExchange(
				'order_events_exchange',
				`kitchen.items.${status.toLowerCase()}`,
				{
					orderApiKey,
					orderId: ticket.orderId,
					tenantId: ticket.tenantId,
					ticketId: ticket.id,
					status,
					itemIds: items.map((i) => i.orderItemId),
					updatedAt: new Date(),
				},
			);
		} catch (error) {
			this.logger.error(`Failed to notify Order Service: ${error.message}`);
		}
	}

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
