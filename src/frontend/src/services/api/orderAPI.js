// services/api/orderAPI.js
// Order API Service - For managing order operations (restaurant/staff side)

import apiClient from '../apiClient'

/**
 * Get orders with filtering
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Order status filter (PENDING, ACCEPTED, PREPARING, READY, SERVED, COMPLETED, CANCELLED)
 * @param {string} [params.tableId] - Table ID filter (UUID)
 * @param {string} [params.customerId] - Customer ID filter (UUID)
 * @param {string} [params.paymentStatus] - Payment status filter (PENDING, PROCESSING, PAID, FAILED, REFUNDED)
 * @returns {Promise<Object>} Response with orders data and pagination
 */
export const getOrdersAPI = async ({
	tenantId,
	page = 1,
	limit = 20,
	status,
	tableId,
	customerId,
	paymentStatus,
}) => {
	try {
		// Validate required fields
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		// Build query params
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
		})

		if (status) params.append('status', status)
		if (tableId) params.append('tableId', tableId)
		if (customerId) params.append('customerId', customerId)
		if (paymentStatus) params.append('paymentStatus', paymentStatus)

		const response = await apiClient.get(
			`/tenants/${tenantId}/orders?${params.toString()}`,
		)

		return response.data
	} catch (error) {
		console.error('❌ Error getting orders:', error)
		throw error
	}
}

/**
 * Get single order by ID
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @returns {Promise<Object>} Response with order details
 */
export const getOrderByIdAPI = async ({ tenantId, orderId }) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!orderId || typeof orderId !== 'string') {
			throw new Error('Order ID is required and must be a string')
		}

		const response = await apiClient.get(`/tenants/${tenantId}/orders/${orderId}`)

		return response.data
	} catch (error) {
		console.error('❌ Error getting order by ID:', error)
		throw error
	}
}

/**
 * Accept order items (waiter accepts pending items)
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {Array<string>} params.itemIds - Array of order item IDs to accept
 * @param {string} params.waiterId - Waiter ID (UUID)
 * @returns {Promise<Object>} Response with updated order
 */
export const acceptOrderItemsAPI = async ({ tenantId, orderId, itemIds, waiterId }) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!orderId || typeof orderId !== 'string') {
			throw new Error('Order ID is required and must be a string')
		}
		if (!Array.isArray(itemIds) || itemIds.length === 0) {
			throw new Error('Item IDs must be a non-empty array')
		}
		if (!waiterId || typeof waiterId !== 'string') {
			throw new Error('Waiter ID is required and must be a string')
		}

		const response = await apiClient.post(
			`/tenants/${tenantId}/orders/${orderId}/accept-items`,
			{
				itemIds,
				waiterId,
			},
		)

		return response.data
	} catch (error) {
		console.error('❌ Error accepting order items:', error)
		throw error
	}
}

/**
 * Reject order items (waiter rejects pending items)
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {Array<string>} params.itemIds - Array of order item IDs to reject
 * @param {string} params.waiterId - Waiter ID (UUID)
 * @param {string} params.reason - Rejection reason
 * @returns {Promise<Object>} Response with updated order
 */
export const rejectOrderItemsAPI = async ({
	tenantId,
	orderId,
	itemIds,
	waiterId,
	reason,
}) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!orderId || typeof orderId !== 'string') {
			throw new Error('Order ID is required and must be a string')
		}
		if (!Array.isArray(itemIds) || itemIds.length === 0) {
			throw new Error('Item IDs must be a non-empty array')
		}
		if (!waiterId || typeof waiterId !== 'string') {
			throw new Error('Waiter ID is required and must be a string')
		}
		if (!reason || typeof reason !== 'string') {
			throw new Error('Rejection reason is required and must be a string')
		}

		const response = await apiClient.post(
			`/tenants/${tenantId}/orders/${orderId}/reject-items`,
			{
				itemIds,
				waiterId,
				reason,
			},
		)

		return response.data
	} catch (error) {
		console.error('❌ Error rejecting order items:', error)
		throw error
	}
}

/**
 * Mark order items as served (waiter delivered to customer)
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {Array<string>} params.itemIds - Array of order item IDs to mark as served
 * @param {string} params.waiterId - Waiter ID (UUID)
 * @returns {Promise<Object>} Response with updated order
 */
export const markItemsServedAPI = async ({ tenantId, orderId, itemIds, waiterId }) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!orderId || typeof orderId !== 'string') {
			throw new Error('Order ID is required and must be a string')
		}
		if (!Array.isArray(itemIds) || itemIds.length === 0) {
			throw new Error('Item IDs must be a non-empty array')
		}
		if (!waiterId || typeof waiterId !== 'string') {
			throw new Error('Waiter ID is required and must be a string')
		}

		const response = await apiClient.post(
			`/tenants/${tenantId}/orders/${orderId}/mark-served`,
			{
				itemIds,
				waiterId,
			},
		)

		return response.data
	} catch (error) {
		console.error('❌ Error marking items as served:', error)
		throw error
	}
}

/**
 * Cancel an order
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {string} params.reason - Cancellation reason
 * @returns {Promise<Object>} Response with cancelled order
 */
export const cancelOrderAPI = async ({ tenantId, orderId, reason }) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!orderId || typeof orderId !== 'string') {
			throw new Error('Order ID is required and must be a string')
		}
		if (!reason || typeof reason !== 'string') {
			throw new Error('Cancellation reason is required and must be a string')
		}

		const response = await apiClient.post(
			`/tenants/${tenantId}/orders/${orderId}/cancel`,
			{
				reason,
			},
		)

		return response.data
	} catch (error) {
		console.error('❌ Error cancelling order:', error)
		throw error
	}
}

/**
 * Mark order as paid
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {string} params.paymentMethod - Payment method (CASH, CARD, MOMO, etc.)
 * @returns {Promise<Object>} Response with updated order
 */
export const markOrderPaidAPI = async ({ tenantId, orderId, paymentMethod }) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!orderId || typeof orderId !== 'string') {
			throw new Error('Order ID is required and must be a string')
		}
		if (!paymentMethod || typeof paymentMethod !== 'string') {
			throw new Error('Payment method is required and must be a string')
		}

		const response = await apiClient.post(
			`/tenants/${tenantId}/orders/${orderId}/mark-paid`,
			{
				paymentMethod,
			},
		)

		return response.data
	} catch (error) {
		console.error('❌ Error marking order as paid:', error)
		throw error
	}
}
