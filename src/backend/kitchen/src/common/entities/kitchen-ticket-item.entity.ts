import {
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from 'typeorm';
import { KitchenTicket } from './kitchen-ticket.entity';
import { KitchenTicketItemStatus } from '../enums/ticket-item-status.enum';
import { KitchenStationType } from '../enums/station-type.enum';

/**
 * KitchenTicketItem Entity
 *
 * Represents individual items on a kitchen ticket
 * Each item can be tracked independently for granular preparation status
 *
 * Best Practice: Professional KDS systems track items individually
 * to support:
 * - Parallel cooking across stations
 * - Partial ticket completion
 * - Item-level timing and recalls
 */
@Entity('kitchen_ticket_items')
@Index('idx_ticket_item_ticket_id', ['ticketId'])
@Index('idx_ticket_item_status', ['status'])
@Index('idx_ticket_item_station', ['station'])
@Index('idx_ticket_item_order_item_id', ['orderItemId'])
export class KitchenTicketItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	ticketId: string; // Parent ticket

	@Column({ type: 'uuid', nullable: false })
	orderItemId: string; // Reference to OrderItem in Order Service

	@Column({ type: 'uuid', nullable: false })
	menuItemId: string; // Reference to menu item (for routing)

	@Column({ type: 'varchar', length: 100, nullable: false })
	name: string; // Menu item name for display

	@Column({ type: 'int', default: 1 })
	quantity: number; // Number of this item

	@Column({ type: 'int', default: KitchenTicketItemStatus.PENDING })
	status: KitchenTicketItemStatus;

	@Column({ type: 'varchar', length: 20, default: KitchenStationType.GENERAL })
	station: KitchenStationType; // Kitchen station to prepare this item

	@Column({ type: 'int', nullable: true })
	courseNumber: number; // Course number (1=appetizer, 2=main, 3=dessert)

	@Column({ type: 'jsonb', nullable: true })
	modifiers: KitchenItemModifier[]; // Selected modifiers for display

	@Column({ type: 'text', nullable: true })
	notes: string; // Special instructions for this item

	@Column({ type: 'boolean', default: false })
	isAllergy: boolean; // Allergy alert flag

	@Column({ type: 'text', nullable: true })
	allergyInfo: string; // Specific allergy information

	@Column({ type: 'boolean', default: false })
	isRush: boolean; // Rush item flag

	@Column({ type: 'int', nullable: true })
	estimatedPrepTime: number; // Estimated prep time in seconds

	@Column({ type: 'int', default: 0 })
	elapsedSeconds: number; // Time spent preparing this item

	@Column({ type: 'int', default: 0 })
	recallCount: number; // Number of times item was recalled

	@Column({ type: 'text', nullable: true })
	recallReason: string; // Last recall reason

	// Timestamps
	@Column({ type: 'timestamp', nullable: true })
	startedAt: Date; // When preparation started

	@Column({ type: 'timestamp', nullable: true })
	readyAt: Date; // When item became ready

	@Column({ type: 'timestamp', nullable: true })
	cancelledAt: Date; // When item was cancelled

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	// Relations
	@ManyToOne(() => KitchenTicket, (ticket) => ticket.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'ticketId' })
	ticket: KitchenTicket;
}

/**
 * KitchenItemModifier Interface
 *
 * Simplified modifier info for kitchen display
 * Only includes info relevant to preparation
 */
export interface KitchenItemModifier {
	/** Modifier group name (e.g., "Size", "Toppings") */
	groupName: string;

	/** Selected option (e.g., "Large", "Extra cheese") */
	optionName: string;

	/** Is this an addition (vs removal)? */
	isAddition?: boolean;
}
