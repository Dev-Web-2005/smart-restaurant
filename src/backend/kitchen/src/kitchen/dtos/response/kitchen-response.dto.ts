import {
	KitchenTicketStatus,
	KitchenTicketStatusLabels,
} from '../../../common/enums/ticket-status.enum';
import {
	KitchenTicketPriority,
	KitchenTicketPriorityLabels,
} from '../../../common/enums/ticket-priority.enum';
import {
	KitchenTicketItemStatus,
	KitchenTicketItemStatusLabels,
} from '../../../common/enums/ticket-item-status.enum';

/**
 * Response DTO for kitchen ticket item
 */
export class KitchenTicketItemResponseDto {
	id: string;
	ticketId: string;
	orderItemId: string;
	menuItemId: string;
	name: string;
	quantity: number;
	status: string;
	station: string;
	courseNumber?: number;
	modifiers?: any[];
	notes?: string;
	isAllergy: boolean;
	allergyInfo?: string;
	isRush: boolean;
	estimatedPrepTime?: number;
	elapsedSeconds: number;
	recallCount: number;
	recallReason?: string;
	startedAt?: Date;
	readyAt?: Date;
	cancelledAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Response DTO for kitchen ticket
 */
export class KitchenTicketResponseDto {
	id: string;
	tenantId: string;
	orderId: string;
	tableId: string;

	// Table snapshot (denormalized data for display)
	snapshotTableName?: string; // e.g., "Bàn 1", "VIP 2"
	snapshotFloorName?: string; // e.g., "Tầng 1", "Sân vườn"
	snapshotFloorNumber?: number; // Floor ordering number

	tableNumber?: string; // DEPRECATED: Use snapshotTableName instead
	ticketNumber?: string;
	status: string;
	priority: string;
	priorityLevel: number;
	customerName?: string;
	orderType?: string;
	notes?: string;
	assignedCookId?: string;
	assignedCookName?: string;

	// Timer info
	elapsedSeconds: number;
	elapsedFormatted: string; // "MM:SS" format
	estimatedPrepTime?: number;
	warningThreshold?: number;
	criticalThreshold?: number;
	isTimerPaused: boolean;
	totalPausedSeconds: number;
	ageColor: 'green' | 'yellow' | 'red';

	// Item counts
	totalItems: number;
	pendingItems: number;
	preparingItems: number;
	readyItems: number;

	// Timestamps
	startedAt?: Date;
	readyAt?: Date;
	completedAt?: Date;
	cancelledAt?: Date;
	createdAt: Date;
	updatedAt: Date;

	// Items
	items: KitchenTicketItemResponseDto[];
}

/**
 * Response DTO for paginated tickets
 */
export class PaginatedTicketsResponseDto {
	tickets: KitchenTicketResponseDto[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Response DTO for kitchen statistics
 */
export class KitchenStatsResponseDto {
	tenantId: string;
	period: {
		from: string;
		to: string;
	};

	// Ticket counts
	totalTickets: number;
	pendingTickets: number;
	inProgressTickets: number;
	completedTickets: number;
	cancelledTickets: number;

	// Timing stats
	averagePrepTime: number; // seconds
	averageWaitTime: number; // seconds before preparation starts
	longestPrepTime: number;
	shortestPrepTime: number;

	// Performance
	ticketsPerHour: number;
	itemsPerHour: number;
	onTimePercentage: number; // % completed within estimated time
	recallRate: number; // % of items recalled

	// By station (if filtered)
	stationStats?: {
		station: string;
		ticketCount: number;
		itemCount: number;
		avgPrepTime: number;
	}[];

	// By hour (for charts)
	hourlyDistribution?: {
		hour: number;
		ticketCount: number;
		avgPrepTime: number;
	}[];
}

/**
 * Response DTO for active kitchen display
 */
export class KitchenDisplayResponseDto {
	tenantId: string;
	timestamp: Date;

	// Active tickets organized by status/priority
	fireTickets: KitchenTicketResponseDto[]; // FIRE priority (immediate)
	urgentTickets: KitchenTicketResponseDto[]; // URGENT priority
	activeTickets: KitchenTicketResponseDto[]; // IN_PROGRESS normal/high priority
	pendingTickets: KitchenTicketResponseDto[]; // PENDING waiting to start
	readyTickets: KitchenTicketResponseDto[]; // READY for serving

	// Summary counts
	summary: {
		totalActive: number;
		totalPending: number;
		totalReady: number;
		oldestTicketAge: number; // seconds
		averageAge: number; // seconds
	};
}
