import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '../../../contexts/UserContext'
import { useNotifications } from '../../../contexts/NotificationContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { CardSkeleton } from '../../../components/common/LoadingSpinner'
import {
	getOrdersAPI,
	updateOrderItemsStatusAPI,
	updateOrderPaymentAPI,
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
	const { setNewHelpRequestsCount } = useNotifications()

	// State management
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [orders, setOrders] = useState([])
	const [filteredOrders, setFilteredOrders] = useState([])
	const [selectedView, setSelectedView] = useState('PENDING') // PENDING, READY, SERVED, PAYMENT
	const [searchQuery, setSearchQuery] = useState('')
	const [expandedOrders, setExpandedOrders] = useState(new Set())

	// Auto-refresh interval
	const intervalRef = useRef(null)

	// Fetch orders from API
	const fetchOrders = async (showLoader = true) => {
		if (!user?.userId) return

		if (showLoader) setLoading(true)
		else setRefreshing(true)

		try {
			const tenantId = user.userId

			// Fetch orders with PENDING and IN_PROGRESS status
			// PENDING: New orders waiting for first item acceptance
			// IN_PROGRESS: Orders with items being prepared/served
			const [pendingResult, inProgressResult] = await Promise.all([
				getOrdersAPI(tenantId, { status: 'PENDING', limit: 100, page: 1 }),
				getOrdersAPI(tenantId, { status: 'IN_PROGRESS', limit: 100, page: 1 }),
			])

			if (pendingResult.success && inProgressResult.success) {
				const ordersData = [
					...(pendingResult.data?.orders || []),
					...(inProgressResult.data?.orders || []),
				]

				// Filter orders that have items in waiter statuses
				const waiterOrders = ordersData
					.map((order) => {
						// Filter items to only show PENDING, READY or SERVED
						const waiterItems = (order.items || []).filter(
							(item) =>
								item.status === ITEM_STATUS.PENDING ||
								item.status === ITEM_STATUS.READY ||
								item.status === ITEM_STATUS.SERVED,
						)

						if (waiterItems.length === 0) return null

						return {
							...order,
							items: waiterItems,
						}
					})
					.filter(Boolean)

				setOrders(waiterOrders)
				setFilteredOrders(waiterOrders)

				// Debug: Check if table info exists
				if (waiterOrders.length > 0) {
					console.log('📊 Sample order structure:', {
						tableId: waiterOrders[0].tableId,
						table: waiterOrders[0].table,
						total: waiterOrders[0].total,
						hasTableName: !!waiterOrders[0].table?.name,
					})
				}

				// Update notification count (PENDING items needing acceptance)
				const pendingCount = waiterOrders.reduce((count, order) => {
					return (
						count +
						order.items.filter((item) => item.status === ITEM_STATUS.PENDING).length
					)
				}, 0)
				setNewHelpRequestsCount(pendingCount)

				console.log('✅ Waiter orders loaded:', waiterOrders.length)
			} else {
				console.error('❌ Failed to load orders:', {
					pending: pendingResult.message,
					inProgress: inProgressResult.message,
				})
			}
		} catch (error) {
			console.error('❌ Error fetching orders:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	// Initial load
	useEffect(() => {
		fetchOrders()

		// Auto-refresh every 30 seconds
		intervalRef.current = setInterval(() => {
			fetchOrders(false)
		}, 30000)

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user])

	// Filter orders based on view and search
	useEffect(() => {
		let filtered = [...orders]

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
			// Show orders with all items SERVED (ready for payment)
			filtered = filtered.filter((order) => {
				const allServed = order.items.every((item) => item.status === ITEM_STATUS.SERVED)
				return allServed
			})
		} else if (selectedView === 'PAYMENT') {
			// Show orders waiting for payment (all items served, payment pending)
			filtered = filtered.filter((order) => {
				const allServed = order.items.every((item) => item.status === ITEM_STATUS.SERVED)
				return allServed && order.paymentStatus === PAYMENT_STATUS.PENDING
			})
		}

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

	// Mark items as served
	const handleMarkServed = async (orderId, itemIds) => {
		if (!user?.userId) return

		try {
			const tenantId = user.userId

			const result = await updateOrderItemsStatusAPI(tenantId, orderId, {
				itemIds,
				status: 'SERVED',
			})

			if (result.success) {
				console.log('✅ Items marked as served:', result.data)
				// Refresh orders
				fetchOrders(false)
			} else {
				console.error('❌ Failed to mark items as served:', result.message)
				alert(`Failed to update status: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error marking items as served:', error)
			alert('An error occurred while marking items as served')
		}
	}

	// Accept PENDING items (Waiter approves order)
	const handleAcceptItems = async (orderId, itemIds) => {
		if (!user?.userId) return

		try {
			const tenantId = user.userId

			const result = await updateOrderItemsStatusAPI(tenantId, orderId, {
				itemIds,
				status: 'ACCEPTED',
				waiterId: user.userId,
			})

			if (result.success) {
				console.log('✅ Items accepted:', result.data)
				// Refresh orders
				fetchOrders(false)
			} else {
				console.error('❌ Failed to accept items:', result.message)
				alert(`Failed to accept items: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error accepting items:', error)
			alert('An error occurred while accepting items')
		}
	}

	// Reject PENDING items (Waiter declines order)
	const handleRejectItems = async (orderId, itemIds, reason = 'Declined by waiter') => {
		if (!user?.userId) return

		// Confirm rejection
		const userReason = prompt('Enter rejection reason:', reason)
		if (!userReason) return // User cancelled

		try {
			const tenantId = user.userId

			const result = await updateOrderItemsStatusAPI(tenantId, orderId, {
				itemIds,
				status: 'REJECTED',
				rejectionReason: userReason,
				waiterId: user.userId,
			})

			if (result.success) {
				console.log('✅ Items rejected:', result.data)
				// Refresh orders
				fetchOrders(false)
			} else {
				console.error('❌ Failed to reject items:', result.message)
				alert(`Failed to reject items: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error rejecting items:', error)
			alert('An error occurred while rejecting items')
		}
	}

	// Mark order as paid
	const handleMarkPaid = async (orderId, paymentMethod = 'CASH') => {
		if (!user?.userId) return

		try {
			const tenantId = user.userId

			const result = await updateOrderPaymentAPI(tenantId, orderId, {
				paymentStatus: 'PAID',
				paymentMethod: paymentMethod,
			})

			if (result.success) {
				console.log('✅ Order marked as paid:', result.data)
				// Refresh orders
				fetchOrders(false)
			} else {
				console.error('❌ Failed to mark order as paid:', result.message)
				alert(`Failed to update payment: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error marking order as paid:', error)
			alert('An error occurred while updating payment')
		}
	}

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
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
						<p className="text-gray-400">Serve customers and manage payments</p>
					</div>
					<button
						onClick={() => fetchOrders(false)}
						disabled={refreshing}
						className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
					>
						<span
							className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`}
						>
							refresh
						</span>
						Refresh
					</button>
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
							const allServed = order.items.every(
								(item) => item.status === ITEM_STATUS.SERVED,
							)
							const needsPayment =
								allServed && order.paymentStatus === PAYMENT_STATUS.PENDING

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
											{selectedView !== 'PENDING' && (
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
															onClick={() =>
																handleRejectItems(
																	order.id,
																	order.items
																		.filter((item) => item.status === ITEM_STATUS.PENDING)
																		.map((item) => item.id),
																)
															}
															title="Reject all pending items"
															className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
														>
															<span className="material-symbols-outlined text-base">
																close
															</span>
															Reject All
														</button>
														<button
															onClick={() =>
																handleAcceptItems(
																	order.id,
																	order.items
																		.filter((item) => item.status === ITEM_STATUS.PENDING)
																		.map((item) => item.id),
																)
															}
															title="Accept all pending items"
															className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
														>
															<span className="material-symbols-outlined text-base">
																check
															</span>
															Accept All
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
															{/* PENDING item buttons */}
															{item.status === ITEM_STATUS.PENDING && (
																<>
																	<button
																		onClick={() => handleAcceptItems(order.id, [item.id])}
																		title="Accept item"
																		className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
																	>
																		<span className="material-symbols-outlined text-base">
																			check
																		</span>
																		Accept
																	</button>
																	<button
																		onClick={() => handleRejectItems(order.id, [item.id])}
																		title="Reject item"
																		className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
																	>
																		<span className="material-symbols-outlined text-base">
																			close
																		</span>
																		Reject
																	</button>
																</>
															)}

															{/* READY item button */}
															{item.status === ITEM_STATUS.READY && (
																<button
																	onClick={() => handleMarkServed(order.id, [item.id])}
																	title="Mark as served"
																	className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
																>
																	<span className="material-symbols-outlined text-base">
																		check_circle
																	</span>
																	Served
																</button>
															)}
														</div>
													</div>
												</div>
											))}

											{/* Payment Button (for orders with all items served) */}
											{needsPayment && (
												<div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
													<div className="flex items-center justify-between mb-3">
														<div>
															<p className="text-white font-semibold">Total Amount</p>
															<p className="text-blue-400 text-2xl font-bold">
																${formatPrice(order.total)}
															</p>
														</div>
													</div>

													<div className="flex gap-2">
														<button
															onClick={() => handleMarkPaid(order.id, 'CASH')}
															className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
														>
															💵 Cash
														</button>
														<button
															onClick={() => handleMarkPaid(order.id, 'CARD')}
															className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
														>
															💳 Card
														</button>
														<button
															onClick={() => handleMarkPaid(order.id, 'MOMO')}
															className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors"
														>
															📱 MoMo
														</button>
													</div>
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
