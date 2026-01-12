// services/api/orderAPI.js
// Order API service for Order Management

import apiClient from '../apiClient'

/**
 * Order API Service
 * Base URL: /api/v1/tenants/:tenantId/orders
 *
 * Headers required:
 * - Authorization: Bearer {token} (from window.accessToken)
 * - x-api-key: (auto-added by apiClient)
 */

/**
 * Get all orders for a tenant (paginated)
 * GET /tenants/:tenantId/orders
 *
 * @param {string} tenantId - Tenant ID
 * @param {object} filters - Filter options
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 20)
 * @param {string} filters.status - Order status filter (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
 * @param {string} filters.tableId - Filter by table ID
 * @param {string} filters.customerId - Filter by customer ID
 * @param {string} filters.paymentStatus - Payment status filter (PENDING, PAID, FAILED)
 * @returns {Promise<object>} Response with orders list
 */
export const getOrdersAPI = async (tenantId, filters = {}) => {
	try {
		console.log('📋 Fetching orders:', {
			tenantId,
			page: filters.page,
			limit: filters.limit,
			status: filters.status,
			tableId: filters.tableId,
			customerId: filters.customerId,
			paymentStatus: filters.paymentStatus,
		})

		// Build query string
		const params = new URLSearchParams()
		if (filters.page) params.append('page', filters.page)
		if (filters.limit) params.append('limit', filters.limit)
		if (filters.status) params.append('status', filters.status)
		if (filters.tableId) params.append('tableId', filters.tableId)
		if (filters.customerId) params.append('customerId', filters.customerId)
		if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)

		const queryString = params.toString()
		const url = `/tenants/${tenantId}/orders${queryString ? `?${queryString}` : ''}`

		const response = await apiClient.get(url)

		console.log('✅ Orders fetched:', response.data)
		return {
			success: true,
			data: response.data.data,
			message: response.data.message || 'Orders fetched successfully',
		}
	} catch (error) {
		console.error('❌ Get orders error:', error)
		return {
			success: false,
			message: error.response?.data?.message || error.message || 'Failed to fetch orders',
			error: error.response?.data,
			data: { orders: [], total: 0 }, // Return empty array on error
		}
	}
}

/**
 * Get order by ID
 * GET /tenants/:tenantId/orders/:orderId
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} orderId - Order ID
 * @returns {Promise<object>} Response with order details
 */
export const getOrderByIdAPI = async (tenantId, orderId) => {
	try {
		console.log('📋 Fetching order by ID:', { tenantId, orderId })

		const response = await apiClient.get(`/tenants/${tenantId}/orders/${orderId}`)

		console.log('✅ Order fetched:', response.data)
		return {
			success: true,
			data: response.data.data,
			message: response.data.message || 'Order fetched successfully',
		}
	} catch (error) {
		console.error('❌ Get order by ID error:', error)
		return {
			success: false,
			message: error.response?.data?.message || error.message || 'Failed to fetch order',
			error: error.response?.data,
		}
	}
}

/**
 * Get active order for a table
 * GET /tenants/:tenantId/orders?tableId={tableId}&status=PENDING,IN_PROGRESS
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} tableId - Table ID
 * @returns {Promise<object>} Response with active order (if exists)
 */
export const getActiveOrderForTableAPI = async (tenantId, tableId) => {
	try {
		console.log('📋 Fetching active order for table:', { tenantId, tableId })

		// Get orders with PENDING or IN_PROGRESS status
		const response = await apiClient.get(
			`/tenants/${tenantId}/orders?tableId=${tableId}&limit=1`,
		)

		console.log('✅ Active order fetched:', response.data)

		const orders = response.data.data?.orders || []
		const activeOrder = orders.find(
			(order) => order.status === 'PENDING' || order.status === 'IN_PROGRESS',
		)

		return {
			success: true,
			data: activeOrder || null,
			message: activeOrder ? 'Active order found' : 'No active order',
		}
	} catch (error) {
		console.error('❌ Get active order error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message || error.message || 'Failed to fetch active order',
			error: error.response?.data,
			data: null,
		}
	}
}

/**
 * Convert status string to numeric enum value
 * Backend expects: PENDING=0, ACCEPTED=1, PREPARING=2, READY=3, SERVED=4, REJECTED=5, CANCELLED=6
 */
const statusToNumber = (status) => {
	const statusMap = {
		PENDING: 0,
		ACCEPTED: 1,
		PREPARING: 2,
		READY: 3,
		SERVED: 4,
		REJECTED: 5,
		CANCELLED: 6,
	}
	return statusMap[status] ?? status
}

/**
 * Update order items status (Kitchen/Waiter operations)
 * PATCH /tenants/:tenantId/orders/:orderId/items-status
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} orderId - Order ID
 * @param {object} statusUpdate - Status update data
 * @param {array} statusUpdate.itemIds - Array of item IDs to update
 * @param {string} statusUpdate.status - New status (ACCEPTED, PREPARING, READY, SERVED, REJECTED, CANCELLED)
 * @param {string} statusUpdate.rejectionReason - Reason for rejection (required if status=REJECTED)
 * @param {string} statusUpdate.waiterId - Waiter ID (optional)
 * @returns {Promise<object>} Response with updated order
 */
export const updateOrderItemsStatusAPI = async (tenantId, orderId, statusUpdate) => {
	try {
		console.log('📋 Updating order items status:', { tenantId, orderId, statusUpdate })

		const response = await apiClient.patch(
			`/tenants/${tenantId}/orders/${orderId}/items-status`,
			{
				itemIds: statusUpdate.itemIds,
				status: statusToNumber(statusUpdate.status), // Convert string to number
				rejectionReason: statusUpdate.rejectionReason || null,
				waiterId: statusUpdate.waiterId || null,
			},
		)

		console.log('✅ Order items status updated:', response.data)
		return {
			success: true,
			data: response.data.data,
			message: response.data.message || 'Order items updated successfully',
		}
	} catch (error) {
		console.error('❌ Update order items status error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message || error.message || 'Failed to update order items',
			error: error.response?.data,
		}
	}
}

/**
 * Update order payment status
 * PATCH /tenants/:tenantId/orders/:orderId/payment
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} orderId - Order ID
 * @param {object} paymentData - Payment data
 * @param {string} paymentData.paymentStatus - Payment status (PAID, FAILED)
 * @param {string} paymentData.paymentMethod - Payment method (CASH, MOMO, ZALOPAY, CARD)
 * @param {string} paymentData.paymentTransactionId - Transaction ID (optional)
 * @returns {Promise<object>} Response with updated order
 */
export const updateOrderPaymentAPI = async (tenantId, orderId, paymentData) => {
	try {
		console.log('📋 Updating order payment:', { tenantId, orderId, paymentData })

		const response = await apiClient.patch(
			`/tenants/${tenantId}/orders/${orderId}/payment`,
			{
				paymentStatus: paymentData.paymentStatus,
				paymentMethod: paymentData.paymentMethod,
				paymentTransactionId: paymentData.paymentTransactionId || null,
			},
		)

		console.log('✅ Order payment updated:', response.data)
		return {
			success: true,
			data: response.data.data,
			message: response.data.message || 'Payment updated successfully',
		}
	} catch (error) {
		console.error('❌ Update order payment error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message || error.message || 'Failed to update payment',
			error: error.response?.data,
		}
	}
}

/**
 * Cancel order
 * PATCH /tenants/:tenantId/orders/:orderId/cancel
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object>} Response
 */
export const cancelOrderAPI = async (tenantId, orderId, reason) => {
	try {
		console.log('� Cancelling order:', { tenantId, orderId, reason })

		const response = await apiClient.patch(
			`/tenants/${tenantId}/orders/${orderId}/cancel`,
			{ reason },
		)

		console.log('✅ Order cancelled:', response.data)
		return {
			success: true,
			data: response.data.data,
			message: response.data.message || 'Order cancelled successfully',
		}
	} catch (error) {
		console.error('❌ Cancel order error:', error)
		return {
			success: false,
			message: error.response?.data?.message || error.message || 'Failed to cancel order',
			error: error.response?.data,
		}
	}
}
