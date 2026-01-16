import apiClient from '../apiClient'

/**
 * Kitchen API Service
 *
 * Handles all Kitchen Display System (KDS) API calls
 */

/**
 * Get kitchen items for display
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (PENDING, PREPARING, READY)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
export const getKitchenItems = async (params = {}) => {
	try {
		const queryParams = new URLSearchParams()
		if (params.status) queryParams.append('status', params.status)
		if (params.page) queryParams.append('page', params.page.toString())
		if (params.limit) queryParams.append('limit', params.limit.toString())

		const queryString = queryParams.toString()
		const url = queryString ? `/kitchen/items?${queryString}` : '/kitchen/items'

		const response = await apiClient.get(url)
		return {
			success: true,
			data: response.data.data,
		}
	} catch (error) {
		console.error('Error fetching kitchen items:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to fetch kitchen items',
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
