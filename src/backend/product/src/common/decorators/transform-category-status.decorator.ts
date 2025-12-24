import { Transform } from 'class-transformer';
import { categoryStatusFromString, CategoryStatus } from '../enums';

/**
 * Decorator to transform string status to CategoryStatus enum
 * Accepts: "ACTIVE", "INACTIVE" (case-insensitive)
 * Transforms to: CategoryStatus.ACTIVE (1), CategoryStatus.INACTIVE (0)
 */
export function TransformCategoryStatus() {
	return Transform(({ value }) => {
		if (value === undefined || value === null) {
			return value;
		}

		// If already a number (enum value), return as-is
		if (typeof value === 'number') {
			return value;
		}

		// If string, convert to enum
		if (typeof value === 'string') {
			return categoryStatusFromString(value);
		}

		throw new Error(`Invalid status value: ${value}`);
	});
}
