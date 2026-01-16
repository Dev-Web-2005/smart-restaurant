import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { useAlert } from '../../contexts/AlertContext'
// import { useNotifications } from '../../contexts/NotificationContext' // Not used yet
import { CardSkeleton } from '../../components/common/LoadingSpinner'
import socketClient from '../../services/websocket/socketClient'
import {
	getOrdersAPI,
	acceptOrderItemsAPI,
	rejectOrderItemsAPI,
	markItemsServedAPI,
	markOrderPaidAPI,
} from '../../services/api/orderAPI'

/**
 * WaiterPanel - Staff/Waiter Dashboard
 *
 * Displays orders ready for waiter attention and help requests:
 * - ORDERS Tab:
 *   - PENDING: New orders to accept/reject and notify kitchen
 *   - READY: Items ready to be served to customers
 *   - SERVED: Items already served, waiting for payment
 *   - PAYMENT: Mark orders as paid to complete them
 * - HELP Tab:
 *   - Help requests from customers
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

// Mock help requests - will be replaced with real API later
const mockHelpRequests = [
	{
		id: '1',
		tableId: 'T-102',
		tableName: 'Table 2',
		message: 'Need napkins please',
		createdAt: new Date(Date.now() - 60000).toISOString(),
		acknowledged: false,
	},
	{
		id: '2',
		tableId: 'T-105',
		tableName: 'Table 5',
		message: 'Check please',
		createdAt: new Date(Date.now() - 180000).toISOString(),
		acknowledged: false,
	},
]

// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
	const date = new Date(timestamp)
	const now = new Date()
	const diffMs = now - date
	const diffMins = Math.floor(diffMs / 60000)

	if (diffMins < 1) return 'Just now'
	if (diffMins < 60) return `${diffMins}m ago`
	const diffHours = Math.floor(diffMins / 60)
	if (diffHours < 24) return `${diffHours}h ago`
	return date.toLocaleDateString()
}

const getFullDateTime = (timestamp) => {
	const date = new Date(timestamp)
	return date.toLocaleString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

const WaiterPanel = () => {
	const { user, logout } = useUser()
	const { showSuccess } = useAlert()
	const navigate = useNavigate()
	const { ownerId } = useParams()
	// const { setNewHelpRequestsCount } = useNotifications() // Not used yet

	// === ORDERS State (OrderManagement logic) ===
	const [loading, setLoading] = useState(true)
	// const [refreshing, setRefreshing] = useState(false) // Not displayed in UI
	const [orders, setOrders] = useState([])
	const [filteredOrders, setFilteredOrders] = useState([])
	const [selectedView, setSelectedView] = useState('orders') // 'orders' | 'help'
	const [ordersView, setOrdersView] = useState('PENDING') // PENDING, READY, SERVED, PAYMENT
	const [searchQuery, setSearchQuery] = useState('')
	const [expandedOrders, setExpandedOrders] = useState(new Set())
	const [processingOrders, setProcessingOrders] = useState(new Set()) // Track orders being processed

	// === HELP State (Keep existing logic) ===
	const [helpRequests, setHelpRequests] = useState(mockHelpRequests)

	/**
	 * Fetch orders from API - useCallback to stabilize function reference
	 */
	const fetchOrders = useCallback(
		async (_silent = false) => {
			try {
				// if (!_silent) setRefreshing(true) // Not displayed in UI

				// For STAFF role, tenantId is stored in user.ownerId (restaurant owner's ID)
				const tenantId =
					user?.ownerId || ownerId || localStorage.getItem('currentTenantId')
				if (!tenantId) {
					console.warn('⚠️ No tenantId found, skipping order fetch')
					return
				}

				console.log('🔄 Fetching orders for tenant:', tenantId)

				// Fetch orders - DO NOT filter by order status here
				// New orders from customer start with PENDING status
				// After staff accepts items, order becomes IN_PROGRESS
				// We need both PENDING and IN_PROGRESS orders for waiter workflow
				const response = await getOrdersAPI({
					tenantId,
					page: 1,
					limit: 100,
					// status: 'IN_PROGRESS', // ❌ DON'T filter - need PENDING orders too!
					paymentStatus: 'PENDING', // Only unpaid orders
				})

				if (response?.code === 1000 && response?.data) {
					// Backend returns PaginatedOrdersResponseDto: { orders, total, page, limit, totalPages }
					const fetchedOrders = response.data.orders || []
					console.log('✅ Orders fetched:', fetchedOrders.length)
					setOrders(fetchedOrders)
				} else {
					console.warn('⚠️ Unexpected response format:', response)
					setOrders([])
				}
			} catch (error) {
				console.error('❌ Error fetching orders:', error)
				setOrders([])
			} finally {
				// if (!_silent) setRefreshing(false) // Not displayed in UI
			}
		},
		[user?.ownerId, ownerId],
	) // Dependencies for useCallback

	/**
	 * Accept order items (waiter accepts pending items)
	 * Uses updateOrderItemsStatus() via PATCH /items-status
	 * This emits 'order.items.accepted' WebSocket event for customer notification
	 *
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
			// For STAFF role, tenantId is stored in user.ownerId (restaurant owner's ID)
			const tenantId = user?.ownerId || ownerId || localStorage.getItem('currentTenantId')
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

			// Call API to accept items - uses PATCH /items-status with status='ACCEPTED'
			await acceptOrderItemsAPI({
				tenantId,
				orderId,
				itemIds,
				waiterId,
			})

			console.log('✅ Items accepted successfully by backend')
			showSuccess('Items accepted and sent to kitchen')

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
				await fetchOrders(true)

				// Check if items were actually updated
				const currentOrder = orders.find((o) => o.id === orderId)
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
							`⚠️ Data still stale on attempt ${retryCount + 1}, items still PENDING`,
						)
					}
				} else {
					// Order not found - might have moved to different status
					dataUpdated = true
					console.log('✅ Order moved to different status (accepted successfully)')
					break
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
	 * Uses updateOrderItemsStatus() via PATCH /items-status with status='REJECTED'
	 * This emits 'order.items.rejected' WebSocket event for customer notification
	 *
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
			// For STAFF role, tenantId is stored in user.ownerId (restaurant owner's ID)
			const tenantId = user?.ownerId || ownerId || localStorage.getItem('currentTenantId')
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

			// Call API to reject items - uses PATCH /items-status with status='REJECTED'
			await rejectOrderItemsAPI({
				tenantId,
				orderId,
				itemIds,
				waiterId,
				reason: reason.trim(),
			})

			console.log('✅ Items rejected successfully')
			showSuccess('Items rejected')

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
	 * Uses updateOrderItemsStatus() via PATCH /items-status with status='SERVED'
	 * This emits 'order.items.served' WebSocket event for customer notification
	 *
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
			// For STAFF role, tenantId is stored in user.ownerId (restaurant owner's ID)
			const tenantId = user?.ownerId || ownerId || localStorage.getItem('currentTenantId')
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

			// Call API to mark items served - uses PATCH /items-status with status='SERVED'
			await markItemsServedAPI({
				tenantId,
				orderId,
				itemIds,
				waiterId,
			})

			console.log('✅ Items marked as served successfully')
			showSuccess('Items marked as served')

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
		try {
			// For STAFF role, tenantId is stored in user.ownerId (restaurant owner's ID)
			const tenantId = user?.ownerId || ownerId || localStorage.getItem('currentTenantId')

			if (!tenantId) {
				console.error('❌ Missing tenantId')
				return
			}

			console.log(`💰 Marking order ${orderId} as paid via ${paymentMethod}`)

			await markOrderPaidAPI({
				tenantId,
				orderId,
				paymentMethod,
			})

			console.log('✅ Order marked as paid successfully')
			showSuccess(`Payment received via ${paymentMethod}`)

			// Refresh orders to get updated status
			await fetchOrders(true)
		} catch (error) {
			console.error('❌ Error marking order as paid:', error)
			alert(error.response?.data?.message || 'Failed to mark order as paid')
		}
	}

	/**
	 * Handle help request acknowledgment
	 */
	const handleResolveHelp = (helpId) => {
		setHelpRequests((prev) =>
			prev.map((req) => (req.id === helpId ? { ...req, acknowledged: true } : req)),
		)
		showSuccess('Help Request', 'Help request acknowledged')
	}

	/**
	 * Handle logout
	 */
	const handleLogout = () => {
		logout()
		if (ownerId) {
			navigate(`/login/${ownerId}`)
		} else {
			navigate('/login')
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
	}, [fetchOrders]) // Run once on mount with fetchOrders dependency

	/**
	 * WebSocket setup - Separate useEffect to prevent reconnections
	 * NOTE: STAFF role auto-joins 'tenant:{tenantId}:waiters' room on backend
	 * This is handled by room-manager.service.ts based on JWT token role
	 */
	useEffect(() => {
		const setupWebSocket = async () => {
			// Use window.accessToken (set by authAPI after login/refresh)
			const authToken = window.accessToken || localStorage.getItem('authToken')
			// For STAFF role, tenantId is stored in user.ownerId (restaurant owner's ID)
			// IMPORTANT: Do NOT use user.userId as tenantId - that's the waiter's ID, not the restaurant's
			const tenantId = user?.ownerId || ownerId || localStorage.getItem('currentTenantId')

			if (!authToken || !tenantId) {
				console.error('❌ [WaiterPanel] No token or tenantId, skipping WebSocket setup')
				return
			}

			// Connect WebSocket if not already connected
			if (!socketClient.isSocketConnected()) {
				socketClient.connect(authToken)

				// Wait for connection before registering listeners
				try {
					await socketClient.waitForConnection(5000)
					console.log('✅ [WaiterPanel] WebSocket connected successfully')
					console.log(
						'📍 [WaiterPanel] STAFF role will auto-join tenant:waiters room via backend',
					)
				} catch (error) {
					console.error('❌ [WaiterPanel] WebSocket connection failed:', error.message)
					return
				}
			} else {
				console.log('🔵 [WaiterPanel] WebSocket already connected, reusing connection')
			}

			// Define event handlers for STAFF/WAITER
			const handleNewOrderItems = (payload) => {
				console.log('🆕 [WaiterPanel] New order received', payload)
				console.log('🔄 [WaiterPanel] Refreshing orders after new order received')

				// Show notification
				if (payload?.data) {
					const { tableId, items } = payload.data
					const itemCount = items?.length || 0

					// Browser notification for new orders
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
				console.log('✅ [WaiterPanel] Order items accepted', payload)
				console.log('🔄 [WaiterPanel] Refreshing orders after items accepted')
				fetchOrders(true)
			}

			const handleItemsRejected = (payload) => {
				console.log('❌ [WaiterPanel] Order items rejected', payload)
				console.log('🔄 [WaiterPanel] Refreshing orders after items rejected')
				fetchOrders(true)
			}

			const handleItemsPreparing = (payload) => {
				console.log('🍳 [WaiterPanel] Order items preparing', payload)
				console.log('🔄 [WaiterPanel] Refreshing orders after items preparing')
				fetchOrders(true)
			}

			const handleItemsReady = (payload) => {
				console.log('🍽️ [WaiterPanel] Order items ready', payload)
				console.log('🔄 [WaiterPanel] Refreshing orders after items ready')

				// Show notification for ready items (waiter needs to pick up)
				if (payload?.data) {
					const itemCount = payload.data.items?.length || 0
					const tableId = payload.data.tableId

					if ('Notification' in window && Notification.permission === 'granted') {
						new Notification('Items Ready for Pickup!', {
							body: `${itemCount} item(s) ready for Table ${tableId}`,
							icon: '/logo.png',
						})
					}
				}

				fetchOrders(true)
			}

			const handleItemsServed = (payload) => {
				console.log('🍴 [WaiterPanel] Order items served', payload)
				console.log('🔄 [WaiterPanel] Refreshing orders after items served')
				fetchOrders(true)
			}

			// Listen for events - these are sent to tenant:waiters room
			socketClient.on('order.items.new', handleNewOrderItems)
			socketClient.on('order.items.accepted', handleItemsAccepted)
			socketClient.on('order.items.rejected', handleItemsRejected)
			socketClient.on('order.items.preparing', handleItemsPreparing)
			socketClient.on('order.items.ready', handleItemsReady)
			socketClient.on('order.items.served', handleItemsServed)
		}

		// Only setup WebSocket if user is available
		// For STAFF role, tenantId is stored in user.ownerId
		const effectiveTenantId =
			user?.ownerId || ownerId || localStorage.getItem('currentTenantId')
		if (effectiveTenantId) {
			setupWebSocket()
		} else {
			console.error('❌ [WaiterPanel] User authentication required for real-time updates')
		}

		// Cleanup with proper handler references - remove all listeners for these events
		return () => {
			// Note: socketClient.off without callback removes all listeners for the event
			// This is acceptable for cleanup as we're unmounting the component
			socketClient.off('order.items.new')
			socketClient.off('order.items.accepted')
			socketClient.off('order.items.rejected')
			socketClient.off('order.items.preparing')
			socketClient.off('order.items.ready')
			socketClient.off('order.items.served')
			console.log('🔴 [WaiterPanel] WebSocket listeners removed')
		}
	}, [user?.ownerId, ownerId, fetchOrders]) // Include fetchOrders to ensure handlers always use current version

	/**
	 * Filter orders based on view and search
	 */
	useEffect(() => {
		let filtered = [...orders]

		// Filter by view
		if (ordersView === 'PENDING') {
			// Show orders with at least one PENDING item
			filtered = filtered
				.map((order) => {
					const items = order.items.filter((item) => item.status === ITEM_STATUS.PENDING)
					if (items.length === 0) return null
					return { ...order, items }
				})
				.filter(Boolean)
		} else if (ordersView === 'READY') {
			// Show orders with at least one READY item
			filtered = filtered
				.map((order) => {
					const items = order.items.filter((item) => item.status === ITEM_STATUS.READY)
					if (items.length === 0) return null
					return { ...order, items }
				})
				.filter(Boolean)
		} else if (ordersView === 'SERVED') {
			// Show orders with at least one SERVED item
			filtered = filtered
				.map((order) => {
					const items = order.items.filter((item) => item.status === ITEM_STATUS.SERVED)
					if (items.length === 0) return null
					return { ...order, items }
				})
				.filter(Boolean)
		} else if (ordersView === 'PAYMENT') {
			// Show orders waiting for payment (all items served, payment pending)
			filtered = filtered.filter((order) => {
				if (!order.items || order.items.length === 0) return false
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
	}, [orders, ordersView, searchQuery])

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

	// Calculate stats
	const pendingCount = orders.reduce(
		(count, order) =>
			count + order.items.filter((item) => item.status === ITEM_STATUS.PENDING).length,
		0,
	)

	const readyCount = orders.reduce(
		(count, order) =>
			count + order.items.filter((item) => item.status === ITEM_STATUS.READY).length,
		0,
	)

	const servedCount = orders.reduce(
		(count, order) =>
			count + order.items.filter((item) => item.status === ITEM_STATUS.SERVED).length,
		0,
	)

	const paymentCount = orders.filter((order) => {
		if (!order.items || order.items.length === 0) return false
		const allServed = order.items.every((item) => item.status === ITEM_STATUS.SERVED)
		return allServed && order.paymentStatus === PAYMENT_STATUS.PENDING
	}).length

	const filteredHelpRequests = helpRequests.filter((req) => !req.acknowledged)
	const helpRequestsCount = filteredHelpRequests.length

	// Render loading skeleton
	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
				<div className="max-w-7xl mx-auto space-y-6">
					<div className="flex items-center justify-between">
						<div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
						<div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
					</div>
					<CardSkeleton />
					<CardSkeleton />
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Top Navigation Bar */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-white mb-1">Waiter Panel</h1>
						<p className="text-gray-400">Serve customers and manage requests</p>
					</div>
					<button
						onClick={handleLogout}
						className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
					>
						<span className="material-symbols-outlined text-lg">logout</span>
						Logout
					</button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
					<div className="bg-yellow-500/20 backdrop-blur-md rounded-lg p-4 border border-yellow-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-yellow-400 text-3xl">
								pending_actions
							</span>
							<div>
								<p className="text-yellow-400 text-sm font-medium">Pending</p>
								<p className="text-white text-2xl font-bold">{pendingCount}</p>
							</div>
						</div>
					</div>

					<div className="bg-green-500/20 backdrop-blur-md rounded-lg p-4 border border-green-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-green-400 text-3xl">
								restaurant
							</span>
							<div>
								<p className="text-green-400 text-sm font-medium">Ready</p>
								<p className="text-white text-2xl font-bold">{readyCount}</p>
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
								<p className="text-white text-2xl font-bold">{servedCount}</p>
							</div>
						</div>
					</div>

					<div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-4 border border-blue-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-blue-400 text-3xl">
								payments
							</span>
							<div>
								<p className="text-blue-400 text-sm font-medium">Payment</p>
								<p className="text-white text-2xl font-bold">{paymentCount}</p>
							</div>
						</div>
					</div>

					<div className="bg-orange-500/20 backdrop-blur-md rounded-lg p-4 border border-orange-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-orange-400 text-3xl">
								help
							</span>
							<div>
								<p className="text-orange-400 text-sm font-medium">Help</p>
								<p className="text-white text-2xl font-bold">{helpRequestsCount}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Tab Navigation */}
				<div className="flex gap-2">
					<button
						onClick={() => setSelectedView('orders')}
						className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
							selectedView === 'orders'
								? 'bg-blue-500 text-white'
								: 'bg-white/10 text-gray-300 hover:bg-white/20'
						}`}
					>
						<span className="material-symbols-outlined">receipt_long</span>
						Orders
					</button>
					<button
						onClick={() => setSelectedView('help')}
						className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 relative ${
							selectedView === 'help'
								? 'bg-orange-500 text-white'
								: 'bg-white/10 text-gray-300 hover:bg-white/20'
						}`}
					>
						<span className="material-symbols-outlined">help</span>
						Help Requests
						{helpRequestsCount > 0 && (
							<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
								{helpRequestsCount}
							</span>
						)}
					</button>
				</div>

				{/* Orders View */}
				{selectedView === 'orders' && (
					<>
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
										onClick={() => setOrdersView(view)}
										className={`px-4 py-2 rounded-lg font-medium transition-colors ${
											ordersView === view
												? 'bg-blue-500 text-white'
												: 'bg-white/10 text-gray-300 hover:bg-white/20'
										}`}
									>
										{view === 'PENDING'
											? 'Pending'
											: view === 'READY'
											? 'Ready'
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
													{ordersView === 'PAYMENT' && (
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
													{ordersView === 'PENDING' &&
														order.items.some(
															(item) => item.status === ITEM_STATUS.PENDING,
														) && (
															<div className="flex justify-end gap-2 mb-3">
																<button
																	onClick={() =>
																		handleRejectItems(
																			order.id,
																			order.items
																				.filter(
																					(item) => item.status === ITEM_STATUS.PENDING,
																				)
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
																				.filter(
																					(item) => item.status === ITEM_STATUS.PENDING,
																				)
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
																		<h4 className="text-white font-semibold">
																			{item.name}
																		</h4>
																		<span
																			className={`px-2 py-1 rounded text-xs font-medium ${
																				ITEM_STATUS_COLORS[item.status]
																			}`}
																		>
																			{ITEM_STATUS_LABELS[item.status]}
																		</span>
																	</div>

																	<p className="text-gray-400 text-sm mb-2">
																		Quantity: {item.quantity} × $
																		{formatPrice(item.unitPrice)}= $
																		{formatPrice(item.subtotal)}
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
																		<p className="text-yellow-400 text-sm">
																			📝 {item.notes}
																		</p>
																	)}
																</div>

																{/* Action Buttons - Right side */}
																<div className="flex flex-col gap-2 items-end">
																	{/* READY item button */}
																	{item.status === ITEM_STATUS.READY && (
																		<button
																			onClick={() =>
																				handleMarkServed(order.id, [item.id])
																			}
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

													{/* Payment Button (only show in PAYMENT view) */}
													{ordersView === 'PAYMENT' && needsPayment && (
														<div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
															<div className="mb-3">
																<p className="text-white font-semibold mb-3">
																	Payment Summary
																</p>

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
																			Total:
																		</span>
																		<span className="text-blue-400 text-xl font-bold">
																			{formatPrice(order.total)} VND
																		</span>
																	</div>
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
					</>
				)}

				{/* Help Requests View - PRESERVED */}
				{selectedView === 'help' && (
					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-white mb-4">Help Requests</h2>
						{filteredHelpRequests.length === 0 ? (
							<div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-12 text-center">
								<span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
									check_circle
								</span>
								<p className="text-gray-400 text-lg">No new help requests</p>
							</div>
						) : (
							filteredHelpRequests.map((request) => (
								<div
									key={request.id}
									className="bg-orange-500/10 backdrop-blur-md rounded-lg p-4 border border-orange-500/30"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<span className="material-symbols-outlined text-orange-400 text-3xl">
												help
											</span>
											<div>
												<h3 className="text-white text-lg font-semibold">
													{request.tableName}
												</h3>
												<p className="text-gray-300 text-sm">{request.message}</p>
												<p className="text-gray-400 text-xs mt-1">
													{formatTimestamp(new Date(request.createdAt).getTime())}
												</p>
											</div>
										</div>
										<button
											onClick={() => handleResolveHelp(request.id)}
											className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center gap-2"
										>
											<span className="material-symbols-outlined">check</span>
											Acknowledge
										</button>
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default WaiterPanel
