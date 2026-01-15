import React, { useState, useMemo } from 'react'
import { useAlert } from '../../../../contexts/AlertContext'
import apiClient from '../../../../services/apiClient'

const CartPage = ({
	cartItems,
	onClearCart,
	onUpdateCart,
	onClose,
	tenantId,
	tableId,
	onRefreshCart, // Add callback to refresh cart from backend
}) => {
	const { showAlert, showConfirm } = useAlert()
	const [isOrderPlaced, setIsOrderPlaced] = useState(false)

	// Calculate total (using totalPrice from cart items)
	const total = useMemo(
		() =>
			cartItems.reduce(
				(acc, item) => acc + (item.totalPrice || item.price * item.qty),
				0,
			),
		[cartItems],
	)

	// Close and reset state
	const handleClose = (shouldClearCart = false) => {
		setIsOrderPlaced(false)
		if (onClose) {
			onClose(shouldClearCart)
		}
	}

	// Call API to place order
	const handlePlaceOrder = async () => {
		if (cartItems.length === 0) return

		setIsOrderPlaced(true)

		try {
			if (!tenantId || !tableId) {
				throw new Error('Missing tenantId or tableId')
			}

			// Get customer info from localStorage
			const customerAuthStr = localStorage.getItem('customerAuth')
			const customerAuth = customerAuthStr ? JSON.parse(customerAuthStr) : null

			const payload = {}

			// Add customer info if authenticated
			if (customerAuth) {
				payload.customerId = customerAuth.id
				payload.customerName = customerAuth.name || customerAuth.email
			}

			console.log('🛒 Checkout request:', { tenantId, tableId, payload })

			// Call checkout API directly
			const response = await apiClient.post(
				`/tenants/${tenantId}/tables/${tableId}/cart/checkout`,
				payload,
			)

			console.log('✅ Checkout success:', response.data)

			showAlert(
				'Order Placed',
				'Your order has been placed successfully!',
				'success',
				3000,
			)

			// Clear cart and close
			onClearCart()
			handleClose()
		} catch (error) {
			console.error('❌ Error placing order:', error)
			showAlert(
				'Order Failed',
				error.response?.data?.message ||
					error.message ||
					'Failed to place order. Please try again.',
				'error',
				5000,
			)
		} finally {
			setIsOrderPlaced(false)
		}
	}

	return (
		<div className="p-2 sm:p-4 max-w-2xl mx-auto pb-24">
			<div className="mb-4 sm:mb-6">
				<h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Your Cart</h2>
				<p className="text-[#9dabb9] text-sm">Review your order before checkout</p>
			</div>

			<div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
				{cartItems.length === 0 ? (
					<div className="text-center py-12 sm:py-20 backdrop-blur-xl bg-[#1A202C]/80 rounded-xl border border-white/20">
						<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4 block">
							shopping_cart
						</span>
						<p className="text-[#9dabb9] text-lg">Your cart is empty</p>
					</div>
				) : (
					cartItems.map((item, index) => (
						<div
							key={index}
							className="backdrop-blur-xl bg-[#1A202C]/80 p-3 sm:p-5 rounded-xl border border-white/20"
						>
							<div className="flex items-start gap-4">
								{/* Dish Image */}
								{item.imageUrl && (
									<img
										src={item.imageUrl}
										alt={item.name}
										className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
									/>
								)}

								{/* Dish Info */}
								<div className="flex-1">
									<div className="flex justify-between items-start mb-2">
										<div>
											<p className="text-white font-bold text-lg">{item.name}</p>
											{item.description && (
												<p className="text-[#9dabb9] text-xs mt-1 line-clamp-2">
													{item.description}
												</p>
											)}
										</div>
										<button
											onClick={async () => {
												try {
													if (item.itemKey && tenantId && tableId) {
														// Call API to remove item
														await apiClient.delete(
															`/tenants/${tenantId}/tables/${tableId}/cart/items/${item.itemKey}`,
														)
														// Reload cart from backend
														if (onRefreshCart) {
															await onRefreshCart()
														} else {
															// Fallback: update local state
															const newCart = cartItems.filter((_, i) => i !== index)
															onUpdateCart?.(newCart)
														}
													}
												} catch (error) {
													console.error('Error removing item:', error)
												}
											}}
										>
											<span className="material-symbols-outlined text-base">delete</span>
										</button>
									</div>

									{/* Modifiers */}
									{item.modifiers && item.modifiers.length > 0 && (
										<div className="space-y-1 mb-3 bg-[#2D3748] p-2 rounded-lg">
											{item.modifiers.map((mod, modIndex) => (
												<div key={modIndex} className="text-xs text-[#9dabb9]">
													<span className="font-semibold text-white">{mod.name}</span>
													{mod.price !== 0 && (
														<span className="text-green-400 font-medium">
															{' '}
															({mod.price > 0 ? '+' : ''}${mod.price.toFixed(2)})
														</span>
													)}
												</div>
											))}
										</div>
									)}

									{/* Special Notes */}
									{item.specialNotes && (
										<div className="mb-3 text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-lg">
											<span className="font-semibold">Note:</span> {item.specialNotes}
										</div>
									)}

									{/* Quantity Controls and Price */}
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-3 bg-[#2D3748] rounded-lg p-1">
											<button
												onClick={async () => {
													if (item.qty > 1) {
														const newQty = item.qty - 1
														try {
															if (item.itemKey && tenantId && tableId) {
																// Call API to update quantity
																await apiClient.patch(
																	`/tenants/${tenantId}/tables/${tableId}/cart/items/${item.itemKey}`,
																	{ quantity: newQty },
																)
																// Reload cart from backend
																if (onRefreshCart) {
																	await onRefreshCart()
																	return
																}
															}
															// Fallback: update local state
															const modifierTotal =
																item.modifiers?.reduce(
																	(sum, mod) => sum + (mod.price || 0),
																	0,
																) || 0
															const newTotalPrice = (item.price + modifierTotal) * newQty
															const newCart = [...cartItems]
															newCart[index] = {
																...item,
																qty: newQty,
																totalPrice: newTotalPrice,
															}
															onUpdateCart?.(newCart)
														} catch (error) {
															console.error('Error updating quantity:', error)
														}
													}
												}}
												className="w-8 h-8 flex items-center justify-center bg-[#1A202C] text-white rounded hover:bg-[#4A5568] transition-colors"
											>
												−
											</button>
											<span className="text-white font-bold w-10 text-center text-lg">
												{item.qty}
											</span>
											<button
												onClick={async () => {
													const newQty = item.qty + 1
													try {
														if (item.itemKey && tenantId && tableId) {
															// Call API to update quantity
															await apiClient.patch(
																`/tenants/${tenantId}/tables/${tableId}/cart/items/${item.itemKey}`,
																{ quantity: newQty },
															)
															// Reload cart from backend
															if (onRefreshCart) {
																await onRefreshCart()
																return
															}
														}
														// Fallback: update local state
														const modifierTotal =
															item.modifiers?.reduce(
																(sum, mod) => sum + (mod.price || 0),
																0,
															) || 0
														const newTotalPrice = (item.price + modifierTotal) * newQty
														const newCart = [...cartItems]
														newCart[index] = {
															...item,
															qty: newQty,
															totalPrice: newTotalPrice,
														}
														onUpdateCart?.(newCart)
													} catch (error) {
														console.error('Error updating quantity:', error)
													}
												}}
												className="w-8 h-8 flex items-center justify-center bg-[#137fec] text-white rounded hover:bg-blue-600 transition-colors"
											>
												+
											</button>
										</div>
										<span className="text-[#4ade80] font-bold text-xl">
											${(item.totalPrice || item.price * item.qty).toFixed(2)}
										</span>
									</div>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Footer - Total and Actions */}
			<div className="mt-4 sm:mt-6 backdrop-blur-xl bg-[#1A202C]/80 rounded-xl border border-white/20 p-4 sm:p-6">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
					<div>
						<p className="text-[#9dabb9] text-xs sm:text-sm mb-1">Total Amount</p>
						<p className="text-2xl sm:text-4xl font-black text-[#4ade80]">
							${total.toFixed(2)}
						</p>
					</div>

					<div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
						{cartItems.length > 0 && (
							<button
								onClick={async () => {
									const confirmed = await showConfirm({
										title: 'Clear Cart',
										message: 'Are you sure you want to remove all items from your cart?',
										type: 'warning',
										confirmText: 'Clear Cart',
										cancelText: 'Cancel',
									})
									if (confirmed) {
										onClearCart()
										showAlert(
											'Cart Cleared',
											'All items have been removed',
											'success',
											3000,
										)
									}
								}}
								className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg bg-red-500/20 text-red-400 text-sm sm:text-base font-bold hover:bg-red-500/30 transition-colors"
							>
								Clear
							</button>
						)}
						<button
							onClick={handlePlaceOrder}
							disabled={cartItems.length === 0 || isOrderPlaced}
							className="flex-1 sm:flex-none px-6 sm:px-8 py-3 rounded-lg bg-[#4ade80] text-black text-sm sm:text-base font-bold hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{isOrderPlaced ? (
								<>
									<span className="material-symbols-outlined">check_circle</span>
									Order Placed
								</>
							) : (
								<>
									<span className="material-symbols-outlined">shopping_bag</span>
									Place Order
								</>
							)}
						</button>
					</div>
				</div>

				{cartItems.length > 0 && (
					<div className="pt-4 border-t border-white/10 text-center">
						<p className="text-[#9dabb9] text-xs">
							Items: {cartItems.reduce((acc, item) => acc + item.qty, 0)}
						</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default CartPage
