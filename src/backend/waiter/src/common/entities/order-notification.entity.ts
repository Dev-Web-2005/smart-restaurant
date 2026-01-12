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
 * PURE ALERT LAYER - "Chuông cửa" thông báo cho waiter
 *
 * Best Practice Architecture (Toast POS, Square, Uber Eats):
 * - Notification = Lightweight alert mechanism
 * - Business Logic = Separate operations on Order Service
 *
 * This entity ONLY tracks:
 * - When notification was created
 * - When waiter read it
 * - Basic metadata for display
 *
 * It does NOT track:
 * - Accept/Reject actions (handled by Order Service directly)
 * - Rejection reasons (stored in OrderItem)
 * - Response timestamps (tracked in OrderItem status changes)
 *
 * Waiter actions operate directly on Order Service:
 * - waiter calls orders:accept-items RPC
 * - waiter calls orders:reject-items RPC
 */
@Entity('order_notifications')
@Index('idx_notification_order_id', ['orderId'])
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

	@Column({ type: 'int', default: NotificationStatus.UNREAD })
	status: NotificationStatus; // UNREAD, READ, ARCHIVED only

	@Column({ type: 'varchar', length: 50, default: 'NEW_ITEMS' })
	notificationType: string; // NEW_ITEMS, ORDER_UPDATE, CUSTOMER_REQUEST, etc.

	@Column({ type: 'int', default: 0 })
	priority: number; // 0=normal, 1=high, 2=urgent

	@Column({ type: 'jsonb', nullable: true })
	itemIds: string[]; // List of order item IDs for display (read-only)

	@Column({ type: 'jsonb', nullable: true })
	metadata: Record<string, any>; // Additional context for display (customer name, etc.)

	@Column({ type: 'text', nullable: true })
	message: string; // Notification message for display

	@Column({ type: 'timestamp', nullable: true })
	readAt: Date; // When waiter first read notification

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	// --- Relationships ---
	// Note: Waiter service doesn't own the Order entity
	// Use orderId to query Order service if needed
}
