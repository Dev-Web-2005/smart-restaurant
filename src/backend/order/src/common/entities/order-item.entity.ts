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
import { Order } from './order.entity';
import { DecimalToNumberTransformer } from '../transformers/decimal-to-number.transformer';
import { OrderItemStatus } from '../enums/order-item-status.enum';

/**
 * OrderItem Entity
 *
 * Represents individual items (line items) within an order
 * Each item can have custom modifiers selected by the customer
 *
 * NEW: Item-level status tracking
 * - Each item has its own lifecycle independent of other items
 * - Allows customers to add items to ongoing orders
 * - Kitchen can track preparation of individual items
 *
 * Key Features:
 * - Stores snapshot of menu item at time of order
 * - Supports modifiers (e.g., "Extra cheese", "No onions")
 * - Tracks quantity and calculates item total
 * - Preserves data even if menu item is later deleted/modified
 * - Item-level status for granular workflow management
 */
@Entity('order_items')
@Index('idx_order_item_order_id', ['orderId'])
@Index('idx_order_item_status', ['status'])
export class OrderItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	orderId: string; // Parent order

	@Column({ type: 'uuid', nullable: false })
	menuItemId: string; // Reference to menu item (snapshot)

	@Column({ type: 'varchar', length: 100, nullable: false })
	name: string; // Menu item name at time of order

	@Column({ type: 'text', nullable: true })
	description: string; // Menu item description (optional snapshot)

	@Column('decimal', {
		precision: 12,
		scale: 2,
		transformer: new DecimalToNumberTransformer(),
	})
	unitPrice: number; // Price per unit at time of order

	@Column({ type: 'int', default: 1 })
	quantity: number; // Number of this item ordered

	@Column('decimal', {
		precision: 12,
		scale: 2,
		transformer: new DecimalToNumberTransformer(),
	})
	subtotal: number; // unitPrice * quantity (before modifiers)

	@Column('decimal', {
		precision: 12,
		scale: 2,
		transformer: new DecimalToNumberTransformer(),
	})
	modifiersTotal: number; // Total cost of all modifiers

	@Column('decimal', {
		precision: 12,
		scale: 2,
		transformer: new DecimalToNumberTransformer(),
	})
	total: number; // Final total for this line item (subtotal + modifiersTotal)

	@Column({ type: 'varchar', length: 10, default: 'VND' })
	currency: string;

	@Column({ type: 'int', default: OrderItemStatus.PENDING })
	@Index('idx_order_item_status')
	status: OrderItemStatus; // Item-level status tracking

	@Column({ type: 'jsonb', nullable: true })
	modifiers: OrderItemModifier[]; // Selected modifiers

	@Column({ type: 'text', nullable: true })
	notes: string; // Special instructions for this item (e.g., "Well done", "No ice")

	@Column({ type: 'text', nullable: true })
	rejectionReason: string; // Reason if item was rejected

	@Column({ type: 'timestamp', nullable: true })
	acceptedAt: Date; // When item was accepted

	@Column({ type: 'timestamp', nullable: true })
	preparingAt: Date; // When preparation started

	@Column({ type: 'timestamp', nullable: true })
	readyAt: Date; // When item became ready

	@Column({ type: 'timestamp', nullable: true })
	servedAt: Date; // When item was served

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	// Relations
	@ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'orderId' })
	order: Order;
}

/**
 * OrderItemModifier Interface
 *
 * Represents a modifier applied to an order item
 * Stored as JSONB for flexibility
 */
export interface OrderItemModifier {
	/** Modifier group ID from menu */
	modifierGroupId: string;

	/** Modifier group name */
	modifierGroupName: string;

	/** Modifier option ID */
	modifierOptionId: string;

	/** Modifier option name (e.g., "Extra cheese", "Large size") */
	optionName: string;

	/** Additional price for this modifier */
	price: number;

	/** Currency */
	currency?: string;
}
