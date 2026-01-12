// services/api/cartAPI.js
// Cart API service for Order & Cart Management

import apiClient from '../apiClient'

/**
 * Cart API Service
 * Base URL: /api/v1/tenants/:tenantId/tables/:tableId/cart
 *
 * Headers required:
 * - Authorization: Bearer {token} (from window.accessToken)
 * - x-api-key: (auto-added by apiClient)
 */

/**
 * Add item to cart
 * POST /tenants/:tenantId/tables/:tableId/cart/items
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} tableId - Table ID
 * @param {object} item - Item to add
 * @param {string} item.menuItemId - Menu item UUID
 * @param {number} item.quantity - Quantity
 * @param {number} item.price - Item price (for display, backend will validate)
 * @param {array} item.modifiers - Array of modifiers [{modifierId, modifierName, price}]
 * @param {string} item.notes - Special instructions
 * @returns {Promise<object>} Response with cart item
 */
export const addItemToCartAPI = async (tenantId, tableId, item) => {
	try {
		console.log('🛒 Adding item to cart:', { tenantId, tableId, item })

		const response = await apiClient.post(
			`/tenants/${tenantId}/tables/${tableId}/cart/items`,
			{
				menuItemId: item.menuItemId,
				quantity: item.quantity || 1,
				price: item.price,
				modifiers: item.modifiers || [],
				notes: item.notes || '',
			},
		)

		console.log('✅ Item added to cart:', response.data)
		return {
			success: true,
			data: response.data.data,
			message: response.data.message || 'Item added to cart',
		}
	} catch (error) {
		console.error('❌ Add to cart error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message || error.message || 'Failed to add item to cart',
			error: error.response?.data,
		}
	}
}

/**
 * Get cart contents
 * GET /tenants/:tenantId/tables/:tableId/cart
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} tableId - Table ID
 * @returns {Promise<object>} Response with cart items
 */
export const getCartAPI = async (tenantId, tableId) => {
	try {
		console.log('🛒 Fetching cart:', { tenantId, tableId })

		const response = await apiClient.get(`/tenants/${tenantId}/tables/${tableId}/cart`)

		console.log('✅ Cart fetched:', response.data)
		return {
			success: true,
			data: response.data.data,
			message: response.data.message || 'Cart fetched successfully',
		}
	} catch (error) {
		console.error('❌ Get cart error:', error)

		// If cart is empty or not found, return empty cart
		if (error.response?.status === 404) {
			return {
				success: true,
				data: {
					items: [],
					subtotal: 0,
					total: 0,
				},
			}
		}

		return {
			success: false,
			message: error.response?.data?.message || error.message || 'Failed to fetch cart',
			error: error.response?.data,
		}
	}
}

/**
 * Update item quantity in cart
 * PATCH /tenants/:tenantId/tables/:tableId/cart/items/:itemKey
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} tableId - Table ID
 * @param {string} itemKey - Unique item key (NOT menuItemId)
 * @param {number} quantity - New quantity
 * @returns {Promise<object>} Response with updated cart
 */
export const updateCartItemQuantityAPI = async (tenantId, tableId, itemKey, quantity) => {
	try {
		console.log('🛒 Updating cart item quantity:', {
			tenantId,
			tableId,
			itemKey,
			quantity,
		})

		const response = await apiClient.patch(
			`/tenants/${tenantId}/tables/${tableId}/cart/items/${itemKey}`,
			{ quantity },
		)

		console.log('✅ Cart item updated:', response.data)
		return {
			success: true,
			data: response.data.data,
			message: response.data.message || 'Cart updated successfully',
		}
	} catch (error) {
		console.error('❌ Update cart item error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message || error.message || 'Failed to update cart item',
			error: error.response?.data,
		}
	}
}

/**
 * Remove item from cart
 * DELETE /tenants/:tenantId/tables/:tableId/cart/items/:itemKey
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} tableId - Table ID
 * @param {string} itemKey - Unique item key (NOT menuItemId)
 * @returns {Promise<object>} Response
 */
export const removeCartItemAPI = async (tenantId, tableId, itemKey) => {
	try {
		console.log('🛒 Removing cart item:', { tenantId, tableId, itemKey })

		const response = await apiClient.delete(
			`/tenants/${tenantId}/tables/${tableId}/cart/items/${itemKey}`,
		)

		console.log('✅ Cart item removed:', response.data)
		return {
			success: true,
			message: response.data.message || 'Item removed from cart',
		}
	} catch (error) {
		console.error('❌ Remove cart item error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message ||
				error.message ||
				'Failed to remove item from cart',
			error: error.response?.data,
		}
	}
}

/**
 * Clear entire cart
 * DELETE /tenants/:tenantId/tables/:tableId/cart
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} tableId - Table ID
 * @returns {Promise<object>} Response
 */
export const clearCartAPI = async (tenantId, tableId) => {
	try {
		console.log('🛒 Clearing cart:', { tenantId, tableId })

		const response = await apiClient.delete(`/tenants/${tenantId}/tables/${tableId}/cart`)

		console.log('✅ Cart cleared:', response.data)
		return {
			success: true,
			message: response.data.message || 'Cart cleared successfully',
		}
	} catch (error) {
		console.error('❌ Clear cart error:', error)
		return {
			success: false,
			message: error.response?.data?.message || error.message || 'Failed to clear cart',
			error: error.response?.data,
		}
	}
}

/**
 * Checkout cart - Create or append to order
 * POST /tenants/:tenantId/tables/:tableId/cart/checkout
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} tableId - Table ID
 * @param {object} checkoutData - Checkout information
 * @param {string} checkoutData.customerId - Customer UUID (optional for guest)
 * @param {string} checkoutData.customerName - Customer name (required)
 * @param {string} checkoutData.customerPhone - Customer phone (optional)
 * @param {string} checkoutData.notes - Order notes (optional)
 * @returns {Promise<object>} Response with order details
 */
export const checkoutCartAPI = async (tenantId, tableId, checkoutData) => {
	try {
		console.log('🛒 Checking out cart:', { tenantId, tableId, checkoutData })

		const response = await apiClient.post(
			`/tenants/${tenantId}/tables/${tableId}/cart/checkout`,
			{
				customerId: checkoutData.customerId || null,
				customerName: checkoutData.customerName || 'Guest',
				customerPhone: checkoutData.customerPhone || null,
				notes: checkoutData.notes || '',
			},
		)

		console.log('✅ Checkout successful:', response.data)
		return {
			success: true,
			data: response.data.data, // Contains order details
			message: response.data.message || 'Order placed successfully',
		}
	} catch (error) {
		console.error('❌ Checkout error:', error)
		return {
			success: false,
			message: error.response?.data?.message || error.message || 'Failed to checkout',
			error: error.response?.data,
		}
	}
}
