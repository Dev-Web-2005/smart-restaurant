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
 * Uses PATCH /items-status endpoint with status="ACCEPTED"
 * This triggers WebSocket event 'order.items.accepted' for customer notification
 *
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

		// ✅ Use PATCH /items-status instead of POST /accept-items
		// This endpoint emits 'order.items.accepted' via RabbitMQ → WebSocket
		const response = await apiClient.patch(
			`/tenants/${tenantId}/orders/${orderId}/items-status`,
			{
				itemIds,
				status: 'ACCEPTED', // Must be string, not number
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
 * Uses PATCH /items-status endpoint with status="REJECTED"
 * This triggers WebSocket event 'order.items.rejected' for customer notification
 *
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {Array<string>} params.itemIds - Array of order item IDs to reject
 * @param {string} params.waiterId - Waiter ID (UUID)
 * @param {string} params.reason - Rejection reason (required)
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

		// ✅ Use PATCH /items-status instead of POST /reject-items
		// This endpoint emits 'order.items.rejected' via RabbitMQ → WebSocket
		const response = await apiClient.patch(
			`/tenants/${tenantId}/orders/${orderId}/items-status`,
			{
				itemIds,
				status: 'REJECTED', // Must be string, not number
				rejectionReason: reason, // Field name matches DTO
				waiterId,
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
 * Uses PATCH /items-status endpoint with status="SERVED"
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

		const response = await apiClient.patch(
			`/tenants/${tenantId}/orders/${orderId}/items-status`,
			{
				itemIds,
				status: 'SERVED',
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

		const response = await apiClient.patch(
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
 * Uses PATCH /payment endpoint with paymentStatus="PAID"
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {string} params.paymentMethod - Payment method (CASH, CARD, MOMO, etc.)
 * @param {string} [params.paymentTransactionId] - Optional transaction ID
 * @returns {Promise<Object>} Response with updated order
 */
export const markOrderPaidAPI = async ({
	tenantId,
	orderId,
	paymentMethod,
	paymentTransactionId,
}) => {
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

		const response = await apiClient.patch(
			`/tenants/${tenantId}/orders/${orderId}/payment`,
			{
				paymentStatus: 'PAID',
				paymentMethod,
				...(paymentTransactionId && { paymentTransactionId }),
			},
		)

		return response.data
	} catch (error) {
		console.error('❌ Error marking order as paid:', error)
		throw error
	}
}

/**
 * Update order items status (generic)
 * PATCH /tenants/:tenantId/orders/:orderId/items-status
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {Array<string>} params.itemIds - Array of order item IDs to update
 * @param {string} params.status - New status (PENDING, ACCEPTED, PREPARING, READY, SERVED, REJECTED, CANCELLED)
 * @param {string} [params.userId] - User ID (kitchen staff, waiter, etc.)
 * @param {string} [params.rejectionReason] - Required if status is REJECTED
 * @returns {Promise<Object>} Response with updated order
 */
export const updateItemsStatusAPI = async ({
	tenantId,
	orderId,
	itemIds,
	status,
	userId,
	rejectionReason,
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
		if (!status || typeof status !== 'string') {
			throw new Error('Status is required and must be a string')
		}
		if (status === 'REJECTED' && !rejectionReason) {
			throw new Error('Rejection reason is required when status is REJECTED')
		}

		const payload = {
			itemIds,
			status,
		}

		if (userId) payload.waiterId = userId
		if (rejectionReason) payload.rejectionReason = rejectionReason

		const response = await apiClient.patch(
			`/tenants/${tenantId}/orders/${orderId}/items-status`,
			payload,
		)

		return response.data
	} catch (error) {
		console.error(`❌ Error updating items status to ${status}:`, error)
		throw error
	}
}

/**
 * Mark order items as PREPARING (kitchen starts cooking)
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {Array<string>} params.itemIds - Array of order item IDs
 * @param {string} params.userId - Kitchen staff ID (UUID)
 * @returns {Promise<Object>} Response with updated order
 */
export const markItemsPreparingAPI = async ({ tenantId, orderId, itemIds, userId }) => {
	return updateItemsStatusAPI({
		tenantId,
		orderId,
		itemIds,
		status: 'PREPARING',
		userId,
	})
}

/**
 * Mark order items as READY (kitchen finished cooking)
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.orderId - Order ID (UUID)
 * @param {Array<string>} params.itemIds - Array of order item IDs
 * @param {string} params.userId - Kitchen staff ID (UUID)
 * @returns {Promise<Object>} Response with updated order
 */
export const markItemsReadyAPI = async ({ tenantId, orderId, itemIds, userId }) => {
	return updateItemsStatusAPI({
		tenantId,
		orderId,
		itemIds,
		status: 'READY',
		userId,
	})
}

/**
 * Get customer order history
 * Only available for logged-in customers (not guest customers)
 *
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.customerId - Customer ID (UUID)
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Order status filter (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
 * @param {string} [params.paymentStatus] - Payment status filter (PENDING, PROCESSING, PAID, FAILED, REFUNDED)
 * @param {string} [params.sortBy='createdAt'] - Sort field (createdAt, updatedAt, total)
 * @param {string} [params.sortOrder='DESC'] - Sort order (ASC, DESC)
 * @returns {Promise<Object>} Response with orders data and pagination
 */
export const getOrderHistoryAPI = async ({
	tenantId,
	customerId,
	page = 1,
	limit = 20,
	status,
	paymentStatus,
	sortBy = 'createdAt',
	sortOrder = 'DESC',
}) => {
	try {
		// Validate required fields
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!customerId || typeof customerId !== 'string') {
			throw new Error('Customer ID is required and must be a string')
		}

		// Build query params
		const params = new URLSearchParams({
			page: page.toString(),
			limit: limit.toString(),
			sortBy,
			sortOrder,
		})

		if (status) params.append('status', status)
		if (paymentStatus) params.append('paymentStatus', paymentStatus)

		const response = await apiClient.get(
			`/tenants/${tenantId}/orders/customer/${customerId}/history?${params.toString()}`,
		)

		return {
			success: true,
			data: response.data?.data || response.data,
			message: response.data?.message || 'Order history retrieved successfully',
		}
	} catch (error) {
		console.error('❌ Error getting order history:', error)
		return {
			success: false,
			message:
				error.response?.data?.message || error.message || 'Failed to get order history',
			data: null,
		}
	}
}
