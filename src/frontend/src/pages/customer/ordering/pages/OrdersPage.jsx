import React, { useState, useEffect, useRef } from 'react'
import OrderCard from '../components/OrderCard'
import { cancelOrderAPI } from '../../../../services/api/orderAPI'

// Auto refresh interval (15 seconds)
const AUTO_REFRESH_INTERVAL = 15000

/**
 * Map backend order to customer-friendly display format
 * Logic:
 * - All items PENDING → Status: "Pending" (waiting for staff acceptance)
 * - At least one item ACCEPTED/PREPARING/READY → Status: "Preparing" (being prepared)
 * - All items SERVED → Status: "Ready" (all items delivered)
 * - Any item REJECTED → Status: "Rejected"
 * - Order CANCELLED → Status: "Cancelled"
 */
const mapOrderForCustomer = (order) => {
	if (!order || !order.items || order.items.length === 0) {
		return order
	}

	// Check if order is cancelled
	if (order.status === 'CANCELLED') {
		return {
			...order,
			status: 'CANCELLED',
			currentStep: null,
		}
	}

	const items = order.items

	// Check if any item is rejected
	const hasRejected = items.some((item) => item.status === 'REJECTED')
	if (hasRejected) {
		const rejectedItems = items.filter((item) => item.status === 'REJECTED')
		return {
			...order,
			status: 'REJECTED',
			currentStep: null,
			rejectionReason: rejectedItems
				.map((item) => `${item.name}: ${item.rejectionReason || 'Not available'}`)
				.join('; '),
		}
	}

	// Check if all items are served
	const allServed = items.every((item) => item.status === 'SERVED')
	if (allServed) {
		return {
			...order,
			status: 'READY',
			currentStep: 'Ready',
		}
	}

	// Check if any item is being prepared (ACCEPTED, PREPARING, or READY but not all served)
	const hasAcceptedOrPreparing = items.some((item) =>
		['ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(item.status),
	)
	if (hasAcceptedOrPreparing) {
		return {
			...order,
			status: 'PREPARING',
			currentStep: 'Preparing',
		}
	}

	// All items still pending
	return {
		...order,
		status: 'RECEIVED',
		currentStep: 'Received',
	}
}

/**
 * Check if order can be cancelled
 * Rules:
 * - Order must be PENDING or IN_PROGRESS
 * - All items must be PENDING (not yet started cooking)
 */
const canCancelOrder = (order) => {
	if (!order || !order.items) return false

	// Order level check
	if (!['PENDING', 'IN_PROGRESS', 'RECEIVED'].includes(order.status)) {
		return false
	}

	// Item level check - can only cancel if no items have started processing
	const hasProcessingItems = order.items.some((item) =>
		['ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(item.status),
	)

	return !hasProcessingItems
}

const OrdersPage = ({
	orders,
	loading = false,
	onBrowseMenu,
	onOrderCancelled,
	onRefresh, // ✅ New prop for auto refresh
	tenantId,
}) => {
	const [cancellingOrderId, setCancellingOrderId] = useState(null)
	const [showCancelModal, setShowCancelModal] = useState(false)
	const [cancelReason, setCancelReason] = useState('')
	const [orderToCancel, setOrderToCancel] = useState(null)
	const [cancelError, setCancelError] = useState(null)
	const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true)
	const [lastRefreshTime, setLastRefreshTime] = useState(Date.now())
	const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL / 1000)
	const autoRefreshIntervalRef = useRef(null)
	const countdownIntervalRef = useRef(null)

	// ✅ Auto refresh effect
	useEffect(() => {
		// Only refresh if enabled and we have an onRefresh callback
		if (!isAutoRefreshEnabled || !onRefresh) {
			return
		}

		// Check if any order is still in progress (not completed/cancelled)
		const hasActiveOrders = orders.some(
			(order) => !['COMPLETED', 'CANCELLED', 'READY'].includes(order.status),
		)

		// If no active orders, disable auto refresh
		if (!hasActiveOrders && orders.length > 0) {
			console.log('📴 No active orders, disabling auto refresh')
			return
		}

		console.log('🔄 Auto refresh enabled, interval:', AUTO_REFRESH_INTERVAL / 1000, 's')

		// Set up auto refresh interval
		autoRefreshIntervalRef.current = setInterval(() => {
			console.log('🔄 Auto refreshing orders...')
			onRefresh()
			setLastRefreshTime(Date.now())
			setCountdown(AUTO_REFRESH_INTERVAL / 1000)
		}, AUTO_REFRESH_INTERVAL)

		// Set up countdown interval (every second)
		countdownIntervalRef.current = setInterval(() => {
			setCountdown((prev) => (prev > 0 ? prev - 1 : AUTO_REFRESH_INTERVAL / 1000))
		}, 1000)

		// Cleanup on unmount or when dependencies change
		return () => {
			if (autoRefreshIntervalRef.current) {
				clearInterval(autoRefreshIntervalRef.current)
			}
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current)
			}
		}
	}, [isAutoRefreshEnabled, onRefresh, orders])

	// ✅ Manual refresh handler
	const handleManualRefresh = () => {
		if (onRefresh) {
			console.log('🔄 Manual refresh triggered')
			onRefresh()
			setLastRefreshTime(Date.now())
			setCountdown(AUTO_REFRESH_INTERVAL / 1000)
		}
	}

	// Map orders to customer-friendly format
	const displayOrders = orders.map(mapOrderForCustomer)

	// Handle cancel button click
	const handleCancelClick = (order) => {
		setOrderToCancel(order)
		setCancelReason('')
		setCancelError(null)
		setShowCancelModal(true)
	}

	// Handle cancel confirmation
	const handleConfirmCancel = async () => {
		if (!orderToCancel || !cancelReason.trim()) {
			setCancelError('Please provide a reason for cancellation')
			return
		}

		setCancellingOrderId(orderToCancel.id)
		setCancelError(null)

		try {
			const effectiveTenantId = tenantId || localStorage.getItem('currentTenantId')

			await cancelOrderAPI({
				tenantId: effectiveTenantId,
				orderId: orderToCancel.id,
				reason: cancelReason.trim(),
			})

			// Close modal and notify parent
			setShowCancelModal(false)
			setOrderToCancel(null)
			setCancelReason('')

			// Notify parent to refresh orders
			if (onOrderCancelled) {
				onOrderCancelled(orderToCancel.id)
			}
		} catch (error) {
			console.error('Failed to cancel order:', error)
			setCancelError(
				error.response?.data?.message ||
					'Failed to cancel order. Please try again or contact staff.',
			)
		} finally {
			setCancellingOrderId(null)
		}
	}

	// Show loading state
	if (loading) {
		return (
			<div className="p-4 max-w-4xl mx-auto">
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-white mb-2">Your Orders</h2>
					<p className="text-[#9dabb9] text-sm">
						Track your order status and view history
					</p>
				</div>
				<div className="text-center py-20">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec]"></div>
					<p className="text-[#9dabb9] text-lg mt-4">Loading orders...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-white mb-2">Your Orders</h2>
						<p className="text-[#9dabb9] text-sm">
							Track your order status and view history
						</p>
					</div>

					{/* ✅ Auto Refresh Controls */}
					{onRefresh && (
						<div className="flex items-center gap-3">
							{/* Auto refresh toggle */}
							<button
								onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
								className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
									isAutoRefreshEnabled
										? 'bg-green-500/20 text-green-400 border border-green-500/30'
										: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
								}`}
								title={
									isAutoRefreshEnabled ? 'Disable auto refresh' : 'Enable auto refresh'
								}
							>
								<span className="material-symbols-outlined text-base">
									{isAutoRefreshEnabled ? 'sync' : 'sync_disabled'}
								</span>
								<span className="hidden sm:inline">
									{isAutoRefreshEnabled ? `${countdown}s` : 'Off'}
								</span>
							</button>

							{/* Manual refresh button */}
							<button
								onClick={handleManualRefresh}
								disabled={loading}
								className="flex items-center gap-2 px-3 py-1.5 bg-[#137fec]/20 text-[#137fec] rounded-lg text-sm hover:bg-[#137fec]/30 transition-all disabled:opacity-50 border border-[#137fec]/30"
								title="Refresh now"
							>
								<span
									className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}
								>
									refresh
								</span>
								<span className="hidden sm:inline">Refresh</span>
							</button>
						</div>
					)}
				</div>
			</div>

			{orders.length === 0 ? (
				<div className="text-center py-20">
					<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4 block">
						receipt_long
					</span>
					<p className="text-[#9dabb9] text-lg">No orders yet</p>
					{onBrowseMenu && (
						<button
							onClick={onBrowseMenu}
							className="mt-6 px-6 py-3 bg-[#137fec] text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							Browse Menu
						</button>
					)}
				</div>
			) : (
				<div className="space-y-4">
					{displayOrders.map((order) => (
						<OrderCard
							key={order.id}
							order={order}
							canCancel={canCancelOrder(order)}
							onCancelClick={() => handleCancelClick(order)}
							isCancelling={cancellingOrderId === order.id}
						/>
					))}
				</div>
			)}

			{/* Cancel Order Modal */}
			{showCancelModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div className="bg-[#1A202C] rounded-2xl border border-white/20 p-6 max-w-md w-full shadow-2xl">
						<div className="text-center mb-6">
							<span className="material-symbols-outlined text-5xl text-red-400 mb-3 block">
								cancel
							</span>
							<h3 className="text-xl font-bold text-white mb-2">Cancel Order?</h3>
							<p className="text-[#9dabb9] text-sm">
								This action cannot be undone. All items in this order will be cancelled.
							</p>
						</div>

						{/* Reason Input */}
						<div className="mb-6">
							<label className="block text-white text-sm font-medium mb-2">
								Reason for cancellation <span className="text-red-400">*</span>
							</label>
							<textarea
								value={cancelReason}
								onChange={(e) => setCancelReason(e.target.value)}
								placeholder="Please tell us why you're cancelling..."
								className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none"
								rows={3}
							/>
							{cancelError && <p className="text-red-400 text-sm mt-2">{cancelError}</p>}
						</div>

						{/* Actions */}
						<div className="flex gap-3">
							<button
								onClick={() => {
									setShowCancelModal(false)
									setOrderToCancel(null)
									setCancelReason('')
									setCancelError(null)
								}}
								className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
							>
								Keep Order
							</button>
							<button
								onClick={handleConfirmCancel}
								disabled={cancellingOrderId !== null}
								className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{cancellingOrderId ? (
									<span className="flex items-center justify-center gap-2">
										<span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
										Cancelling...
									</span>
								) : (
									'Cancel Order'
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default OrdersPage
