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

/**
 * OrderItem Entity
 *
 * Represents individual items (line items) within an order
 * Each item can have custom modifiers selected by the customer
 *
 * Key Features:
 * - Stores snapshot of menu item at time of order
 * - Supports modifiers (e.g., "Extra cheese", "No onions")
 * - Tracks quantity and calculates item total
 * - Preserves data even if menu item is later deleted/modified
 */
@Entity('order_items')
@Index(['orderId'])
export class OrderItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	@Index()
	orderId: string; // Parent order

	@Column({ type: 'uuid', nullable: false })
	menuItemId: string; // Reference to menu item (snapshot)

	@Column({ type: 'varchar', length: 100, nullable: false })
	name: string; // Menu item name at time of order

	@Column({ type: 'text', nullable: true })
	description: string; // Menu item description (optional snapshot)

	@Column('decimal', { precision: 12, scale: 2 })
	unitPrice: number; // Price per unit at time of order

	@Column({ type: 'int', default: 1 })
	quantity: number; // Number of this item ordered

	@Column('decimal', { precision: 12, scale: 2 })
	subtotal: number; // unitPrice * quantity (before modifiers)

	@Column('decimal', { precision: 12, scale: 2 })
	modifiersTotal: number; // Total cost of all modifiers

	@Column('decimal', { precision: 12, scale: 2 })
	total: number; // Final total for this line item (subtotal + modifiersTotal)

	@Column({ type: 'varchar', length: 10, default: 'VND' })
	currency: string;

	@Column({ type: 'jsonb', nullable: true })
	modifiers: OrderItemModifier[]; // Selected modifiers

	@Column({ type: 'text', nullable: true })
	notes: string; // Special instructions for this item (e.g., "Well done", "No ice")

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
