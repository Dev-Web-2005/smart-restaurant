export enum CategoryStatus {
	INACTIVE = 0,
	ACTIVE = 1,
}

export const CategoryStatusLabels: Record<CategoryStatus, string> = {
	[CategoryStatus.INACTIVE]: 'INACTIVE',
	[CategoryStatus.ACTIVE]: 'ACTIVE',
};

// Map string to enum value
export const CategoryStatusFromString: Record<string, CategoryStatus> = {
	INACTIVE: CategoryStatus.INACTIVE,
	ACTIVE: CategoryStatus.ACTIVE,
};

// Helper functions for conversion
export function categoryStatusToString(status: CategoryStatus): string {
	return CategoryStatusLabels[status];
}

export function categoryStatusFromString(status: string): CategoryStatus {
	const upperStatus = status.toUpperCase();
	if (!(upperStatus in CategoryStatusFromString)) {
		throw new Error(`Invalid category status: ${status}. Must be ACTIVE or INACTIVE`);
	}
	return CategoryStatusFromString[upperStatus];
}
