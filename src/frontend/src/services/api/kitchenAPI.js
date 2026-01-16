import apiClient from '../apiClient'

/**
 * Kitchen API Service
 *
 * Handles all Kitchen Display System (KDS) API calls
 * Updated to use new Kitchen Service endpoints (Ticket-based architecture)
 */

/**
 * Get active kitchen display data (optimized for polling)
 */
export const getKitchenDisplay = async () => {
	try {
		const response = await apiClient.get('/kitchen/display')
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error fetching kitchen display:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to fetch kitchen display',
		}
	}
}

/**
 * Get kitchen tickets with filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.status - Filter by status (PENDING, IN_PROGRESS, READY, COMPLETED, CANCELLED)
 * @param {string} params.priority - Filter by priority (NORMAL, HIGH, URGENT, FIRE)
 * @param {string} params.tableId - Filter by table ID
 * @param {string} params.orderId - Filter by order ID
 */
export const getKitchenTickets = async (params = {}) => {
	try {
		const queryParams = new URLSearchParams()
		if (params.page) queryParams.append('page', params.page.toString())
		if (params.limit) queryParams.append('limit', params.limit.toString())
		if (params.status) queryParams.append('status', params.status)
		if (params.priority) queryParams.append('priority', params.priority)
		if (params.tableId) queryParams.append('tableId', params.tableId)
		if (params.orderId) queryParams.append('orderId', params.orderId)

		const queryString = queryParams.toString()
		const url = queryString ? `/kitchen/tickets?${queryString}` : '/kitchen/tickets'

		const response = await apiClient.get(url)
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error fetching kitchen tickets:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to fetch kitchen tickets',
		}
	}
}

/**
 * Get single ticket by ID
 * @param {string} ticketId - Ticket ID
 */
export const getKitchenTicket = async (ticketId) => {
	try {
		const response = await apiClient.get(`/kitchen/tickets/${ticketId}`)
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error fetching kitchen ticket:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to fetch kitchen ticket',
		}
	}
}

/**
 * Start preparing a ticket
 * @param {string} ticketId - Ticket ID
 * @param {Object} data - Optional cook data
 * @param {string} data.cookId - Cook ID
 * @param {string} data.cookName - Cook name
 */
export const startTicket = async (ticketId, data = {}) => {
	try {
		const response = await apiClient.post(`/kitchen/tickets/${ticketId}/start`, data)
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error starting ticket:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to start ticket',
		}
	}
}

/**
 * Start preparing specific items
 * @param {string} ticketId - Ticket ID
 * @param {string[]} itemIds - Array of item IDs to start
 */
export const startTicketItems = async (ticketId, itemIds) => {
	try {
		const response = await apiClient.post(`/kitchen/tickets/${ticketId}/items/start`, {
			itemIds,
		})
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error starting items:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to start items',
		}
	}
}

/**
 * Mark items as ready
 * @param {string} ticketId - Ticket ID
 * @param {string[]} itemIds - Array of item IDs to mark ready
 */
export const markItemsReady = async (ticketId, itemIds) => {
	try {
		const response = await apiClient.post(`/kitchen/tickets/${ticketId}/items/ready`, {
			itemIds,
		})
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error marking items ready:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to mark items ready',
		}
	}
}

/**
 * Bump (complete) a ticket
 * @param {string} ticketId - Ticket ID
 */
export const bumpTicket = async (ticketId) => {
	try {
		const response = await apiClient.post(`/kitchen/tickets/${ticketId}/bump`)
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error bumping ticket:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to bump ticket',
		}
	}
}

/**
 * Recall items (remake)
 * @param {string} ticketId - Ticket ID
 * @param {string[]} itemIds - Array of item IDs to recall
 * @param {string} reason - Reason for recall
 */
export const recallItems = async (ticketId, itemIds, reason) => {
	try {
		const response = await apiClient.post(`/kitchen/tickets/${ticketId}/items/recall`, {
			itemIds,
			reason,
		})
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error recalling items:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to recall items',
		}
	}
}

/**
 * Cancel items
 * @param {string} ticketId - Ticket ID
 * @param {string[]} itemIds - Array of item IDs to cancel
 * @param {string} reason - Reason for cancellation
 */
export const cancelItems = async (ticketId, itemIds, reason) => {
	try {
		const response = await apiClient.post(`/kitchen/tickets/${ticketId}/items/cancel`, {
			itemIds,
			reason,
		})
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error cancelling items:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to cancel items',
		}
	}
}

/**
 * Cancel entire ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} reason - Reason for cancellation
 */
export const cancelTicket = async (ticketId, reason) => {
	try {
		const response = await apiClient.patch(`/kitchen/tickets/${ticketId}/cancel`, {
			reason,
		})
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error cancelling ticket:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to cancel ticket',
		}
	}
}

/**
 * Update ticket priority
 * @param {string} ticketId - Ticket ID
 * @param {string} priority - Priority level (NORMAL, HIGH, URGENT, FIRE)
 */
export const updateTicketPriority = async (ticketId, priority) => {
	try {
		const response = await apiClient.patch(`/kitchen/tickets/${ticketId}/priority`, {
			priority,
		})
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error updating priority:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to update priority',
		}
	}
}

/**
 * Toggle ticket timer (pause/resume)
 * @param {string} ticketId - Ticket ID
 * @param {boolean} pause - True to pause, false to resume
 */
export const toggleTicketTimer = async (ticketId, pause) => {
	try {
		const response = await apiClient.patch(`/kitchen/tickets/${ticketId}/timer`, {
			pause,
		})
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error toggling timer:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to toggle timer',
		}
	}
}

/**
 * Get kitchen statistics
 */
export const getKitchenStats = async () => {
	try {
		const response = await apiClient.get('/kitchen/stats')
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error fetching kitchen stats:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to fetch kitchen stats',
		}
	}
}

// ========== LEGACY API COMPATIBILITY (for old code) ==========
/**
 * Batch start preparing items
 * @param {string[]} kitchenItemIds - Array of kitchen item IDs
 */
export const batchStartPreparing = async (kitchenItemIds) => {
	try {
		const response = await apiClient.post('/kitchen/batch-start', { kitchenItemIds })
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error batch starting preparation:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to batch start preparation',
		}
	}
}

/**
 * Batch mark items as ready
 * @param {string[]} kitchenItemIds - Array of kitchen item IDs
 */
export const batchMarkReady = async (kitchenItemIds) => {
	try {
		const response = await apiClient.post('/kitchen/batch-ready', { kitchenItemIds })
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error batch marking ready:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to batch mark ready',
		}
	}
}

/**
 * Get preparation history
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (ISO format)
 * @param {string} params.endDate - End date (ISO format)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export const getKitchenHistory = async (params = {}) => {
	try {
		const queryParams = new URLSearchParams()
		if (params.startDate) queryParams.append('startDate', params.startDate)
		if (params.endDate) queryParams.append('endDate', params.endDate)
		if (params.page) queryParams.append('page', params.page.toString())
		if (params.limit) queryParams.append('limit', params.limit.toString())

		const queryString = queryParams.toString()
		const url = queryString ? `/kitchen/history?${queryString}` : '/kitchen/history'

		const response = await apiClient.get(url)
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error fetching kitchen history:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to fetch kitchen history',
		}
	}
}
