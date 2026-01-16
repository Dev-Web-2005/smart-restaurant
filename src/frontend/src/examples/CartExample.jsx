/**
 * CART API INTEGRATION - USAGE GUIDE
 * ==================================
 *
 * This file demonstrates how to use the Cart API with custom Alert and Confirm dialogs.
 *
 * Backend Endpoints:
 * - cart:get - Get cart for a table
 * - cart:add - Add item to cart
 * - cart:update-quantity - Update item quantity
 * - cart:remove-item - Remove item from cart
 * - cart:clear - Clear entire cart
 */

import React, { useEffect, useState } from 'react'
import { useAlert } from '../contexts/AlertContext'
import { useCart } from '../hooks/useCart'

const CartExample = () => {
	const { showAlert, showConfirm } = useAlert()
	const {
		cart,
		loading,
		error,
		getCart,
		addToCart,
		updateQuantity,
		removeItem,
		clearCart,
	} = useCart({ showAlert, showConfirm })

	// Cart configuration (from your restaurant/table context)
	const [cartConfig] = useState({
		orderApiKey: 'your-order-api-key', // From tenant settings
		tenantId: 'tenant-uuid', // Restaurant owner ID
		tableId: 'table-uuid', // Current table ID
	})

	// Load cart on component mount
	useEffect(() => {
		loadCart()
	}, [])

	const loadCart = async () => {
		try {
			await getCart(cartConfig)
		} catch (error) {
			console.error('Failed to load cart:', error)
		}
	}

	/**
	 * EXAMPLE 1: Add item to cart (simple item without modifiers)
	 */
	const handleAddSimpleItem = async () => {
		try {
			await addToCart({
				...cartConfig,
				customerId: 'customer-uuid', // Optional for walk-in
				menuItemId: 'item-uuid',
				name: 'Phở Bò',
				quantity: 1,
				price: 50000, // VND
				notes: 'Extra spicy please',
			})
		} catch (error) {
			console.error('Failed to add item:', error)
		}
	}

	/**
	 * EXAMPLE 2: Add item with modifiers
	 */
	const handleAddItemWithModifiers = async () => {
		try {
			await addToCart({
				...cartConfig,
				menuItemId: 'pizza-uuid',
				name: 'Pizza Margherita',
				quantity: 1,
				price: 120000, // Base price
				modifiers: [
					{
						modifierGroupId: 'size-group-uuid',
						modifierOptionId: 'large-uuid',
						name: 'Large',
						price: 30000, // Extra cost for large size
					},
					{
						modifierGroupId: 'toppings-group-uuid',
						modifierOptionId: 'extra-cheese-uuid',
						name: 'Extra Cheese',
						price: 15000,
					},
				],
				notes: 'Well done crust',
			})
			// Total item price: 120000 + 30000 + 15000 = 165000 VND
		} catch (error) {
			console.error('Failed to add item:', error)
		}
	}

	/**
	 * EXAMPLE 3: Update item quantity
	 * itemKey format: "menuItemId:modifiersHash"
	 */
	const handleUpdateQuantity = async (itemKey, newQuantity) => {
		try {
			await updateQuantity({
				...cartConfig,
				itemKey: itemKey,
				quantity: newQuantity,
			})
		} catch (error) {
			console.error('Failed to update quantity:', error)
		}
	}

	/**
	 * EXAMPLE 4: Remove item from cart (with confirmation)
	 */
	const handleRemoveItem = async (itemKey, itemName) => {
		try {
			// Will show confirmation dialog automatically
			await removeItem(
				{
					...cartConfig,
					itemKey: itemKey,
				},
				{
					skipConfirm: false, // Show confirmation (default)
					itemName: itemName, // Display name in alert/confirm
				},
			)
		} catch (error) {
			console.error('Failed to remove item:', error)
		}
	}

	/**
	 * EXAMPLE 5: Remove item without confirmation
	 */
	const handleRemoveItemNoConfirm = async (itemKey, itemName) => {
		try {
			await removeItem(
				{
					...cartConfig,
					itemKey: itemKey,
				},
				{
					skipConfirm: true, // Skip confirmation
					itemName: itemName,
				},
			)
		} catch (error) {
			console.error('Failed to remove item:', error)
		}
	}

	/**
	 * EXAMPLE 6: Clear entire cart (with confirmation)
	 */
	const handleClearCart = async () => {
		try {
			// Will show confirmation dialog automatically
			await clearCart(cartConfig, {
				skipConfirm: false, // Show confirmation (default)
			})
		} catch (error) {
			console.error('Failed to clear cart:', error)
		}
	}

	/**
	 * EXAMPLE 7: Manual confirm dialog usage
	 */
	const handleManualConfirm = async () => {
		const confirmed = await showConfirm({
			title: 'Custom Confirmation',
			message: 'Are you sure you want to proceed?',
			type: 'warning', // 'info' | 'warning' | 'danger' | 'success'
			confirmText: 'Yes, proceed',
			cancelText: 'No, cancel',
			showIcon: true,
		})

		if (confirmed) {
			showAlert('Success', 'User confirmed the action', 'success')
		} else {
			showAlert('Cancelled', 'User cancelled the action', 'info')
		}
	}

	/**
	 * EXAMPLE 8: Display cart items
	 */
	const renderCart = () => {
		if (loading) {
			return <div>Loading cart...</div>
		}

		if (error) {
			return <div className="text-red-500">Error: {error}</div>
		}

		if (!cart || !cart.items || cart.items.length === 0) {
			return <div>Your cart is empty</div>
		}

		return (
			<div className="space-y-4">
				<h2 className="text-xl font-bold">Cart Items</h2>
				{cart.items.map((item) => (
					<div key={item.itemKey} className="bg-white p-4 rounded-lg shadow">
						<div className="flex justify-between items-start">
							<div>
								<h3 className="font-semibold">{item.name}</h3>
								<p className="text-sm text-gray-600">
									Price: {item.price.toLocaleString()} VND
								</p>

								{/* Display modifiers */}
								{item.modifiers && item.modifiers.length > 0 && (
									<div className="mt-2 space-y-1">
										<p className="text-sm font-medium text-gray-700">Modifiers:</p>
										{item.modifiers.map((mod, idx) => (
											<p key={idx} className="text-sm text-gray-600 ml-4">
												• {mod.name} (+{mod.price.toLocaleString()} VND)
											</p>
										))}
									</div>
								)}

								{/* Display notes */}
								{item.notes && (
									<p className="text-sm text-gray-500 italic mt-2">Note: {item.notes}</p>
								)}
							</div>

							<div className="text-right">
								<p className="text-sm text-gray-600">Qty: {item.quantity}</p>
								<p className="font-bold">{item.totalPrice.toLocaleString()} VND</p>

								{/* Actions */}
								<div className="mt-2 space-x-2">
									<button
										onClick={() => handleUpdateQuantity(item.itemKey, item.quantity + 1)}
										className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
									>
										+
									</button>
									<button
										onClick={() =>
											handleUpdateQuantity(item.itemKey, Math.max(1, item.quantity - 1))
										}
										className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
									>
										-
									</button>
									<button
										onClick={() => handleRemoveItem(item.itemKey, item.name)}
										className="px-2 py-1 bg-red-500 text-white rounded text-sm"
									>
										Remove
									</button>
								</div>
							</div>
						</div>
					</div>
				))}

				{/* Cart Summary */}
				<div className="border-t pt-4">
					<div className="flex justify-between text-lg font-bold">
						<span>Total:</span>
						<span>{cart.totalAmount?.toLocaleString()} VND</span>
					</div>
					<button
						onClick={handleClearCart}
						className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-lg"
					>
						Clear Cart
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Cart Management Example</h1>

			{/* Example buttons */}
			<div className="mb-6 space-x-2">
				<button
					onClick={handleAddSimpleItem}
					className="px-4 py-2 bg-green-500 text-white rounded"
				>
					Add Simple Item
				</button>
				<button
					onClick={handleAddItemWithModifiers}
					className="px-4 py-2 bg-green-500 text-white rounded"
				>
					Add Item with Modifiers
				</button>
				<button
					onClick={handleManualConfirm}
					className="px-4 py-2 bg-yellow-500 text-white rounded"
				>
					Test Confirm Dialog
				</button>
			</div>

			{/* Cart display */}
			{renderCart()}
		</div>
	)
}

export default CartExample

/**
 * IMPORTANT NOTES:
 * ===============
 *
 * 1. Required Fields for AddToCart:
 *    - orderApiKey: string (from tenant)
 *    - tenantId: string (UUID)
 *    - tableId: string (UUID)
 *    - menuItemId: string (UUID)
 *    - name: string
 *    - quantity: number (min: 1)
 *    - price: number (min: 0)
 *
 * 2. Optional Fields for AddToCart:
 *    - customerId: string (UUID) - can be empty for walk-in customers
 *    - modifiers: array of CartModifierDto
 *    - notes: string
 *
 * 3. Modifier Structure:
 *    {
 *      modifierGroupId: string (UUID),
 *      modifierOptionId: string (UUID),
 *      name: string,
 *      price: number (min: 0)
 *    }
 *
 * 4. Item Key Format:
 *    - Unique identifier combining menuItemId and modifiers hash
 *    - Same item with different modifiers = different itemKey
 *    - Used for updateQuantity and removeItem operations
 *
 * 5. Alert/Confirm Integration:
 *    - All cart operations show success/error alerts automatically
 *    - removeItem and clearCart show confirmation dialogs by default
 *    - Can skip confirmation with skipConfirm: true
 *
 * 6. Error Handling:
 *    - API errors are caught and displayed via alert
 *    - Validation errors thrown before API call
 *    - Error state available in useCart hook
 */
