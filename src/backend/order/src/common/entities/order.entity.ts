import {
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	OneToMany,
	Index,
} from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderType } from '../enums/order-type.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { OrderItem } from './order-item.entity';

/**
 * Order Entity
 *
 * Represents a customer order in the restaurant
 * Implements multi-tenant isolation and supports the order lifecycle workflow
 *
 * Key Features:
 * - Multi-tenant support with tenantId
 * - Single order per table session
 * - Customers can add items to existing unpaid orders
 * - Pay-after-meal model
 * - Status tracking from PENDING to COMPLETED
 */
@Entity('orders')
@Index('idx_order_tenant_table_status', ['tenantId', 'tableId', 'status'])
@Index('idx_order_tenant_customer', ['tenantId', 'customerId'])
export class Order {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', nullable: false })
	@Index('idx_order_tenant_id')
	tenantId: string; // Multi-tenancy isolation

	@Column({ type: 'uuid', nullable: false })
	@Index('idx_order_table_id')
	tableId: string; // Table where customer is seated

	@Column({ type: 'uuid', nullable: true })
	customerId: string; // Customer who placed the order (nullable for guest orders)

	@Column({ type: 'varchar', length: 50, nullable: true })
	customerName: string; // Optional customer name for the order

	@Column({ type: 'int', default: OrderType.DINE_IN })
	orderType: OrderType;

	@Column({ type: 'int', default: OrderStatus.PENDING })
	@Index('idx_order_status')
	status: OrderStatus;

	@Column({ type: 'int', default: PaymentStatus.PENDING })
	paymentStatus: PaymentStatus;

	@Column({ type: 'varchar', length: 50, nullable: true })
	paymentMethod: string; // e.g., 'CASH', 'CARD', 'ZALOPAY', 'MOMO', 'VNPAY', 'STRIPE'

	@Column({ type: 'varchar', length: 255, nullable: true })
	paymentTransactionId: string; // Payment gateway transaction ID

	@Column('decimal', { precision: 12, scale: 2, default: 0 })
	subtotal: number; // Sum of all item prices

	@Column('decimal', { precision: 12, scale: 2, default: 0 })
	tax: number; // Tax amount (e.g., VAT)

	@Column('decimal', { precision: 12, scale: 2, default: 0 })
	discount: number; // Discount amount

	@Column('decimal', { precision: 12, scale: 2, default: 0 })
	total: number; // Final total (subtotal + tax - discount)

	@Column({ type: 'varchar', length: 10, default: 'VND' })
	currency: string;

	@Column({ type: 'text', nullable: true })
	notes: string; // Special instructions from customer

	@Column({ type: 'uuid', nullable: true })
	waiterId: string; // Waiter who accepted/managed the order

	@Column({ type: 'timestamp', nullable: true })
	acceptedAt: Date; // When waiter accepted the order

	@Column({ type: 'timestamp', nullable: true })
	preparingAt: Date; // When kitchen started preparing

	@Column({ type: 'timestamp', nullable: true })
	readyAt: Date; // When food was ready

	@Column({ type: 'timestamp', nullable: true })
	servedAt: Date; // When food was served to customer

	@Column({ type: 'timestamp', nullable: true })
	completedAt: Date; // When order was completed and paid

	@Column({ type: 'text', nullable: true })
	rejectionReason: string; // Reason if waiter rejected the order

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;

	// Relations
	@OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
		cascade: true,
		eager: true,
	})
	items: OrderItem[];

	// Computed properties
	get totalItems(): number {
		return this.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
	}

	get isEditable(): boolean {
		return [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(this.status);
	}

	get isPaid(): boolean {
		return this.paymentStatus === PaymentStatus.PAID;
	}
}
