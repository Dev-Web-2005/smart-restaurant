import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
	ManyToOne,
	JoinColumn,
} from 'typeorm';

/**
 * KitchenItemStatus Enum
 *
 * Represents the status of an item in the kitchen
 * Mirrors OrderItemStatus but specific to kitchen processing
 */
export enum KitchenItemStatus {
	PENDING = 0, // Waiting to be started
	PREPARING = 1, // Currently being prepared
	READY = 2, // Ready for pickup
}

export const KitchenItemStatusLabels: Record<KitchenItemStatus, string> = {
	[KitchenItemStatus.PENDING]: 'PENDING',
	[KitchenItemStatus.PREPARING]: 'PREPARING',
	[KitchenItemStatus.READY]: 'READY',
};

/**
 * Kitchen Item Entity
 *
 * Represents an item in the Kitchen Display System
 * Tracks preparation status and timing for SLA monitoring
 */
@Entity('kitchen_items')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'orderId'])
export class KitchenItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', name: 'tenant_id' })
	tenantId: string;

	@Column({ type: 'uuid', name: 'order_id' })
	orderId: string;

	@Column({ type: 'uuid', name: 'order_item_id' })
	orderItemId: string;

	@Column({ type: 'uuid', name: 'table_id' })
	tableId: string;

	@Column({ type: 'uuid', name: 'menu_item_id' })
	menuItemId: string;

	@Column({ type: 'varchar', length: 255 })
	name: string;

	@Column({ type: 'int' })
	quantity: number;

	@Column({ type: 'jsonb', nullable: true })
	modifiers: any[];

	@Column({ type: 'text', nullable: true })
	notes: string;

	@Column({
		type: 'smallint',
		default: KitchenItemStatus.PENDING,
	})
	status: KitchenItemStatus;

	@Column({ type: 'int', default: 0 })
	priority: number;

	// Timing for SLA tracking
	@Column({ type: 'timestamp', name: 'received_at' })
	receivedAt: Date;

	@Column({ type: 'timestamp', name: 'started_at', nullable: true })
	startedAt: Date;

	@Column({ type: 'timestamp', name: 'completed_at', nullable: true })
	completedAt: Date;

	// Estimated prep time in minutes (from menu item config or default)
	@Column({ type: 'int', name: 'estimated_prep_time', default: 15 })
	estimatedPrepTime: number;

	@Column({ type: 'uuid', name: 'chef_id', nullable: true })
	chefId: string;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;

	// Virtual field for table number (populated from table service)
	tableNumber?: string;
}

/**
 * Kitchen Item History Entity
 *
 * Tracks status changes for analytics and reporting
 */
@Entity('kitchen_item_history')
@Index(['kitchenItemId'])
@Index(['tenantId', 'createdAt'])
export class KitchenItemHistory {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ type: 'uuid', name: 'kitchen_item_id' })
	kitchenItemId: string;

	@Column({ type: 'uuid', name: 'tenant_id' })
	tenantId: string;

	@Column({
		type: 'smallint',
		name: 'previous_status',
		nullable: true,
	})
	previousStatus: KitchenItemStatus;

	@Column({
		type: 'smallint',
		name: 'new_status',
	})
	newStatus: KitchenItemStatus;

	@Column({ type: 'uuid', name: 'changed_by', nullable: true })
	changedBy: string;

	@Column({ type: 'text', nullable: true })
	notes: string;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;
}
