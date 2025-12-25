/**
 * MenuItemStatus Enum
 *
 * Represents the availability status of a menu item.
 * Stored as INTEGER in database for performance, mapped to STRING for API.
 *
 * Values:
 * - UNAVAILABLE (0): Item exists but is not available for ordering
 * - AVAILABLE (1): Item is available for ordering
 * - SOLD_OUT (2): Item is temporarily sold out
 */
export enum MenuItemStatus {
	UNAVAILABLE = 0,
	AVAILABLE = 1,
	SOLD_OUT = 2,
}

/**
 * Map MenuItemStatus enum values to human-readable strings
 */
export const MenuItemStatusLabels: Record<MenuItemStatus, string> = {
	[MenuItemStatus.UNAVAILABLE]: 'UNAVAILABLE',
	[MenuItemStatus.AVAILABLE]: 'AVAILABLE',
	[MenuItemStatus.SOLD_OUT]: 'SOLD_OUT',
};

/**
 * Map strings to MenuItemStatus enum values
 */
export const MenuItemStatusFromString: Record<string, MenuItemStatus> = {
	UNAVAILABLE: MenuItemStatus.UNAVAILABLE,
	unavailable: MenuItemStatus.UNAVAILABLE,
	AVAILABLE: MenuItemStatus.AVAILABLE,
	available: MenuItemStatus.AVAILABLE,
	SOLD_OUT: MenuItemStatus.SOLD_OUT,
	sold_out: MenuItemStatus.SOLD_OUT,
	'SOLD OUT': MenuItemStatus.SOLD_OUT,
	'sold out': MenuItemStatus.SOLD_OUT,
};

/**
 * Convert MenuItemStatus enum to string
 * @param status - MenuItemStatus enum value
 * @returns Uppercase string representation
 */
export function menuItemStatusToString(status: MenuItemStatus): string {
	return MenuItemStatusLabels[status] || 'UNAVAILABLE';
}

/**
 * Convert string to MenuItemStatus enum (case-insensitive)
 * @param status - String representation of status
 * @returns MenuItemStatus enum value
 * @throws Error if invalid status string provided
 */
export function menuItemStatusFromString(status: string): MenuItemStatus {
	if (typeof status === 'number') {
		// If already a number, validate it's a valid enum value
		if (Object.values(MenuItemStatus).includes(status)) {
			return status as MenuItemStatus;
		}
		throw new Error(`Invalid menu item status number: ${String(status)}`);
	}

	const normalized = status?.trim();
	const enumValue = MenuItemStatusFromString[normalized];

	if (enumValue === undefined) {
		throw new Error(
			`Invalid menu item status: ${status}. Must be one of: AVAILABLE, UNAVAILABLE, SOLD_OUT`,
		);
	}

	return enumValue;
}
