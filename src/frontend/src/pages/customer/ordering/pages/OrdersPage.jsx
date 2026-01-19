import React, { useState, useEffect, useRef } from 'react'
import OrderCard from '../components/OrderCard'
import {
	cancelOrderAPI,
	generateBillAPI,
	generatePaymentQrAPI,
} from '../../../../services/api/orderAPI'

// Auto refresh interval (15 seconds)
const AUTO_REFRESH_INTERVAL = 150000

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

/**
 * Check if order can request payment
 * Rules:
 * - All items must be SERVED (rejected items don't affect)
 * - Payment status must be PENDING
 * - Order status must be IN_PROGRESS or READY
 */
const canRequestPayment = (order) => {
	if (!order || !order.items || order.items.length === 0) return false

	// Check if payment already processed
	if (order.paymentStatus && order.paymentStatus !== 'PENDING') {
		return false
	}

	// Order status check - must be active
	if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
		return false
	}

	// Filter out rejected items and check if all remaining items are served
	const nonRejectedItems = order.items.filter((item) => item.status !== 'REJECTED')

	// Must have at least one served item
	if (nonRejectedItems.length === 0) return false

	// All non-rejected items must be served
	const allServed = nonRejectedItems.every((item) => item.status === 'SERVED')

	return allServed
}

const OrdersPage = ({
	orders,
	loading = false,
	onBrowseMenu,
	onOrderCancelled,
	onRefresh, // ✅ New prop for auto refresh
	onPaymentComplete, // ✅ Callback when payment is complete
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

	// ✅ Payment states
	const [showPaymentModal, setShowPaymentModal] = useState(false)
	const [orderToPay, setOrderToPay] = useState(null)
	const [billData, setBillData] = useState(null)
	const [paymentQrData, setPaymentQrData] = useState(null)
	const [loadingBill, setLoadingBill] = useState(false)
	const [loadingQr, setLoadingQr] = useState(false)
	const [paymentError, setPaymentError] = useState(null)
	const [paymentStep, setPaymentStep] = useState('bill') // 'bill' | 'qr' | 'success'

	// ✅ Auto refresh effect
	useEffect(() => {
		// Only refresh if enabled and we have an onRefresh callback
		if (!isAutoRefreshEnabled || !onRefresh) {
			return
		}

		// ✅ Disable auto refresh when payment modal is open
		if (showPaymentModal) {
			console.log('💳 Payment modal open, pausing auto refresh')
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
	}, [isAutoRefreshEnabled, onRefresh, orders, showPaymentModal])

	// ✅ Manual refresh handler
	const handleManualRefresh = () => {
		if (onRefresh) {
			console.log('🔄 Manual refresh triggered')
			onRefresh()
			setLastRefreshTime(Date.now())
			setCountdown(AUTO_REFRESH_INTERVAL / 1000)
		}
	}

	// ✅ Handle request payment - Generate QR code first (not bill)
	// Flow: Request Payment → Show QR → Pay via Stripe → Order PAID → Can generate bill
	const handleRequestPayment = async (order) => {
		setOrderToPay(order)
		setBillData(null)
		setPaymentQrData(null)
		setPaymentError(null)
		setPaymentStep('qr') // Start with QR step (not bill)
		setShowPaymentModal(true)
		setLoadingQr(true)

		const effectiveTenantId = tenantId || localStorage.getItem('currentTenantId')

		try {
			const result = await generatePaymentQrAPI({
				tenantId: effectiveTenantId,
				orderId: order.id,
			})

			if (result.success) {
				setPaymentQrData(result.data)
			} else {
				setPaymentError(result.message || 'Failed to generate payment QR')
			}
		} catch (error) {
			console.error('Error generating payment QR:', error)
			setPaymentError('Failed to generate payment QR. Please try again.')
		} finally {
			setLoadingQr(false)
		}
	}

	// ✅ Handle generate bill after payment success
	const handleGenerateBill = async () => {
		if (!orderToPay) return

		setLoadingBill(true)
		setPaymentError(null)

		const effectiveTenantId = tenantId || localStorage.getItem('currentTenantId')

		try {
			const result = await generateBillAPI({
				tenantId: effectiveTenantId,
				orderId: orderToPay.id,
			})

			if (result.success) {
				setBillData(result.data)
				setPaymentStep('bill')
			} else {
				// If bill generation fails (order not paid yet), show message
				setPaymentError(
					result.message || 'Bill will be available after payment is confirmed',
				)
			}
		} catch (error) {
			console.error('Error generating bill:', error)
			setPaymentError('Bill will be available after payment is confirmed')
		} finally {
			setLoadingBill(false)
		}
	}

	// ✅ Handle "I've Paid" button - Try to generate bill (receipt)
	const handlePaymentComplete = async () => {
		// First try to get the bill/receipt
		setPaymentStep('bill')
		setLoadingBill(true)
		setPaymentError(null)

		const effectiveTenantId = tenantId || localStorage.getItem('currentTenantId')

		try {
			const result = await generateBillAPI({
				tenantId: effectiveTenantId,
				orderId: orderToPay.id,
			})

			if (result.success) {
				setBillData(result.data)
			} else {
				// Payment may not be confirmed yet on backend
				setPaymentError(
					result.message || 'Receipt will be available once payment is confirmed',
				)
			}
		} catch (error) {
			console.error('Error generating bill:', error)
			setPaymentError('Receipt will be available once payment is confirmed')
		} finally {
			setLoadingBill(false)
		}
	}

	// ✅ Handle final completion - redirect to menu
	const handleFinalComplete = () => {
		setPaymentStep('success')
		// After 2 seconds, close modal and redirect to menu
		setTimeout(() => {
			setShowPaymentModal(false)
			setOrderToPay(null)
			setBillData(null)
			setPaymentQrData(null)
			setPaymentStep('qr')
			// Callback to parent (redirect to menu)
			if (onPaymentComplete) {
				onPaymentComplete()
			} else if (onBrowseMenu) {
				onBrowseMenu()
			}
		}, 2000)
	}

	// ✅ Close payment modal
	const closePaymentModal = () => {
		setShowPaymentModal(false)
		setOrderToPay(null)
		setBillData(null)
		setPaymentQrData(null)
		setPaymentError(null)
		setPaymentStep('bill')
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
							canPay={canRequestPayment(order)}
							onCancelClick={() => handleCancelClick(order)}
							onPayClick={() => handleRequestPayment(order)}
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

			{/* ✅ Payment Modal */}
			{showPaymentModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<div
						className="bg-[#1A202C] rounded-2xl border border-white/20 p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
						style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
					>
						{/* Payment Step: QR Code (First Step) */}
						{paymentStep === 'qr' && (
							<>
								<div className="text-center mb-6">
									<span className="material-symbols-outlined text-5xl text-blue-400 mb-3 block">
										qr_code_scanner
									</span>
									<h3 className="text-xl font-bold text-white mb-2">Scan to Pay</h3>
									<p className="text-[#9dabb9] text-sm">
										Scan the QR code with your phone or click the link below
									</p>
								</div>

								{/* Loading QR */}
								{loadingQr && (
									<div className="text-center py-8">
										<div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mb-4"></div>
										<p className="text-[#9dabb9]">Generating payment QR...</p>
									</div>
								)}

								{/* QR Code Content */}
								{!loadingQr && paymentQrData && (
									<>
										{/* QR Code Image */}
										<div className="flex justify-center mb-6">
											<div className="bg-white p-4 rounded-2xl">
												<img
													src={`data:image/png;base64,${paymentQrData.qrCode}`}
													alt="Payment QR Code"
													className="w-48 h-48"
												/>
											</div>
										</div>

										{/* Amount */}
										<div className="text-center mb-6">
											<p className="text-[#9dabb9] text-sm">Amount to pay</p>
											<p className="text-3xl font-bold text-green-400">
												${(paymentQrData.amount || 0).toFixed(2)}{' '}
												{paymentQrData.currency?.toUpperCase()}
											</p>
										</div>

										{/* Payment Link Button */}
										<a
											href={paymentQrData.paymentUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-center mb-4"
										>
											<span className="material-symbols-outlined text-base align-middle mr-2">
												open_in_new
											</span>
											Open Payment Page
										</a>

										{/* Actions */}
										<div className="flex gap-3">
											<button
												onClick={closePaymentModal}
												className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
											>
												Cancel
											</button>
											<button
												onClick={handlePaymentComplete}
												className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
											>
												I've Paid
											</button>
										</div>

										<p className="text-[#9dabb9] text-xs text-center mt-4">
											After completing payment, click "I've Paid" to view your receipt
										</p>
									</>
								)}

								{/* Error */}
								{!loadingQr && paymentError && (
									<div className="space-y-4">
										<div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
											<p className="text-red-400">{paymentError}</p>
										</div>
										<button
											onClick={closePaymentModal}
											className="w-full px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
										>
											Close
										</button>
									</div>
								)}
							</>
						)}

						{/* Payment Step: Bill (After Payment) */}
						{paymentStep === 'bill' && (
							<>
								<div className="text-center mb-6">
									<span className="material-symbols-outlined text-5xl text-green-400 mb-3 block">
										receipt_long
									</span>
									<h3 className="text-xl font-bold text-white mb-2">Your Receipt</h3>
									<p className="text-[#9dabb9] text-sm">Thank you for your payment!</p>
								</div>

								{/* Loading Bill */}
								{loadingBill && (
									<div className="text-center py-8">
										<div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-400 mb-4"></div>
										<p className="text-[#9dabb9]">Generating receipt...</p>
									</div>
								)}

								{/* Bill Content */}
								{!loadingBill && billData && (
									<div className="space-y-4">
										<div className="flex justify-between text-sm">
											<span className="text-[#9dabb9]">Date</span>
											<span className="text-white">
												{billData.generatedAt
													? new Date(billData.generatedAt).toLocaleString()
													: 'N/A'}
											</span>
										</div>

										{/* Payment Status Badge */}
										<div className="flex justify-center">
											<span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
												✓ PAID
											</span>
										</div>

										{/* Items */}
										<div className="border-t border-white/10 pt-4">
											<h4 className="text-white font-medium mb-3">Items</h4>
											<div className="space-y-2">
												{billData.items?.map((item, idx) => (
													<div key={idx} className="flex justify-between text-sm">
														<div className="flex-1">
															<span className="text-white">{item.name}</span>
															<span className="text-[#9dabb9] ml-2">
																x{item.quantity}
															</span>
															{item.modifiers?.length > 0 && (
																<p className="text-[#9dabb9] text-xs">
																	+ {item.modifiers.map((m) => m.optionName).join(', ')}
																</p>
															)}
														</div>
														<span className="text-white">
															${(item.total || 0).toFixed(2)}
														</span>
													</div>
												))}
											</div>
										</div>

										{/* Summary */}
										<div className="border-t border-white/10 pt-4 space-y-2">
											<div className="flex justify-between text-sm">
												<span className="text-[#9dabb9]">Subtotal</span>
												<span className="text-white">
													${(billData.summary?.subtotal || 0).toFixed(2)}
												</span>
											</div>
											{billData.summary?.modifiersTotal > 0 && (
												<div className="flex justify-between text-sm">
													<span className="text-[#9dabb9]">Modifiers</span>
													<span className="text-white">
														${(billData.summary.modifiersTotal || 0).toFixed(2)}
													</span>
												</div>
											)}
											{billData.summary?.tax > 0 && (
												<div className="flex justify-between text-sm">
													<span className="text-[#9dabb9]">Tax</span>
													<span className="text-white">
														${(billData.summary.tax || 0).toFixed(2)}
													</span>
												</div>
											)}
											{billData.summary?.discount > 0 && (
												<div className="flex justify-between text-sm">
													<span className="text-[#9dabb9]">Discount</span>
													<span className="text-green-400">
														-${(billData.summary.discount || 0).toFixed(2)}
													</span>
												</div>
											)}
											<div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
												<span className="text-white">Total Paid</span>
												<span className="text-green-400">
													${(billData.summary?.total || 0).toFixed(2)}
												</span>
											</div>
										</div>

										{/* Actions */}
										<div className="pt-4">
											<button
												onClick={handleFinalComplete}
												className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
											>
												Done - Return to Menu
											</button>
										</div>
									</div>
								)}

								{/* Error or No Bill Yet */}
								{!loadingBill && !billData && (
									<div className="space-y-4">
										{paymentError ? (
											<div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
												<span className="material-symbols-outlined text-yellow-400 text-2xl mb-2 block">
													info
												</span>
												<p className="text-yellow-400 text-sm">{paymentError}</p>
												<p className="text-[#9dabb9] text-xs mt-2">
													Please wait a moment while your payment is being processed.
												</p>
											</div>
										) : (
											<div className="text-center py-4">
												<p className="text-[#9dabb9]">Preparing your receipt...</p>
											</div>
										)}
										<div className="flex gap-3">
											<button
												onClick={() => setPaymentStep('qr')}
												className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
											>
												Back
											</button>
											<button
												onClick={handleGenerateBill}
												disabled={loadingBill}
												className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
											>
												{loadingBill ? 'Loading...' : 'Retry'}
											</button>
										</div>
									</div>
								)}
							</>
						)}

						{/* Payment Step: Success */}
						{paymentStep === 'success' && (
							<div className="text-center py-8">
								<div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
									<span className="material-symbols-outlined text-4xl text-white">
										check
									</span>
								</div>
								<h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
								<p className="text-[#9dabb9]">
									Your payment has been recorded. Redirecting to menu...
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default OrdersPage
