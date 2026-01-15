// services/api/cartAPI.js
// Cart API Service - For managing shopping cart operations

import apiClient from '../apiClient'

/**
 * Get cart for a specific table
 * @param {Object} params - Request parameters
 * @param {string} params.orderApiKey - Order API key from tenant
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.tableId - Table ID (UUID)
 * @returns {Promise<Object>} Response with cart data
 */
export const getCartAPI = async ({ orderApiKey, tenantId, tableId }) => {
	try {
		// Validate required fields
		if (!orderApiKey || typeof orderApiKey !== 'string') {
			throw new Error('Order API key is required and must be a string')
		}
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!tableId || typeof tableId !== 'string') {
			throw new Error('Table ID is required and must be a string')
		}

		const response = await apiClient.post('/order/cart/get', {
			orderApiKey,
			tenantId,
			tableId,
		})

		return response.data
	} catch (error) {
		console.error('❌ Error getting cart:', error)
		throw error
	}
}

/**
 * Add item to cart
 * @param {Object} params - Request parameters
 * @param {string} params.orderApiKey - Order API key from tenant
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.tableId - Table ID (UUID)
 * @param {string} [params.customerId] - Customer ID (optional for walk-in customers)
 * @param {string} params.menuItemId - Menu item ID (UUID)
 * @param {string} params.name - Item name
 * @param {number} params.quantity - Quantity (minimum: 1)
 * @param {number} params.price - Base price of the item (without modifiers)
 * @param {Array<Object>} [params.modifiers] - Array of modifier options
 * @param {string} params.modifiers[].modifierGroupId - Modifier group ID (UUID)
 * @param {string} params.modifiers[].modifierOptionId - Modifier option ID (UUID)
 * @param {string} params.modifiers[].name - Modifier option name (e.g., "Extra cheese")
 * @param {number} params.modifiers[].price - Additional price for this modifier
 * @param {string} [params.notes] - Special notes for the item
 * @returns {Promise<Object>} Response with updated cart data
 */
export const addToCartAPI = async ({
	orderApiKey,
	tenantId,
	tableId,
	customerId,
	menuItemId,
	name,
	quantity,
	price,
	modifiers = [],
	notes,
}) => {
	try {
		// Validate required fields
		if (!orderApiKey || typeof orderApiKey !== 'string') {
			throw new Error('Order API key is required and must be a string')
		}
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!tableId || typeof tableId !== 'string') {
			throw new Error('Table ID is required and must be a string')
		}
		if (!menuItemId || typeof menuItemId !== 'string') {
			throw new Error('Menu item ID is required and must be a string')
		}
		if (!name || typeof name !== 'string') {
			throw new Error('Item name is required and must be a string')
		}
		if (typeof quantity !== 'number' || quantity < 1) {
			throw new Error('Quantity must be a number and at least 1')
		}
		if (typeof price !== 'number' || price < 0) {
			throw new Error('Price must be a number and cannot be negative')
		}

		// Validate modifiers if provided
		if (modifiers && !Array.isArray(modifiers)) {
			throw new Error('Modifiers must be an array')
		}

		if (modifiers && modifiers.length > 0) {
			modifiers.forEach((modifier, index) => {
				if (!modifier.modifierGroupId || typeof modifier.modifierGroupId !== 'string') {
					throw new Error(
						`Modifier ${index}: modifierGroupId is required and must be a string`,
					)
				}
				if (!modifier.modifierOptionId || typeof modifier.modifierOptionId !== 'string') {
					throw new Error(
						`Modifier ${index}: modifierOptionId is required and must be a string`,
					)
				}
				if (!modifier.name || typeof modifier.name !== 'string') {
					throw new Error(`Modifier ${index}: name is required and must be a string`)
				}
				if (typeof modifier.price !== 'number' || modifier.price < 0) {
					throw new Error(
						`Modifier ${index}: price must be a number and cannot be negative`,
					)
				}
			})
		}

		const payload = {
			orderApiKey,
			tenantId,
			tableId,
			menuItemId,
			name,
			quantity,
			price,
		}

		// Add optional fields if provided
		if (customerId) {
			payload.customerId = customerId
		}
		if (modifiers && modifiers.length > 0) {
			payload.modifiers = modifiers
		}
		if (notes) {
			payload.notes = notes
		}

		const response = await apiClient.post('/order/cart/add', payload)

		return response.data
	} catch (error) {
		console.error('❌ Error adding to cart:', error)
		throw error
	}
}

/**
 * Update cart item quantity
 * @param {Object} params - Request parameters
 * @param {string} params.orderApiKey - Order API key from tenant
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.tableId - Table ID (UUID)
 * @param {string} params.itemKey - Unique item key (format: "menuItemId:modifiersHash")
 * @param {number} params.quantity - New quantity (minimum: 1)
 * @returns {Promise<Object>} Response with updated cart data
 */
export const updateCartItemQuantityAPI = async ({
	orderApiKey,
	tenantId,
	tableId,
	itemKey,
	quantity,
}) => {
	try {
		// Validate required fields
		if (!orderApiKey || typeof orderApiKey !== 'string') {
			throw new Error('Order API key is required and must be a string')
		}
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!tableId || typeof tableId !== 'string') {
			throw new Error('Table ID is required and must be a string')
		}
		if (!itemKey || typeof itemKey !== 'string') {
			throw new Error('Item key is required and must be a string')
		}
		if (typeof quantity !== 'number' || quantity < 1) {
			throw new Error('Quantity must be a number and at least 1')
		}

		const response = await apiClient.post('/order/cart/update-quantity', {
			orderApiKey,
			tenantId,
			tableId,
			itemKey,
			quantity,
		})

		return response.data
	} catch (error) {
		console.error('❌ Error updating cart item quantity:', error)
		throw error
	}
}

/**
 * Remove item from cart
 * @param {Object} params - Request parameters
 * @param {string} params.orderApiKey - Order API key from tenant
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.tableId - Table ID (UUID)
 * @param {string} params.itemKey - Unique item key to remove
 * @returns {Promise<Object>} Response with updated cart data
 */
export const removeCartItemAPI = async ({ orderApiKey, tenantId, tableId, itemKey }) => {
	try {
		// Validate required fields
		if (!orderApiKey || typeof orderApiKey !== 'string') {
			throw new Error('Order API key is required and must be a string')
		}
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!tableId || typeof tableId !== 'string') {
			throw new Error('Table ID is required and must be a string')
		}
		if (!itemKey || typeof itemKey !== 'string') {
			throw new Error('Item key is required and must be a string')
		}

		const response = await apiClient.post('/order/cart/remove-item', {
			orderApiKey,
			tenantId,
			tableId,
			itemKey,
		})

		return response.data
	} catch (error) {
		console.error('❌ Error removing cart item:', error)
		throw error
	}
}

/**
 * Clear entire cart
 * @param {Object} params - Request parameters
 * @param {string} params.orderApiKey - Order API key from tenant
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.tableId - Table ID (UUID)
 * @returns {Promise<Object>} Response confirming cart cleared
 */
export const clearCartAPI = async ({ orderApiKey, tenantId, tableId }) => {
	try {
		// Validate required fields
		if (!orderApiKey || typeof orderApiKey !== 'string') {
			throw new Error('Order API key is required and must be a string')
		}
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!tableId || typeof tableId !== 'string') {
			throw new Error('Table ID is required and must be a string')
		}

		const response = await apiClient.post('/order/cart/clear', {
			orderApiKey,
			tenantId,
			tableId,
		})

		return response.data
	} catch (error) {
		console.error('❌ Error clearing cart:', error)
		throw error
	}
}

/**
 * Checkout cart - Convert cart items to order
 * @param {Object} params - Request parameters
 * @param {string} params.orderApiKey - Order API key from tenant
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.tableId - Table ID (UUID)
 * @param {string} [params.customerId] - Customer ID (optional for walk-in customers)
 * @param {string} [params.customerName] - Customer name (optional)
 * @returns {Promise<Object>} Response with created/updated order
 *
 * Business Flow:
 * 1. Validates cart is not empty
 * 2. Fetches real prices from Product Service
 * 3. Creates new order or appends to existing order (same table session)
 * 4. Clears cart automatically
 * 5. Emits WebSocket event to notify waiters
 */
export const checkoutCartAPI = async ({
	orderApiKey,
	tenantId,
	tableId,
	customerId,
	customerName,
}) => {
	try {
		// Validate required fields
		if (!orderApiKey || typeof orderApiKey !== 'string') {
			throw new Error('Order API key is required and must be a string')
		}
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!tableId || typeof tableId !== 'string') {
			throw new Error('Table ID is required and must be a string')
		}

		const payload = {
			orderApiKey,
			tenantId,
			tableId,
		}

		// Add optional fields if provided
		if (customerId) {
			payload.customerId = customerId
		}
		if (customerName) {
			payload.customerName = customerName
		}

		const response = await apiClient.post('/order/cart/checkout', payload)

		return response.data
	} catch (error) {
		console.error('❌ Error during checkout:', error)
		throw error
	}
}
