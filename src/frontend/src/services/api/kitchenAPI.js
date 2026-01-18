import apiClient from '../apiClient'

/**
 * Kitchen API Service
 *
 * Handles all Kitchen Display System (KDS) API calls
 * Integrates with Kitchen Service backend endpoints
 */

/**
 * Get active kitchen display data (optimized for polling)
 * @param {string} tenantId - Tenant ID
 */
export const getKitchenDisplay = async (tenantId) => {
	try {
		const response = await apiClient.get(`/tenants/${tenantId}/kitchen/display`)
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
 * Get tickets with filtering and pagination
 * @param {string} tenantId - Tenant ID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.status - Filter by status (PENDING, IN_PROGRESS, READY, COMPLETED, CANCELLED)
 * @param {string} params.priority - Filter by priority (NORMAL, HIGH, URGENT, FIRE)
 * @param {string} params.tableId - Filter by table ID
 * @param {string} params.orderId - Filter by order ID
 */
export const getKitchenTickets = async (tenantId, params = {}) => {
	try {
		const queryParams = new URLSearchParams()
		if (params.page) queryParams.append('page', params.page.toString())
		if (params.limit) queryParams.append('limit', params.limit.toString())
		if (params.status) queryParams.append('status', params.status)
		if (params.priority) queryParams.append('priority', params.priority)
		if (params.tableId) queryParams.append('tableId', params.tableId)
		if (params.orderId) queryParams.append('orderId', params.orderId)

		const queryString = queryParams.toString()
		const url = queryString
			? `/tenants/${tenantId}/kitchen/tickets?${queryString}`
			: `/tenants/${tenantId}/kitchen/tickets`

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
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 */
export const getKitchenTicket = async (tenantId, ticketId) => {
	try {
		const response = await apiClient.get(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}`,
		)
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
 * Start preparing a ticket (PENDING → IN_PROGRESS)
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 * @param {Object} data - Optional cook assignment
 * @param {string} data.cookId - Cook ID
 * @param {string} data.cookName - Cook name
 */
export const startTicket = async (tenantId, ticketId, data = {}) => {
	try {
		const response = await apiClient.post(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/start`,
			data,
		)
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
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 * @param {string[]} itemIds - Array of item IDs to start
 */
export const startItems = async (tenantId, ticketId, itemIds) => {
	try {
		const response = await apiClient.post(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/items/start`,
			{ itemIds },
		)
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
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 * @param {string[]} itemIds - Array of item IDs to mark ready
 */
export const markItemsReady = async (tenantId, ticketId, itemIds) => {
	try {
		const response = await apiClient.post(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/items/ready`,
			{ itemIds },
		)
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
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 */
export const bumpTicket = async (tenantId, ticketId) => {
	try {
		const response = await apiClient.post(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/bump`,
			{},
		)
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
 * Recall items (need to remake)
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 * @param {string[]} itemIds - Array of item IDs to recall
 * @param {string} reason - Reason for recall
 */
export const recallItems = async (tenantId, ticketId, itemIds, reason) => {
	try {
		const response = await apiClient.post(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/items/recall`,
			{ itemIds, reason },
		)
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
 * Cancel specific items
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 * @param {string[]} itemIds - Array of item IDs to cancel
 */
export const cancelItems = async (tenantId, ticketId, itemIds) => {
	try {
		const response = await apiClient.post(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/items/cancel`,
			{ itemIds },
		)
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
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 */
export const cancelTicket = async (tenantId, ticketId) => {
	try {
		const response = await apiClient.patch(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/cancel`,
			{},
		)
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
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 * @param {string} priority - Priority level (NORMAL, HIGH, URGENT, FIRE)
 */
export const updateTicketPriority = async (tenantId, ticketId, priority) => {
	try {
		const response = await apiClient.patch(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/priority`,
			{ priority },
		)
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
 * @param {string} tenantId - Tenant ID
 * @param {string} ticketId - Ticket ID
 */
export const toggleTicketTimer = async (tenantId, ticketId) => {
	try {
		const response = await apiClient.patch(
			`/tenants/${tenantId}/kitchen/tickets/${ticketId}/timer`,
			{},
		)
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
 * @param {string} tenantId - Tenant ID
 */
export const getKitchenStats = async (tenantId) => {
	try {
		const response = await apiClient.get(`/tenants/${tenantId}/kitchen/stats`)
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

/**
 * Legacy API compatibility layer (old endpoints)
 * These can be removed if no longer needed
 */

/**
 * @deprecated Use getKitchenDisplay instead
 */
export const getKitchenItems = async (params = {}) => {
	console.warn('getKitchenItems is deprecated. Use getKitchenDisplay instead.')
	// Map to new API if needed
	return getKitchenDisplay(params.tenantId)
}

/**
 * Start preparing an item
 * @param {string} kitchenItemId - Kitchen item ID
 */
export const startPreparing = async (kitchenItemId) => {
	try {
		const response = await apiClient.post('/kitchen/start', { kitchenItemId })
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error starting preparation:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to start preparation',
		}
	}
}

/**
 * Mark item as ready
 * @param {string} kitchenItemId - Kitchen item ID
 */
export const markReady = async (kitchenItemId) => {
	try {
		const response = await apiClient.post('/kitchen/ready', { kitchenItemId })
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error marking item ready:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to mark item ready',
		}
	}
}

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
