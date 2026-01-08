import { ValueTransformer } from 'typeorm';

/**
 * Decimal to Number Transformer
 *
 * Converts PostgreSQL DECIMAL fields (returned as strings) to JavaScript numbers.
 * This prevents type inconsistencies when working with numeric fields.
 *
 * Usage:
 * ```typescript
 * @Column('decimal', { precision: 12, scale: 2, transformer: new DecimalToNumberTransformer() })
 * price: number;
 * ```
 *
 * Why needed:
 * - PostgreSQL returns DECIMAL as string to preserve precision
 * - JavaScript operations on strings cause concatenation instead of arithmetic
 * - This transformer ensures consistent numeric types throughout the application
 */
export class DecimalToNumberTransformer implements ValueTransformer {
	/**
	 * Convert value TO database (number → string/number)
	 * Database will handle the conversion to DECIMAL
	 */
	to(value: number | string | null | undefined): number | null {
		if (value === null || value === undefined) {
			return null;
		}
		return typeof value === 'string' ? parseFloat(value) : value;
	}

	/**
	 * Convert value FROM database (string → number)
	 * PostgreSQL DECIMAL comes back as string
	 */
	from(value: string | number | null | undefined): number | null {
		if (value === null || value === undefined) {
			return null;
		}
		return typeof value === 'string' ? parseFloat(value) : value;
	}
}
