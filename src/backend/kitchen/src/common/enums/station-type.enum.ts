/**
 * KitchenStationType Enum
 *
 * Represents different kitchen stations/sections
 * Items can be routed to specific stations for preparation
 *
 * Best Practice: Professional kitchen organization (brigade system)
 */
export enum KitchenStationType {
	/** Main grill station - steaks, burgers, grilled items */
	GRILL = 'GRILL',

	/** Fry station - fried items, tempura */
	FRY = 'FRY',

	/** Sauté station - pan-fried, stir-fry */
	SAUTE = 'SAUTE',

	/** Cold station - salads, cold appetizers */
	COLD = 'COLD',

	/** Dessert station - desserts, pastries */
	DESSERT = 'DESSERT',

	/** Beverage station - drinks, bar items */
	BEVERAGE = 'BEVERAGE',

	/** General station - catch-all for unassigned items */
	GENERAL = 'GENERAL',

	/** Expediter - final assembly and quality check */
	EXPO = 'EXPO',
}

/**
 * Station display names for UI
 */
export const KitchenStationLabels: Record<KitchenStationType, string> = {
	[KitchenStationType.GRILL]: 'Grill Station',
	[KitchenStationType.FRY]: 'Fry Station',
	[KitchenStationType.SAUTE]: 'Sauté Station',
	[KitchenStationType.COLD]: 'Cold Station',
	[KitchenStationType.DESSERT]: 'Dessert Station',
	[KitchenStationType.BEVERAGE]: 'Beverage Station',
	[KitchenStationType.GENERAL]: 'General Kitchen',
	[KitchenStationType.EXPO]: 'Expediter',
};

/**
 * Get station color for display
 */
export function getStationColor(station: KitchenStationType): string {
	switch (station) {
		case KitchenStationType.GRILL:
			return '#FF4500'; // Orange-Red
		case KitchenStationType.FRY:
			return '#FFD700'; // Gold
		case KitchenStationType.SAUTE:
			return '#FF8C00'; // Dark Orange
		case KitchenStationType.COLD:
			return '#00CED1'; // Dark Turquoise
		case KitchenStationType.DESSERT:
			return '#FF69B4'; // Hot Pink
		case KitchenStationType.BEVERAGE:
			return '#4169E1'; // Royal Blue
		case KitchenStationType.EXPO:
			return '#32CD32'; // Lime Green
		case KitchenStationType.GENERAL:
		default:
			return '#808080'; // Gray
	}
}
