/**
 * Table status enum
 * Represents the current state of a table in the restaurant
 */
export enum TableStatus {
	/** Table is available for new customers */
	AVAILABLE = 'AVAILABLE',

	/** Table is currently occupied by customers */
	OCCUPIED = 'OCCUPIED',

	/** Table is reserved for future booking */
	RESERVED = 'RESERVED',

	/** Table is under maintenance or temporarily unavailable */
	MAINTENANCE = 'MAINTENANCE',
}
