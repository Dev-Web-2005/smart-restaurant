/**
 * Room Pattern Interface
 *
 * Defines hierarchical room naming patterns for multi-tenant isolation
 */
export interface RoomPattern {
	// Level 1: Tenant-wide broadcast
	tenant(tenantId: string): string;

	// Level 2: Role-based rooms
	waiters(tenantId: string): string;
	kitchen(tenantId: string): string;
	customers(tenantId: string): string;
	managers(tenantId: string): string;

	// Level 3: Table-specific rooms
	table(tenantId: string, tableId: string): string;

	// Level 4: Order-specific rooms
	order(tenantId: string, orderId: string): string;

	// Level 5: Personal waiter rooms
	waiter(tenantId: string, waiterId: string): string;
}

/**
 * Room Manager - Creates room names following naming convention
 */
export class RoomPatternManager implements RoomPattern {
	tenant(tenantId: string): string {
		return `tenant:${tenantId}`;
	}

	waiters(tenantId: string): string {
		return `tenant:${tenantId}:waiters`;
	}

	kitchen(tenantId: string): string {
		return `tenant:${tenantId}:kitchen`;
	}

	customers(tenantId: string): string {
		return `tenant:${tenantId}:customers`;
	}

	managers(tenantId: string): string {
		return `tenant:${tenantId}:managers`;
	}

	table(tenantId: string, tableId: string): string {
		return `tenant:${tenantId}:table:${tableId}`;
	}

	order(tenantId: string, orderId: string): string {
		return `tenant:${tenantId}:order:${orderId}`;
	}

	waiter(tenantId: string, waiterId: string): string {
		return `tenant:${tenantId}:waiter:${waiterId}`;
	}

	/**
	 * Helper: Get all rooms for a user based on their role
	 */
	getRoomsForUser(user: {
		tenantId: string;
		role: string;
		tableId?: string;
		waiterId?: string;
	}): string[] {
		const rooms: string[] = [this.tenant(user.tenantId)];

		switch (user.role) {
			case 'customer':
				rooms.push(this.customers(user.tenantId));
				if (user.tableId) {
					rooms.push(this.table(user.tenantId, user.tableId));
				}
				break;

			case 'waiter':
				rooms.push(this.waiters(user.tenantId));
				if (user.waiterId) {
					rooms.push(this.waiter(user.tenantId, user.waiterId));
				}
				break;

			case 'kitchen':
				rooms.push(this.kitchen(user.tenantId));
				break;

			case 'manager':
			case 'admin':
				rooms.push(this.managers(user.tenantId));
				rooms.push(this.waiters(user.tenantId)); // Managers see waiter alerts
				rooms.push(this.kitchen(user.tenantId)); // Managers see kitchen status
				break;
		}

		return rooms;
	}
}
