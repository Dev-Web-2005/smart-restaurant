import React, { useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useUser } from '../../../contexts/UserContext'
import { useNotifications } from '../../../contexts/NotificationContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { CardSkeleton } from '../../../components/common/LoadingSpinner'
import socketClient from '../../../services/websocket/socketClient'
import {
	getOrdersAPI,
	acceptOrderItemsAPI,
	rejectOrderItemsAPI,
	markItemsServedAPI,
	markOrderPaidAPI,
} from '../../../services/api/orderAPI'

/**
 * OrderManagement - Waiter Dashboard
 *
 * Displays orders ready for waiter attention:
 * - PENDING: New orders to accept/reject and notify kitchen
 * - READY: Items ready to be served to customers
 * - SERVED: Items already served, waiting for payment
 * - Payment Management: Mark orders as paid to complete them
 *
 * Status Flow:
 * PENDING (accept/reject) → READY → SERVED (waiter delivers) → PAID (payment complete)
 */

// Order Item Status Constants
// Backend returns status as STRING labels, not numbers
const ITEM_STATUS = {
	PENDING: 'PENDING',
	ACCEPTED: 'ACCEPTED',
	PREPARING: 'PREPARING',
	READY: 'READY',
	SERVED: 'SERVED',
	REJECTED: 'REJECTED',
	CANCELLED: 'CANCELLED',
}

const ITEM_STATUS_LABELS = {
	[ITEM_STATUS.PENDING]: 'Pending',
	[ITEM_STATUS.ACCEPTED]: 'Accepted',
	[ITEM_STATUS.PREPARING]: 'Preparing',
	[ITEM_STATUS.READY]: 'Ready',
	[ITEM_STATUS.SERVED]: 'Served',
	[ITEM_STATUS.REJECTED]: 'Rejected',
	[ITEM_STATUS.CANCELLED]: 'Cancelled',
}

const ITEM_STATUS_COLORS = {
	[ITEM_STATUS.PENDING]: 'bg-yellow-500/20 text-yellow-300',
	[ITEM_STATUS.ACCEPTED]: 'bg-blue-500/20 text-blue-300',
	[ITEM_STATUS.PREPARING]: 'bg-orange-500/20 text-orange-300',
	[ITEM_STATUS.READY]: 'bg-green-500/20 text-green-300',
	[ITEM_STATUS.SERVED]: 'bg-purple-500/20 text-purple-300',
	[ITEM_STATUS.REJECTED]: 'bg-red-500/20 text-red-300',
	[ITEM_STATUS.CANCELLED]: 'bg-gray-500/20 text-gray-300',
}

const PAYMENT_STATUS = {
	PENDING: 'PENDING',
	PAID: 'PAID',
	FAILED: 'FAILED',
	REFUNDED: 'REFUNDED',
}

// --- CONSTANTS ---
const TIME_LIMIT_MINUTES = 30
const TIME_LIMIT_MS = TIME_LIMIT_MINUTES * 60 * 1000

// Helper tạo timestamp giả lập
const getMockTime = (minutesAgo) => {
	const d = new Date()
	d.setMinutes(d.getMinutes() - minutesAgo)
	return d.getTime()
}

// --- Dữ liệu Mock ---
const mockActiveOrders = [
	{
		id: 'A3F8B',
		destination: 'Table 5',
		items: 3,
		totalPrice: 45.0,
		placedTime: getMockTime(15),
		status: 'PREPARING',
	},
	{
		id: 'C1D9E',
		destination: 'Table 12',
		items: 5,
		totalPrice: 62.5,
		placedTime: getMockTime(35),
		status: 'PREPARING',
	},
	{
		id: 'E4F2A',
		destination: 'Takeaway',
		items: 2,
		totalPrice: 23.75,
		placedTime: getMockTime(5),
		status: 'READY',
	},
	{
		id: 'B7G8H',
		destination: 'Table 3',
		items: 1,
		totalPrice: 15.0,
		placedTime: getMockTime(10),
		status: 'READY',
	},
	{
		id: 'K9M2N',
		destination: 'Table 8',
		items: 6,
		totalPrice: 88.2,
		placedTime: getMockTime(20),
		status: 'PREPARING',
	},
	{
		id: 'F5P6Q',
		destination: 'Table 2',
		items: 4,
		totalPrice: 12.75,
		placedTime: getMockTime(30),
		status: 'PREPARING',
	},
]

const mockPendingOrders = [
	{
		id: 'L1V4T',
		destination: 'Table 9',
		items: 4,
		time: '12:45 PM',
		totalPrice: 45.5,
		placedTime: getMockTime(2),
		paymentStatus: 'PAID', // PAID hoặc UNPAID
	},
	{
		id: 'R8S3Y',
		destination: 'John D.',
		items: 6,
		time: '12:42 PM',
		totalPrice: 112.0,
		placedTime: getMockTime(3),
		paymentStatus: 'UNPAID',
	},
]

// --- Dữ liệu Mock Chi tiết Order ---
const mockOrderDetails = {
	A3F8B: {
		id: 'A3F8B',
		table: 'Table 5',
		totalPrice: 45.0,
		status: 'Preparing',
		items: [
			{ name: 'Spicy Miso Ramen', qty: 1, price: 15.5, notes: 'Extra spicy' },
			{ name: 'Coca Cola', qty: 2, price: 4.5, notes: 'No ice' },
			{ name: 'Fries', qty: 1, price: 8.0, notes: 'Extra salt' },
		],
	},
	L1V4T: {
		id: 'L1V4T',
		table: 'Table 9',
		totalPrice: 45.5,
		status: 'Pending',
		items: [
			{ name: 'Caesar Salad', qty: 1, price: 12.0, notes: 'Dressing on side' },
			{ name: 'Grilled Salmon', qty: 1, price: 33.5, notes: '' },
		],
	},
}

// Định nghĩa các class màu
const getColor = (name) => {
	switch (name) {
		case 'primary':
			return '#137fec'
		case 'red-400':
			return '#f87171'
		case 'yellow-300':
			return '#fde047'
		case 'yellow-500':
			return '#eab308'
		case 'green-400':
			return '#4ade80'
		case 'red-800':
			return '#e53e3e'
		default:
			return 'white'
	}
}

// Hàm tính toán dữ liệu TIMER
const calculateTimeData = (placedTime) => {
	const elapsed = Date.now() - placedTime
	const remainingMs = TIME_LIMIT_MS - elapsed
	const isDelayed = remainingMs <= 0

	let progress = Math.min(100, (elapsed / TIME_LIMIT_MS) * 100)

	let displayTime
	let absRemaining = Math.abs(remainingMs)
	const minutes = Math.floor(absRemaining / 60000)
	const seconds = Math.floor((absRemaining % 60000) / 1000)

	displayTime = `${minutes.toString().padStart(2, '0')}:${seconds
		.toString()
		.padStart(2, '0')}`

	return {
		progress: progress,
		timeRemaining: displayTime,
		isDelayed: isDelayed,
		timeStatus: isDelayed ? 'Delayed' : 'Preparing',
	}
}

// =========================================================
// 🚨 COMPONENT MỚI: OrderDetailModal (ĐÃ SỬA VỚI PORTAL)
// =========================================================
const OrderDetailModal = ({ isOpen, onClose, details }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => {
				setIsVisible(true)
			})
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
		}

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose()
			}
		}

		const handleEscape = (event) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			document.addEventListener('keydown', handleEscape)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen, onClose])

	if (!isOpen || !details) return null

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative w-full max-w-xl mx-4 bg-black/80 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
				style={{
					maxHeight: '90vh',
					overflowY: 'auto',
				}}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-[#9dabb9] hover:text-red-400 transition-colors z-10"
				>
					<span className="material-symbols-outlined text-2xl">close</span>
				</button>

				<div className="flex justify-between items-start mb-6 border-b border-white/10 pb-3">
					<div>
						<h3 className="text-2xl font-bold text-white m-0">Order Details</h3>
						<p className="text-sm text-[#9dabb9] mt-1">
							ID: {details.id} | To: {details.table}
						</p>
					</div>
				</div>

				<div className="space-y-4 max-h-96 overflow-y-auto pr-4">
					{details.items.map((item, index) => (
						<div
							key={index}
							className="flex justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-lg"
						>
							<div className="flex flex-col">
								<p className="text-white font-semibold">
									{item.qty}x {item.name}
								</p>
								{item.notes && (
									<p className="text-xs text-yellow-300/80">Note: {item.notes}</p>
								)}
							</div>
							<span className="text-base font-bold text-white">
								${(item.qty * item.price).toFixed(2)}
							</span>
						</div>
					))}
				</div>

				<div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
					<p className="text-xl font-bold text-white">Total:</p>
					<p className="text-3xl font-black text-[#4ade80]">
						${details.totalPrice.toFixed(2)}
					</p>
				</div>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// --- Sub-component: Active Order Card ---
const ActiveOrderCard = ({ order, onAction, onView, timeData, actionType }) => {
	const timeBoxClass = timeData.isDelayed ? 'bg-red-600' : 'bg-black/50 backdrop-blur-md'
	const timeBoxTextColor = timeData.isDelayed
		? `text-[${getColor('yellow-400')}]`
		: 'text-white'
	const timeValueColor = timeData.isDelayed
		? `text-[${getColor('yellow-300')}]`
		: 'text-white'
	const progressBarColor = timeData.isDelayed ? getColor('red-800') : getColor('primary')

	// Xác định button config dựa trên actionType
	const buttonConfig =
		actionType === 'COMPLETE_COOKING'
			? {
					text: 'Kitchen Complete',
					icon: 'restaurant',
					color: 'bg-blue-500/20 text-blue-400 border-blue-400/50 hover:bg-blue-600/30',
			  }
			: {
					text: 'Mark as Served',
					icon: 'check_circle',
					color:
						'bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/50 hover:bg-green-600/30',
			  }

	return (
		<div
			onClick={() => onView(order.id)}
			className="bg-black/40 backdrop-blur-md rounded-xl p-4 flex flex-col gap-3 text-left border border-white/10 cursor-pointer 
                       transition-all duration-200 hover:bg-black/50 hover:shadow-lg active:scale-[0.99] 
                       focus:ring-2 focus:ring-[#137fec]"
		>
			<div className="flex justify-between items-center">
				<p className="text-white font-bold m-0">{order.id}</p>
				<p className="text-white font-semibold m-0">{order.destination}</p>
			</div>
			<p className="text-sm text-gray-300 m-0">{order.items} items</p>

			<div className={`rounded-lg p-3 text-center ${timeBoxClass}`}>
				<p className={`text-xs ${timeBoxTextColor} m-0 mb-1`}>
					{timeData.isDelayed ? 'DELAYED' : 'TIME REMAINING'}
				</p>
				<p className={`text-xl font-bold ${timeValueColor} m-0`}>
					{timeData.timeRemaining}
				</p>
			</div>

			<div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mt-1 mb-3">
				<div
					className="h-full rounded-full"
					style={{
						width: `${timeData.progress}%`,
						backgroundColor: progressBarColor,
					}}
				></div>
			</div>

			<button
				onClick={(e) => {
					e.stopPropagation()
					onAction(order.id)
				}}
				className={`w-full h-10 rounded-lg text-sm font-bold transition-colors active:scale-[0.98] border flex items-center justify-center gap-2 ${buttonConfig.color}`}
			>
				{buttonConfig.text}
			</button>
		</div>
	)
}

// --- Sub-component: Pending Order Item ---
const PendingOrderItem = ({ order, onApprove, onDecline, onView }) => {
	const handleApproveClick = () => onApprove(order.id)
	const handleDeclineClick = () => onDecline(order.id)

	const isPaid = order.paymentStatus === 'PAID'

	return (
		<div
			onClick={() => onView(order.id)}
			className="bg-black/30 backdrop-blur-md rounded-lg m-4 p-4 flex items-center justify-between transition-all duration-200 hover:bg-black/40 hover:shadow-md cursor-pointer border border-white/10"
		>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<p className="text-white font-semibold m-0">{order.destination}</p>
					<span
						className={`text-xs px-2 py-0.5 rounded-full font-bold ${
							isPaid
								? 'bg-green-500/20 text-green-400 border border-green-400/50'
								: 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/50'
						}`}
					>
						{isPaid ? 'Paid' : 'Unpaid'}
					</span>
				</div>
				<div className="flex items-center gap-4 text-sm text-gray-300">
					<span className="flex items-center">
						{new Date(order.placedTime).toLocaleTimeString('en-US', {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</span>
					<span className="font-bold text-white">${order.totalPrice.toFixed(2)}</span>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<button
					onClick={(e) => {
						e.stopPropagation()
						handleDeclineClick()
					}}
					title="Decline"
					className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-600/20 text-[#f87171] hover:bg-red-600/30 transition-colors"
				>
					<span className="material-symbols-outlined text-base">close</span>
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation()
						handleApproveClick()
					}}
					title="Approve"
					className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-600/20 text-[#4ade80] hover:bg-green-600/30 transition-colors"
				>
					<span className="material-symbols-outlined text-base">check</span>
				</button>
			</div>
		</div>
	)
}

const OrderManagement = () => {
	const { user } = useUser()
	// const { setNewHelpRequestsCount } = useNotifications() // Unused for now

	// State management
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [orders, setOrders] = useState([])
	const [filteredOrders, setFilteredOrders] = useState([])
	const [selectedView, setSelectedView] = useState('PENDING') // PENDING, READY, SERVED, PAYMENT
	const [searchQuery, setSearchQuery] = useState('')
	const [expandedOrders, setExpandedOrders] = useState(new Set())
	const [processingOrders, setProcessingOrders] = useState(new Set()) // Track orders being processed

	/**
	 * Fetch orders from API
	 */
	const fetchOrders = useCallback(
		async (silent = false) => {
			try {
				if (!silent) setRefreshing(true)

				const tenantId = user?.tenantId || localStorage.getItem('currentTenantId')
				if (!tenantId) {
					console.warn('⚠️ No tenantId found, skipping order fetch')
					return null
				}

				console.log('🔄 Fetching orders for tenant:', tenantId)

				// ❌ REMOVED status: 'IN_PROGRESS' filter
				// Reason: New orders from customer checkout have status='PENDING'
				// Filter was preventing new orders from appearing in UI
				// Now fetching ALL unpaid orders (both PENDING and IN_PROGRESS)
				const response = await getOrdersAPI({
					tenantId,
					page: 1,
					limit: 100,
					// status: 'IN_PROGRESS', // ❌ REMOVED - need PENDING orders!
					paymentStatus: 'PENDING', // Only unpaid orders
				})

				if (response?.code === 1000 && response?.data) {
					// Backend returns PaginatedOrdersResponseDto: { orders, total, page, limit, totalPages }
					const fetchedOrders = response.data.orders || []
					console.log('✅ Orders fetched:', fetchedOrders.length)
					setOrders(fetchedOrders)
					return fetchedOrders // Return for verification
				} else {
					console.warn('⚠️ Unexpected response format:', response)
					setOrders([])
					return []
				}
			} catch (error) {
				console.error('❌ Error fetching orders:', error)
				setOrders([])
				return []
			} finally {
				if (!silent) setRefreshing(false)
			}
		},
		[user?.tenantId],
	)

	/**
	 * Accept order items (waiter accepts pending items)
	 * @param {string} orderId - Order ID
	 * @param {Array<string>} itemIds - Array of item IDs to accept
	 */
	const handleAcceptItems = async (orderId, itemIds) => {
		// Prevent double-click
		if (processingOrders.has(orderId)) {
			console.warn('⚠️ Already processing order:', orderId)
			return
		}

		try {
			const tenantId = user?.tenantId || localStorage.getItem('currentTenantId')
			const waiterId = user?.userId

			if (!tenantId || !waiterId) {
				console.error('❌ Missing tenantId or waiterId')
				return
			}

			if (!itemIds || itemIds.length === 0) {
				console.warn('⚠️ No items to accept')
				return
			}

			// Mark order as processing
			setProcessingOrders((prev) => new Set(prev).add(orderId))

			console.log(`✅ Accepting ${itemIds.length} items from order ${orderId}`)
			console.log(`📋 Item IDs to accept:`, itemIds)

			// Call API to accept items
			await acceptOrderItemsAPI({
				tenantId,
				orderId,
				itemIds,
				waiterId,
			})

			console.log('✅ Items accepted successfully by backend')

			// 🔄 RETRY FETCH with exponential backoff until data is updated
			// Backend might have cache or read replica lag
			let retryCount = 0
			const maxRetries = 3
			let dataUpdated = false

			while (retryCount < maxRetries && !dataUpdated) {
				const delayMs = 300 + retryCount * 500 // 300ms, 800ms, 1300ms
				console.log(`⏳ Waiting ${delayMs}ms before fetch attempt ${retryCount + 1}...`)
				await new Promise((resolve) => setTimeout(resolve, delayMs))

				console.log(`🔄 Fetch attempt ${retryCount + 1}/${maxRetries}...`)
				const freshOrders = await fetchOrders(true)

				// Check if items were actually updated in fetched data
				if (freshOrders && Array.isArray(freshOrders)) {
					const currentOrder = freshOrders.find((o) => o.id === orderId)
					if (currentOrder) {
						const stillPending = currentOrder.items.some(
							(item) => itemIds.includes(item.id) && item.status === ITEM_STATUS.PENDING,
						)
						if (!stillPending) {
							dataUpdated = true
							console.log('✅ Data updated successfully!')
							break
						} else {
							console.warn(
								`⚠️ Data still stale on attempt ${retryCount + 1}, items still PENDING:`,
								currentOrder.items
									.filter((item) => itemIds.includes(item.id))
									.map((i) => ({ id: i.id.slice(0, 8), status: i.status })),
							)
						}
					} else {
						// Order not found - might have moved to different status
						dataUpdated = true
						console.log('✅ Order moved to different status (accepted successfully)')
						break
					}
				}

				retryCount++
			}

			if (!dataUpdated) {
				console.warn(
					'⚠️ Data may still be stale after all retries - possible backend cache issue',
				)
			}
		} catch (error) {
			console.error('❌ Error accepting items:', error)
			alert(error.response?.data?.message || 'Failed to accept items')
			// Fetch fresh data on error
			await fetchOrders(true)
		} finally {
			// Remove from processing
			setProcessingOrders((prev) => {
				const next = new Set(prev)
				next.delete(orderId)
				return next
			})
		}
	}

	/**
	 * Reject order items (waiter rejects pending items with reason)
	 * @param {string} orderId - Order ID
	 * @param {Array<string>} itemIds - Array of item IDs to reject
	 */
	const handleRejectItems = async (orderId, itemIds) => {
		// Prevent double-click
		if (processingOrders.has(orderId)) {
			console.warn('⚠️ Already processing order:', orderId)
			return
		}

		try {
			const tenantId = user?.tenantId || localStorage.getItem('currentTenantId')
			const waiterId = user?.userId

			if (!tenantId || !waiterId) {
				console.error('❌ Missing tenantId or waiterId')
				return
			}

			if (!itemIds || itemIds.length === 0) {
				console.warn('⚠️ No items to reject')
				return
			}

			// Prompt for rejection reason
			const reason = prompt('Enter rejection reason (minimum 5 characters):')

			if (!reason) {
				console.log('ℹ️ Rejection cancelled by user')
				return
			}

			if (reason.trim().length < 5) {
				alert('Rejection reason must be at least 5 characters')
				return
			}

			// Mark order as processing
			setProcessingOrders((prev) => new Set(prev).add(orderId))

			console.log(`❌ Rejecting ${itemIds.length} items from order ${orderId}`)

			await rejectOrderItemsAPI({
				tenantId,
				orderId,
				itemIds,
				waiterId,
				reason: reason.trim(),
			})

			console.log('✅ Items rejected successfully')

			// Refresh orders to get updated status
			await fetchOrders(true)
		} catch (error) {
			console.error('❌ Error rejecting items:', error)
			alert(error.response?.data?.message || 'Failed to reject items')
		} finally {
			// Remove from processing
			setProcessingOrders((prev) => {
				const next = new Set(prev)
				next.delete(orderId)
				return next
			})
		}
	}

	/**
	 * Mark order items as served (waiter delivered food to customer)
	 * @param {string} orderId - Order ID
	 * @param {Array<string>} itemIds - Array of item IDs to mark as served
	 */
	const handleMarkServed = async (orderId, itemIds) => {
		// Prevent double-click
		if (processingOrders.has(orderId)) {
			console.warn('⚠️ Already processing order:', orderId)
			return
		}

		try {
			const tenantId = user?.tenantId || localStorage.getItem('currentTenantId')
			const waiterId = user?.userId

			if (!tenantId || !waiterId) {
				console.error('❌ Missing tenantId or waiterId')
				return
			}

			if (!itemIds || itemIds.length === 0) {
				console.warn('⚠️ No items to mark as served')
				return
			}

			// Mark order as processing
			setProcessingOrders((prev) => new Set(prev).add(orderId))

			console.log(`✅ Marking ${itemIds.length} items as served from order ${orderId}`)

			await markItemsServedAPI({
				tenantId,
				orderId,
				itemIds,
				waiterId,
			})

			console.log('✅ Items marked as served successfully')

			// Refresh orders to get updated status
			await fetchOrders(true)
		} catch (error) {
			console.error('❌ Error marking items as served:', error)
			alert(error.response?.data?.message || 'Failed to mark items as served')
		} finally {
			// Remove from processing
			setProcessingOrders((prev) => {
				const next = new Set(prev)
				next.delete(orderId)
				return next
			})
		}
	}

	/**
	 * Mark order as paid (customer completed payment)
	 * @param {string} orderId - Order ID
	 * @param {string} paymentMethod - Payment method (CASH, CARD, MOMO, etc.)
	 */
	const handleMarkPaid = async (orderId, paymentMethod) => {
		// Prevent double-click
		if (processingOrders.has(orderId)) {
			console.warn('⚠️ Already processing order:', orderId)
			return
		}

		try {
			const tenantId = user?.tenantId || localStorage.getItem('currentTenantId')

			if (!tenantId) {
				console.error('❌ Missing tenantId')
				alert('Error: Missing tenant ID')
				return
			}

			// Mark order as processing
			setProcessingOrders((prev) => new Set(prev).add(orderId))

			console.log(`💰 Marking order ${orderId} as paid via ${paymentMethod}`)
			console.log('Request params:', { tenantId, orderId, paymentMethod })

			const response = await markOrderPaidAPI({
				tenantId,
				orderId,
				paymentMethod,
			})

			console.log('✅ Order marked as paid successfully:', response)
			alert(`✅ Payment confirmed via ${paymentMethod}`)

			// Refresh orders to get updated status
			await fetchOrders(true)
		} catch (error) {
			console.error('❌ Error marking order as paid:', error)
			console.error('Error details:', {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			})
			alert(error.response?.data?.message || 'Failed to mark order as paid')
		} finally {
			// Remove from processing
			setProcessingOrders((prev) => {
				const next = new Set(prev)
				next.delete(orderId)
				return next
			})
		}
	}

	/**
	 * Initial load
	 */
	useEffect(() => {
		const initialize = async () => {
			try {
				// Request notification permission
				if ('Notification' in window && Notification.permission === 'default') {
					Notification.requestPermission().then((permission) => {
						console.log('🔔 Notification permission:', permission)
					})
				}

				// Fetch initial orders
				await fetchOrders()
			} catch (error) {
				console.error('❌ Error initializing orders:', error)
			} finally {
				setLoading(false)
			}
		}

		initialize()
	}, [fetchOrders]) // Re-initialize if fetchOrders changes

	/**
	 * WebSocket setup - Separate useEffect to prevent reconnections
	 */
	useEffect(() => {
		const setupWebSocket = async () => {
			// Use window.accessToken (set by authAPI after login/refresh)
			const authToken = window.accessToken || localStorage.getItem('authToken')
			const tenantId =
				user?.tenantId || user?.userId || localStorage.getItem('currentTenantId')

			if (!authToken || !tenantId) {
				console.error(
					'❌ [OrderManagement] No token or tenantId, skipping WebSocket setup',
				)
				return
			}

			// Connect WebSocket if not already connected
			if (!socketClient.isSocketConnected()) {
				socketClient.connect(authToken)

				// Wait for connection before registering listeners
				try {
					await socketClient.waitForConnection(5000)
					console.log('✅ [OrderManagement] WebSocket connected successfully')
				} catch (error) {
					console.error(
						'❌ [OrderManagement] WebSocket connection failed:',
						error.message,
					)
					return
				}
			} else {
				console.log(
					'🔵 [OrderManagement] WebSocket already connected, reusing connection',
				)
			}

			// Define event handlers
			const handleNewOrderItems = (payload) => {
				console.log('🆕 [OrderManagement] New order received', payload)
				console.log('🔄 [OrderManagement] Refreshing orders after new order received')

				// Show notification
				if (payload?.data) {
					const { orderId, tableId, items } = payload.data
					const itemCount = items?.length || 0

					// Auto-expand the new order to show items immediately
					if (orderId) {
						console.log('🔓 [OrderManagement] Auto-expanding new order:', orderId)
						setExpandedOrders((prev) => {
							const newSet = new Set(prev)
							newSet.add(orderId)
							return newSet
						})
					}

					// Optionally show browser notification
					if ('Notification' in window && Notification.permission === 'granted') {
						new Notification('New Order Received', {
							body: `${itemCount} item(s) from Table ${tableId}`,
							icon: '/logo.png',
						})
					}
				}

				// Refresh orders list to show new pending items
				fetchOrders(true) // silent refresh
			}

			const handleItemsAccepted = (payload) => {
				console.log('✅ [OrderManagement] Order items accepted', payload)
				console.log('🔄 [OrderManagement] Refreshing orders after items accepted')
				fetchOrders(true)
			}

			const handleItemsReady = (payload) => {
				console.log('🍽️ [OrderManagement] Order items ready', payload)
				console.log('🔄 [OrderManagement] Refreshing orders after items ready')
				fetchOrders(true)
			}

			// Listen for events
			socketClient.on('order.items.new', handleNewOrderItems)
			socketClient.on('order.items.accepted', handleItemsAccepted)
			socketClient.on('order.items.ready', handleItemsReady)
		}

		// Only setup WebSocket if user is available
		const effectiveTenantId = user?.tenantId || user?.userId
		if (effectiveTenantId) {
			setupWebSocket()
		} else {
			console.error(
				'❌ [OrderManagement] User authentication required for real-time updates',
			)
		}

		// Cleanup with proper handler references - remove all listeners for these events
		return () => {
			// Note: socketClient.off without callback removes all listeners for the event
			// This is acceptable for cleanup as we're unmounting the component
			socketClient.off('order.items.new')
			socketClient.off('order.items.accepted')
			socketClient.off('order.items.ready')
			console.log('🔴 [OrderManagement] WebSocket listeners removed')
		}
	}, [user?.tenantId, user?.userId, fetchOrders]) // Include fetchOrders to ensure handlers always use current version

	// Filter orders based on view and search
	useEffect(() => {
		let filtered = [...orders]

		console.log('🔍 Filtering orders:', {
			view: selectedView,
			totalOrders: orders.length,
			orders: orders.map((o) => ({
				id: o.id.slice(0, 8),
				items: o.items.length,
				itemStatuses: o.items.map((i) => i.status),
				paymentStatus: o.paymentStatus,
			})),
		})

		// Filter by view
		if (selectedView === 'PENDING') {
			// Show orders with at least one PENDING item
			filtered = filtered
				.map((order) => {
					const items = order.items.filter((item) => item.status === ITEM_STATUS.PENDING)
					if (items.length === 0) return null
					return { ...order, items }
				})
				.filter(Boolean)
		} else if (selectedView === 'READY') {
			// Show orders with at least one READY item
			filtered = filtered
				.map((order) => {
					const items = order.items.filter((item) => item.status === ITEM_STATUS.READY)
					if (items.length === 0) return null
					return { ...order, items }
				})
				.filter(Boolean)
		} else if (selectedView === 'SERVED') {
			// Show orders with at least one SERVED item
			filtered = filtered
				.map((order) => {
					const items = order.items.filter((item) => item.status === ITEM_STATUS.SERVED)
					if (items.length === 0) return null
					return { ...order, items }
				})
				.filter(Boolean)
		} else if (selectedView === 'PAYMENT') {
			// Show orders waiting for payment (all non-rejected items served, payment pending)
			filtered = filtered.filter((order) => {
				if (!order.items || order.items.length === 0) return false

				// Exclude rejected/cancelled items from the check
				const activeItems = order.items.filter(
					(item) =>
						item.status !== ITEM_STATUS.REJECTED && item.status !== ITEM_STATUS.CANCELLED,
				)

				// If no active items (all rejected), skip this order
				if (activeItems.length === 0) return false

				// Check if all active items are served
				const allActiveServed = activeItems.every(
					(item) => item.status === ITEM_STATUS.SERVED,
				)
				const needsPayment =
					allActiveServed && order.paymentStatus === PAYMENT_STATUS.PENDING

				// Detailed item status breakdown
				const statusBreakdown = order.items.reduce((acc, item) => {
					acc[item.status] = (acc[item.status] || 0) + 1
					return acc
				}, {})

				console.log(`💰 Payment filter for order ${order.id.slice(0, 8)}:`, {
					allActiveServed,
					paymentStatus: order.paymentStatus,
					needsPayment,
					totalItems: order.items.length,
					activeItems: activeItems.length,
					rejectedItems: order.items.length - activeItems.length,
					statusBreakdown,
					itemDetails: order.items.map((i) => ({ name: i.name, status: i.status })),
				})

				return needsPayment
			})
		}

		console.log(`✅ Filtered result (${selectedView}):`, filtered.length, 'orders')

		// Filter by search query (table name or item name)
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered
				.map((order) => {
					// Check if table name matches
					if (order.table?.name?.toLowerCase().includes(query)) {
						return order
					}

					// Check if any item name matches
					const matchingItems = order.items.filter((item) =>
						item.name?.toLowerCase().includes(query),
					)
					if (matchingItems.length > 0) {
						return { ...order, items: matchingItems }
					}

					return null
				})
				.filter(Boolean)
		}

		setFilteredOrders(filtered)
	}, [orders, selectedView, searchQuery])

	// Toggle order expansion
	const toggleOrderExpansion = (orderId) => {
		setExpandedOrders((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(orderId)) {
				newSet.delete(orderId)
			} else {
				newSet.add(orderId)
			}
			return newSet
		})
	}

	// Format price
	const formatPrice = (price) => {
		if (!price) return '0'
		return new Intl.NumberFormat('vi-VN').format(price)
	}

	// Render loading skeleton
	if (loading) {
		return (
			<BasePageLayout activeRoute="/user/order">
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
						<div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
					</div>
					<CardSkeleton />
					<CardSkeleton />
				</div>
			</BasePageLayout>
		)
	}

	return (
		<BasePageLayout activeRoute="/user/order">
			<div className="space-y-6">
				{/* Header */}
				<div>
					<h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
					<p className="text-gray-400">Serve customers and manage payments</p>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-yellow-500/20 backdrop-blur-md rounded-lg p-4 border border-yellow-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-yellow-400 text-3xl">
								pending_actions
							</span>
							<div>
								<p className="text-yellow-400 text-sm font-medium">Pending Acceptance</p>
								<p className="text-white text-2xl font-bold">
									{orders.reduce(
										(count, order) =>
											count +
											order.items.filter((item) => item.status === ITEM_STATUS.PENDING)
												.length,
										0,
									)}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-green-500/20 backdrop-blur-md rounded-lg p-4 border border-green-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-green-400 text-3xl">
								restaurant
							</span>
							<div>
								<p className="text-green-400 text-sm font-medium">Ready to Serve</p>
								<p className="text-white text-2xl font-bold">
									{orders.reduce(
										(count, order) =>
											count +
											order.items.filter((item) => item.status === ITEM_STATUS.READY)
												.length,
										0,
									)}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-purple-500/20 backdrop-blur-md rounded-lg p-4 border border-purple-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-purple-400 text-3xl">
								check_circle
							</span>
							<div>
								<p className="text-purple-400 text-sm font-medium">Served</p>
								<p className="text-white text-2xl font-bold">
									{orders.reduce(
										(count, order) =>
											count +
											order.items.filter((item) => item.status === ITEM_STATUS.SERVED)
												.length,
										0,
									)}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-4 border border-blue-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-blue-400 text-3xl">
								payments
							</span>
							<div>
								<p className="text-blue-400 text-sm font-medium">Awaiting Payment</p>
								<p className="text-white text-2xl font-bold">
									{
										orders.filter(
											(order) =>
												order.items?.length > 0 &&
												order.items.every((item) => item.status === ITEM_STATUS.SERVED) &&
												order.paymentStatus === PAYMENT_STATUS.PENDING,
										).length
									}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Filters */}
				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex-1">
						<div className="relative">
							<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
								search
							</span>
							<input
								type="text"
								placeholder="Search by table or item name..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<div className="flex gap-2">
						{['PENDING', 'READY', 'SERVED', 'PAYMENT'].map((view) => (
							<button
								key={view}
								onClick={() => setSelectedView(view)}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									selectedView === view
										? 'bg-blue-500 text-white'
										: 'bg-white/10 text-gray-300 hover:bg-white/20'
								}`}
							>
								{view === 'PENDING'
									? 'Pending'
									: view === 'READY'
									? 'Ready to Serve'
									: view === 'SERVED'
									? 'Served'
									: 'Payment'}
							</button>
						))}
					</div>
				</div>

				{/* Orders List */}
				{filteredOrders.length === 0 ? (
					<div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-12 text-center">
						<span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
							receipt_long
						</span>
						<p className="text-gray-400 text-lg">No orders to display</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredOrders.map((order) => {
							// Exclude rejected/cancelled items when checking if ready for payment
							const activeItems = order.items.filter(
								(item) =>
									item.status !== ITEM_STATUS.REJECTED &&
									item.status !== ITEM_STATUS.CANCELLED,
							)

							const allActiveServed =
								activeItems.length > 0 &&
								activeItems.every((item) => item.status === ITEM_STATUS.SERVED)

							const needsPayment =
								allActiveServed && order.paymentStatus === PAYMENT_STATUS.PENDING

							return (
								<div
									key={order.id}
									className={`bg-white/10 backdrop-blur-md rounded-lg border overflow-hidden ${
										needsPayment ? 'border-blue-500/50' : 'border-white/20'
									}`}
								>
									{/* Order Header */}
									<div
										className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
										onClick={() => toggleOrderExpansion(order.id)}
									>
										<div className="flex items-center gap-4">
											<span className="material-symbols-outlined text-blue-400 text-3xl">
												table_restaurant
											</span>
											<div>
												<h3 className="text-white text-lg font-semibold">
													{order.table?.name || `Table ${order.tableId}`}
												</h3>
												<p className="text-gray-400 text-sm">
													{order.items.length} item(s) • Order #{order.id.slice(0, 8)}
												</p>
												{needsPayment && (
													<span className="inline-block mt-1 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
														Awaiting Payment
													</span>
												)}
											</div>
										</div>

										<div className="flex items-center gap-4">
											{selectedView === 'PAYMENT' && (
												<span className="text-white text-lg font-bold">
													${formatPrice(order.total)}
												</span>
											)}
											<span
												className={`material-symbols-outlined text-white transition-transform ${
													expandedOrders.has(order.id) ? 'rotate-180' : ''
												}`}
											>
												expand_more
											</span>
										</div>
									</div>

									{/* Order Items (Expanded) */}
									{expandedOrders.has(order.id) && (
										<div className="border-t border-white/10 p-4 space-y-3">
											{/* Bulk Actions for PENDING orders - Right aligned compact */}
											{selectedView === 'PENDING' &&
												order.items.some(
													(item) => item.status === ITEM_STATUS.PENDING,
												) && (
													<div className="flex justify-end gap-2 mb-3">
														<button
															onClick={(e) => {
																e.stopPropagation()
																handleRejectItems(
																	order.id,
																	order.items
																		.filter((item) => item.status === ITEM_STATUS.PENDING)
																		.map((item) => item.id),
																)
															}}
															disabled={processingOrders.has(order.id)}
															title="Reject all pending items"
															className={`px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
																processingOrders.has(order.id)
																	? 'opacity-50 cursor-not-allowed'
																	: ''
															}`}
														>
															<span className="material-symbols-outlined text-base">
																close
															</span>
															{processingOrders.has(order.id)
																? 'Processing...'
																: 'Reject All'}
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation()
																handleAcceptItems(
																	order.id,
																	order.items
																		.filter((item) => item.status === ITEM_STATUS.PENDING)
																		.map((item) => item.id),
																)
															}}
															disabled={processingOrders.has(order.id)}
															title="Accept all pending items"
															className={`px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
																processingOrders.has(order.id)
																	? 'opacity-50 cursor-not-allowed'
																	: ''
															}`}
														>
															<span className="material-symbols-outlined text-base">
																check
															</span>
															{processingOrders.has(order.id)
																? 'Processing...'
																: 'Accept All'}
														</button>
													</div>
												)}

											{order.items.map((item) => (
												<div key={item.id} className="bg-white/5 rounded-lg p-4">
													{/* Item Info and Action Buttons */}
													<div className="flex items-start justify-between gap-4">
														<div className="flex-1">
															<div className="flex items-center gap-3 mb-2">
																<h4 className="text-white font-semibold">{item.name}</h4>
																<span
																	className={`px-2 py-1 rounded text-xs font-medium ${
																		ITEM_STATUS_COLORS[item.status]
																	}`}
																>
																	{ITEM_STATUS_LABELS[item.status]}
																</span>
															</div>

															<p className="text-gray-400 text-sm mb-2">
																Quantity: {item.quantity} × ${formatPrice(item.unitPrice)}
																= ${formatPrice(item.subtotal)}
															</p>

															{/* Modifiers */}
															{item.modifiers && item.modifiers.length > 0 && (
																<div className="text-gray-400 text-sm mb-2">
																	<strong>Modifiers:</strong>
																	<ul className="ml-4 list-disc">
																		{item.modifiers.map((mod, idx) => (
																			<li key={idx}>
																				{mod.optionName} (+${formatPrice(mod.price)})
																			</li>
																		))}
																	</ul>
																</div>
															)}

															{/* Notes */}
															{item.notes && (
																<p className="text-yellow-400 text-sm">📝 {item.notes}</p>
															)}
														</div>

														{/* Action Buttons - Right side */}
														<div className="flex flex-col gap-2 items-end">
															{/* READY item button */}
															{item.status === ITEM_STATUS.READY && (
																<button
																	onClick={(e) => {
																		e.stopPropagation()
																		handleMarkServed(order.id, [item.id])
																	}}
																	disabled={processingOrders.has(order.id)}
																	title="Mark as served"
																	className={`px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
																		processingOrders.has(order.id)
																			? 'opacity-50 cursor-not-allowed'
																			: ''
																	}`}
																>
																	<span className="material-symbols-outlined text-base">
																		check_circle
																	</span>
																	{processingOrders.has(order.id)
																		? 'Processing...'
																		: 'Served'}
																</button>
															)}
														</div>
													</div>
												</div>
											))}

											{/* Payment Button (only show in PAYMENT view) */}
											{selectedView === 'PAYMENT' && needsPayment && (
												<div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
													<div className="mb-3">
														<p className="text-white font-semibold mb-3">
															Payment Summary
														</p>

														{/* Rejected Items Warning */}
														{order.items.some(
															(item) => item.status === ITEM_STATUS.REJECTED,
														) && (
															<div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
																<p className="text-red-400 text-sm font-medium flex items-center gap-2">
																	<span className="material-symbols-outlined text-base">
																		info
																	</span>
																	Note: Rejected items are excluded from payment
																</p>
																<ul className="mt-2 space-y-1">
																	{order.items
																		.filter(
																			(item) => item.status === ITEM_STATUS.REJECTED,
																		)
																		.map((item, idx) => (
																			<li key={idx} className="text-red-300 text-xs ml-6">
																				• {item.name} (x{item.quantity}) -{' '}
																				{item.rejectionReason || 'No reason provided'}
																			</li>
																		))}
																</ul>
															</div>
														)}

														{/* Price Breakdown */}
														<div className="space-y-2 mb-3">
															<div className="flex justify-between text-gray-300 text-sm">
																<span>Subtotal:</span>
																<span>{formatPrice(order.subtotal)} VND</span>
															</div>
															{order.tax > 0 && (
																<div className="flex justify-between text-gray-300 text-sm">
																	<span>Tax (10%):</span>
																	<span>{formatPrice(order.tax)} VND</span>
																</div>
															)}
															{order.discount > 0 && (
																<div className="flex justify-between text-green-400 text-sm">
																	<span>Discount:</span>
																	<span>-{formatPrice(order.discount)} VND</span>
																</div>
															)}
															<div className="border-t border-white/20 pt-2 mt-2 flex justify-between">
																<span className="text-white font-semibold">
																	Total to Pay:
																</span>
																<span className="text-blue-400 text-xl font-bold">
																	{formatPrice(order.total)} VND
																</span>
															</div>
														</div>
													</div>

													<div className="flex gap-2">
														<button
															onClick={(e) => {
																e.stopPropagation()
																handleMarkPaid(order.id, 'CASH')
															}}
															disabled={processingOrders.has(order.id)}
															className={`flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
																processingOrders.has(order.id)
																	? 'opacity-50 cursor-not-allowed'
																	: ''
															}`}
														>
															<span>💵</span>
															{processingOrders.has(order.id) ? 'Processing...' : 'Cash'}
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation()
																handleMarkPaid(order.id, 'CARD')
															}}
															disabled={processingOrders.has(order.id)}
															className={`flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
																processingOrders.has(order.id)
																	? 'opacity-50 cursor-not-allowed'
																	: ''
															}`}
														>
															<span>💳</span>
															{processingOrders.has(order.id) ? 'Processing...' : 'Card'}
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation()
																handleMarkPaid(order.id, 'MOMO')
															}}
															disabled={processingOrders.has(order.id)}
															className={`flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
																processingOrders.has(order.id)
																	? 'opacity-50 cursor-not-allowed'
																	: ''
															}`}
														>
															<span>📱</span>
															{processingOrders.has(order.id) ? 'Processing...' : 'MoMo'}
														</button>
													</div>

													<p className="text-xs text-gray-400 mt-3 text-center">
														Complete payment to finish this order
													</p>
												</div>
											)}
										</div>
									)}
								</div>
							)
						})}
					</div>
				)}
			</div>
		</BasePageLayout>
	)
}

export default OrderManagement
