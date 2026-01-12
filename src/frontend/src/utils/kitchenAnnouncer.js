/**
 * Kitchen Order Announcer
 * Generates text-to-speech announcements for preparing orders
 */

/**
 * Generate announcement text for a single order item
 * @param {object} item - Order item object
 * @returns {string} - Announcement text
 */
const generateItemAnnouncement = (item) => {
	let text = `${item.quantity} ${item.name}`

	// Add modifiers if present
	if (item.modifiers && item.modifiers.length > 0) {
		const modifierTexts = item.modifiers.map((mod) => {
			const groupName = mod.modifierGroupName || 'Option'
			const optionName = mod.optionName || mod.name || 'unknown'
			return `${groupName}: ${optionName}`
		})
		text += `. Modifiers: ${modifierTexts.join(', ')}`
	}

	// Add time remaining if preparing
	if (item.preparingAt) {
		const elapsed = calculateElapsedMinutes(item.preparingAt)
		const estimatedTime = item.estimatedPrepTime || 15
		const remaining = estimatedTime - elapsed

		if (remaining > 0) {
			text += `. ${remaining} minutes remaining`
		} else {
			text += `. Overdue by ${Math.abs(remaining)} minutes`
		}
	}

	return text
}

/**
 * Calculate elapsed minutes since timestamp
 * @param {string|Date} timestamp - Start timestamp
 * @returns {number} - Elapsed minutes
 */
const calculateElapsedMinutes = (timestamp) => {
	const start = new Date(timestamp)
	const now = new Date()
	const diffMs = now - start
	return Math.floor(diffMs / 60000)
}

/**
 * Generate announcement text for all preparing orders
 * @param {Array} orders - Array of orders with items
 * @returns {string} - Full announcement text
 */
export const generateKitchenAnnouncement = (orders) => {
	if (!orders || orders.length === 0) {
		return 'No orders are currently preparing'
	}

	const announcements = []

	// Sort orders by table name for consistent order
	const sortedOrders = [...orders].sort((a, b) => {
		const tableA = a.table?.name || `Table ${a.tableId}` || ''
		const tableB = b.table?.name || `Table ${b.tableId}` || ''
		return tableA.localeCompare(tableB)
	})

	sortedOrders.forEach((order) => {
		const tableName = order.table?.name || `Table ${order.tableId}` || 'Unknown table'
		const itemCount = order.items.length

		// Start with table announcement
		let orderText = `${tableName}. ${itemCount} ${itemCount === 1 ? 'item' : 'items'}.`

		// Add each item
		order.items.forEach((item, index) => {
			orderText += ` Item ${index + 1}: ${generateItemAnnouncement(item)}.`
		})

		announcements.push(orderText)
	})

	return announcements.join(' Next order: ')
}

/**
 * Generate announcement for newly added items
 * @param {Array} newItems - Array of new items with their order info
 * @returns {string} - Announcement text
 */
export const generateNewItemsAnnouncement = (newItems) => {
	if (!newItems || newItems.length === 0) {
		return ''
	}

	const itemsByTable = {}

	// Group items by table
	newItems.forEach((item) => {
		const tableName = item.tableName || 'Unknown table'
		if (!itemsByTable[tableName]) {
			itemsByTable[tableName] = []
		}
		itemsByTable[tableName].push(item)
	})

	const announcements = []

	Object.entries(itemsByTable).forEach(([tableName, items]) => {
		let text = `New order for ${tableName}. ${items.length} ${
			items.length === 1 ? 'item' : 'items'
		}.`

		items.forEach((item, index) => {
			text += ` Item ${index + 1}: ${generateItemAnnouncement(item)}.`
		})

		announcements.push(text)
	})

	return announcements.join(' ')
}

/**
 * Create unique key for an order item
 * @param {string} orderId - Order ID
 * @param {string} itemId - Item ID
 * @returns {string} - Unique key
 */
export const createItemKey = (orderId, itemId) => {
	return `${orderId}-${itemId}`
}

/**
 * Extract all preparing items with their order context
 * @param {Array} orders - Array of orders
 * @returns {Array} - Array of items with table info
 */
export const extractPreparingItems = (orders) => {
	const items = []

	orders.forEach((order) => {
		const tableName = order.table?.name || `Table ${order.tableId}` || 'Unknown'

		order.items.forEach((item) => {
			items.push({
				...item,
				orderId: order.id,
				tableName,
				itemKey: createItemKey(order.id, item.id),
			})
		})
	})

	return items
}
