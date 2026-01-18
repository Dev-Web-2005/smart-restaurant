// hooks/useCart.js
// Custom hook for cart operations with Alert and Confirm integration

import { useState, useCallback } from 'react'
import {
	getCartAPI,
	addToCartAPI,
	updateCartItemQuantityAPI,
	removeCartItemAPI,
	clearCartAPI,
} from '../services/api/cartAPI'

/**
 * Custom hook for managing cart operations
 * @param {Object} config - Configuration object
 * @param {Function} config.showAlert - Function to show custom alert (from AlertContext)
 * @param {Function} config.showConfirm - Function to show custom confirm dialog
 * @returns {Object} Cart operations and state
 */
export const useCart = ({ showAlert, showConfirm } = {}) => {
	const [cart, setCart] = useState(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	/**
	 * Get cart data
	 */
	const getCart = useCallback(
		async ({ orderApiKey, tenantId, tableId }) => {
			setLoading(true)
			setError(null)
			try {
				const response = await getCartAPI({ orderApiKey, tenantId, tableId })

				if (response.code === 1000) {
					setCart(response.data)
					return response.data
				} else {
					throw new Error(response.message || 'Failed to get cart')
				}
			} catch (err) {
				const errorMessage =
					err.response?.data?.message || err.message || 'Failed to get cart'
				setError(errorMessage)

				if (showAlert) {
					showAlert('Error', errorMessage, 'error')
				}
				throw err
			} finally {
				setLoading(false)
			}
		},
		[showAlert],
	)

	/**
	 * Add item to cart
	 */
	const addToCart = useCallback(
		async (params) => {
			setLoading(true)
			setError(null)
			try {
				const response = await addToCartAPI(params)

				if (response.code === 1000) {
					setCart(response.data)

					if (showAlert) {
						showAlert(
							'Added to Cart',
							`${params.name} has been added to your cart`,
							'success',
						)
					}
					return response.data
				} else {
					throw new Error(response.message || 'Failed to add item to cart')
				}
			} catch (err) {
				const errorMessage =
					err.response?.data?.message || err.message || 'Failed to add item to cart'
				setError(errorMessage)

				if (showAlert) {
					showAlert('Error', errorMessage, 'error')
				}
				throw err
			} finally {
				setLoading(false)
			}
		},
		[showAlert],
	)

	/**
	 * Update cart item quantity
	 */
	const updateQuantity = useCallback(
		async (params) => {
			setLoading(true)
			setError(null)
			try {
				const response = await updateCartItemQuantityAPI(params)

				if (response.code === 1000) {
					setCart(response.data)

					if (showAlert) {
						showAlert(
							'Quantity Updated',
							`Item quantity updated to ${params.quantity}`,
							'success',
						)
					}
					return response.data
				} else {
					throw new Error(response.message || 'Failed to update quantity')
				}
			} catch (err) {
				const errorMessage =
					err.response?.data?.message || err.message || 'Failed to update quantity'
				setError(errorMessage)

				if (showAlert) {
					showAlert('Error', errorMessage, 'error')
				}
				throw err
			} finally {
				setLoading(false)
			}
		},
		[showAlert],
	)

	/**
	 * Remove item from cart (with confirmation)
	 */
	const removeItem = useCallback(
		async (params, { skipConfirm = false, itemName = 'this item' } = {}) => {
			// Show confirmation dialog if showConfirm is provided and skipConfirm is false
			if (showConfirm && !skipConfirm) {
				const confirmed = await showConfirm({
					title: 'Remove Item',
					message: `Are you sure you want to remove ${itemName} from your cart?`,
					type: 'warning',
					confirmText: 'Remove',
					cancelText: 'Cancel',
				})

				if (!confirmed) {
					return null // User cancelled
				}
			}

			setLoading(true)
			setError(null)
			try {
				const response = await removeCartItemAPI(params)

				if (response.code === 1000) {
					setCart(response.data)

					if (showAlert) {
						showAlert(
							'Item Removed',
							`${itemName} has been removed from your cart`,
							'success',
						)
					}
					return response.data
				} else {
					throw new Error(response.message || 'Failed to remove item')
				}
			} catch (err) {
				const errorMessage =
					err.response?.data?.message || err.message || 'Failed to remove item'
				setError(errorMessage)

				if (showAlert) {
					showAlert('Error', errorMessage, 'error')
				}
				throw err
			} finally {
				setLoading(false)
			}
		},
		[showAlert, showConfirm],
	)

	/**
	 * Clear entire cart (with confirmation)
	 */
	const clearCart = useCallback(
		async (params, { skipConfirm = false } = {}) => {
			// Show confirmation dialog if showConfirm is provided and skipConfirm is false
			if (showConfirm && !skipConfirm) {
				const confirmed = await showConfirm({
					title: 'Clear Cart',
					message:
						'Are you sure you want to remove all items from your cart? This action cannot be undone.',
					type: 'danger',
					confirmText: 'Clear All',
					cancelText: 'Cancel',
				})

				if (!confirmed) {
					return null // User cancelled
				}
			}

			setLoading(true)
			setError(null)
			try {
				const response = await clearCartAPI(params)

				if (response.code === 1000) {
					setCart(null)

					if (showAlert) {
						showAlert(
							'Cart Cleared',
							'All items have been removed from your cart',
							'success',
						)
					}
					return response.data
				} else {
					throw new Error(response.message || 'Failed to clear cart')
				}
			} catch (err) {
				const errorMessage =
					err.response?.data?.message || err.message || 'Failed to clear cart'
				setError(errorMessage)

				if (showAlert) {
					showAlert('Error', errorMessage, 'error')
				}
				throw err
			} finally {
				setLoading(false)
			}
		},
		[showAlert, showConfirm],
	)

	return {
		cart,
		loading,
		error,
		getCart,
		addToCart,
		updateQuantity,
		removeItem,
		clearCart,
	}
}

export default useCart
