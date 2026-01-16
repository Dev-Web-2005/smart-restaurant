import {
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	OneToMany,
	Index,
} from 'typeorm';
import { KitchenTicketStatus } from '../enums/ticket-status.enum';
import { KitchenTicketPriority } from '../enums/ticket-priority.enum';
import { KitchenTicketItem } from './kitchen-ticket-item.entity';

/**
 * KitchenTicket Entity
 *
 * Represents a kitchen display ticket (order ticket) in the KDS
 * Groups order items for coordinated preparation
 *
 * Best Practice Architecture (Toast POS, Square KDS, Oracle MICROS):
 * - Each ticket represents items from a single order batch
 * - Multiple tickets can exist for the same order (when customer adds more items)
 * - Tickets have timers for tracking preparation time
 * - Priority can be adjusted by expediter/manager
 *
 * Key Features:
 * - Multi-tenant support with tenantId
 * - Elapsed time tracking for KPIs
 * - Priority management for kitchen workflow
 * - Bump system for completing tickets
 */
@Entity('kitchen_tickets')
@Index('idx_ticket_tenant_status', ['tenantId', 'status'])
@Index('idx_ticket_order_id', ['orderId'])
@Index('idx_ticket_table_id', ['tableId'])
@Index('idx_ticket_created_at', ['createdAt'])
@Index('idx_ticket_priority_created', ['priority', 'createdAt'])
export class KitchenTicket {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	@Index('idx_ticket_tenant_id')
	tenantId: string; // Multi-tenancy isolation

	@Column({ type: 'uuid', nullable: false })
	orderId: string; // Reference to order in Order Service

	@Column({ type: 'varchar', length: 50, nullable: false })
	tableId: string; // Table identifier for display

	@Column({ type: 'varchar', length: 60, nullable: true })
	tableNumber: string; // Human-readable table number (e.g., "A1", "12")

	@Column({ type: 'varchar', length: 20, nullable: true })
	ticketNumber: string; // Sequential ticket number for the day (e.g., "#042")

	@Column({ type: 'int', default: KitchenTicketStatus.PENDING })
	@Index('idx_ticket_status')
	status: KitchenTicketStatus;

	@Column({ type: 'int', default: KitchenTicketPriority.NORMAL })
	priority: KitchenTicketPriority;

	@Column({ type: 'varchar', length: 100, nullable: true })
	customerName: string; // For personalized service

	@Column({ type: 'varchar', length: 50, nullable: true })
	orderType: string; // DINE_IN, TAKEOUT, DELIVERY

	@Column({ type: 'text', nullable: true })
	notes: string; // Special instructions for entire ticket

	@Column({ type: 'uuid', nullable: true })
	assignedCookId: string; // Cook assigned to this ticket (optional)

	@Column({ type: 'varchar', length: 100, nullable: true })
	assignedCookName: string; // Cook name for display

	// Timer fields - Critical for KDS functionality
	@Column({ type: 'int', default: 0 })
	elapsedSeconds: number; // Total elapsed time in seconds

	@Column({ type: 'int', nullable: true })
	estimatedPrepTime: number; // Estimated preparation time in seconds

	@Column({ type: 'int', nullable: true })
	warningThreshold: number; // Seconds before ticket turns yellow (default: 10 min)

	@Column({ type: 'int', nullable: true })
	criticalThreshold: number; // Seconds before ticket turns red (default: 15 min)

	@Column({ type: 'boolean', default: false })
	isTimerPaused: boolean; // Timer paused (e.g., waiting for customer)

	@Column({ type: 'timestamp', nullable: true })
	timerPausedAt: Date; // When timer was paused

	@Column({ type: 'int', default: 0 })
	totalPausedSeconds: number; // Total time paused (excluded from elapsed)

	// Timestamps
	@Column({ type: 'timestamp', nullable: true })
	startedAt: Date; // When preparation started (IN_PROGRESS)

	@Column({ type: 'timestamp', nullable: true })
	readyAt: Date; // When all items became ready

	@Column({ type: 'timestamp', nullable: true })
	completedAt: Date; // When ticket was bumped/completed

	@Column({ type: 'timestamp', nullable: true })
	cancelledAt: Date; // When ticket was cancelled

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	// Relations
	@OneToMany(() => KitchenTicketItem, (item) => item.ticket, {
		cascade: true,
		eager: true,
	})
	items: KitchenTicketItem[];

	// Computed properties
	get totalItems(): number {
		return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
	}

	get pendingItems(): number {
		return (
			this.items
				?.filter((item) => item.status === 0)
				.reduce((sum, item) => sum + item.quantity, 0) || 0
		);
	}

	get readyItems(): number {
		return (
			this.items
				?.filter((item) => item.status === 2)
				.reduce((sum, item) => sum + item.quantity, 0) || 0
		);
	}

	get isOverdue(): boolean {
		if (!this.criticalThreshold) return false;
		return this.elapsedSeconds > this.criticalThreshold;
	}

	get isWarning(): boolean {
		if (!this.warningThreshold) return false;
		return this.elapsedSeconds > this.warningThreshold && !this.isOverdue;
	}

	/**
	 * Get ticket age color for KDS display
	 */
	get ageColor(): 'green' | 'yellow' | 'red' {
		if (this.isOverdue) return 'red';
		if (this.isWarning) return 'yellow';
		return 'green';
	}
}
