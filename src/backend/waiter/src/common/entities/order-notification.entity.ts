import {
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	Index,
} from 'typeorm';
import { NotificationStatus } from '../enums/notification-status.enum';

/**
 * OrderNotification Entity
 *
 * Tracks all order-related notifications sent to waiters
 * Each notification represents a request for waiter action
 *
 * Business Context:
 * - When customers add new items to an order, waiter needs to review
 * - Waiter can accept (send to kitchen) or reject items
 * - Provides audit trail of waiter actions
 * - Supports multiple waiters with assignment tracking
 *
 * Features:
 * - Auto-expiry after timeout
 * - Track response time (SLA monitoring)
 * - Support priority notifications (VIP tables, urgent requests)
 * - Link to specific order items for granular control
 */
@Entity('order_notifications')
@Index('idx_notification_order_id', ['orderId'])
@Index('idx_notification_waiter_id', ['waiterId'])
@Index('idx_notification_status', ['status'])
@Index('idx_notification_table_id', ['tableId'])
@Index('idx_notification_created_at', ['createdAt'])
export class OrderNotification {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	orderId: string; // Reference to order

	@Column({ type: 'varchar', length: 50, nullable: false })
	tableId: string; // Table identifier

	@Column({ type: 'varchar', length: 50, nullable: false })
	tenantId: string; // Restaurant/tenant identifier

	@Column({ type: 'uuid', nullable: true })
	waiterId: string; // Waiter who handled this notification

	@Column({ type: 'int', default: NotificationStatus.PENDING })
	status: NotificationStatus;

	@Column({ type: 'varchar', length: 50, default: 'NEW_ITEMS' })
	notificationType: string; // NEW_ITEMS, ORDER_UPDATE, CUSTOMER_REQUEST, etc.

	@Column({ type: 'int', default: 0 })
	priority: number; // 0=normal, 1=high, 2=urgent

	@Column({ type: 'jsonb', nullable: true })
	itemIds: string[]; // List of order item IDs related to this notification

	@Column({ type: 'jsonb', nullable: true })
	metadata: Record<string, any>; // Additional context (customer name, order type, etc.)

	@Column({ type: 'text', nullable: true })
	notes: string; // Customer notes or special requests

	@Column({ type: 'text', nullable: true })
	rejectionReason: string; // Reason for rejection if applicable

	@Column({ type: 'timestamp', nullable: true })
	viewedAt: Date; // When waiter first viewed notification

	@Column({ type: 'timestamp', nullable: true })
	respondedAt: Date; // When waiter accepted/rejected

	@Column({ type: 'timestamp', nullable: true })
	expiresAt: Date; // Auto-expire time (for SLA)

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	// --- Relationships ---
	// Note: Waiter service doesn't own the Order entity
	// Use orderId to query Order service if needed
}
