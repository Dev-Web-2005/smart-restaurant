import { ValueTransformer } from 'typeorm';

/**
 * DecimalToNumberTransformer
 *
 * TypeORM transformer to convert decimal columns from string to number
 * PostgreSQL returns decimals as strings to preserve precision
 * This transformer handles the conversion for easier JavaScript handling
 */
export class DecimalToNumberTransformer implements ValueTransformer {
	/**
	 * Convert value from database to JavaScript
	 * @param value - Value from database (usually string for decimals)
	 * @returns Converted number or null
	 */
	to(value: number): number {
		return value;
	}

	/**
	 * Convert value from JavaScript to database
	 * @param value - Value to store (string from database)
	 * @returns Converted number
	 */
	from(value: string | null): number | null {
		if (value === null || value === undefined) {
			return null;
		}
		return parseFloat(value);
	}
}
