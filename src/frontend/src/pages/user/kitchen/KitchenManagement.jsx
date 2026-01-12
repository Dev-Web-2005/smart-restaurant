import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '../../../contexts/UserContext'
import { useNotifications } from '../../../contexts/NotificationContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { InlineLoader, CardSkeleton } from '../../../components/common/LoadingSpinner'
import { getOrdersAPI, updateOrderItemsStatusAPI } from '../../../services/api/orderAPI'
import { speakText } from '../../../services/api/ttsAPI'
import {
	generateKitchenAnnouncement,
	generateNewItemsAnnouncement,
	extractPreparingItems,
	createItemKey,
} from '../../../utils/kitchenAnnouncer'

/**
 * KitchenManagement - Kitchen Display System (KDS)
 *
 * Displays orders that need kitchen attention:
 * - ACCEPTED: Orders accepted by kitchen, ready to cook
 * - PREPARING: Orders currently being cooked (with countdown timer)
 *
 * Status Flow:
 * ACCEPTED → PREPARING → READY (moves to Order Management)
 *
 * Note: PENDING items are handled by Order Management (Waiter)
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
	[ITEM_STATUS.SERVED]: 'bg-gray-500/20 text-gray-300',
	[ITEM_STATUS.REJECTED]: 'bg-red-500/20 text-red-300',
	[ITEM_STATUS.CANCELLED]: 'bg-gray-500/20 text-gray-300',
}

const KitchenManagement = () => {
	const { user } = useUser()
	const { setPendingOrdersCount } = useNotifications()

	// State management
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [orders, setOrders] = useState([])
	const [filteredOrders, setFilteredOrders] = useState([])
	const [selectedStatus, setSelectedStatus] = useState('ACCEPTED') // ACCEPTED, PREPARING
	const [searchQuery, setSearchQuery] = useState('')
	const [expandedOrders, setExpandedOrders] = useState(new Set())

	// TTS state management
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [announcedItems, setAnnouncedItems] = useState(new Set()) // Track which items have been announced
	const [autoAnnounce, setAutoAnnounce] = useState(true) // Toggle auto-announcement

	// Auto-refresh interval
	const intervalRef = useRef(null)
	const previousPreparingItemsRef = useRef(new Set()) // Track previous preparing items

	// Fetch orders from API
	const fetchOrders = async (showLoader = true) => {
		if (!user?.userId) return

		if (showLoader) setLoading(true)
		else setRefreshing(true)

		try {
			const tenantId = user.userId

			// Fetch orders with PENDING and IN_PROGRESS status
			// Kitchen shows items that are ACCEPTED or PREPARING
			const [pendingResult, inProgressResult] = await Promise.all([
				getOrdersAPI(tenantId, { status: 'PENDING', limit: 100, page: 1 }),
				getOrdersAPI(tenantId, { status: 'IN_PROGRESS', limit: 100, page: 1 }),
			])

			if (pendingResult.success && inProgressResult.success) {
				const ordersData = [
					...(pendingResult.data?.orders || []),
					...(inProgressResult.data?.orders || []),
				]

				// Filter orders that have items in kitchen statuses
				const kitchenOrders = ordersData
					.map((order) => {
						// Filter items to only show ACCEPTED, PREPARING
						const kitchenItems = (order.items || []).filter(
							(item) =>
								item.status === ITEM_STATUS.ACCEPTED ||
								item.status === ITEM_STATUS.PREPARING,
						)

						if (kitchenItems.length === 0) return null

						return {
							...order,
							items: kitchenItems,
						}
					})
					.filter(Boolean)

				setOrders(kitchenOrders)
				setFilteredOrders(kitchenOrders)

				// Update notification count (ACCEPTED items needing to start cooking)
				const acceptedCount = kitchenOrders.reduce((count, order) => {
					return (
						count +
						order.items.filter((item) => item.status === ITEM_STATUS.ACCEPTED).length
					)
				}, 0)
				setPendingOrdersCount(acceptedCount)

				// Check for new preparing items and auto-announce if enabled
				if (autoAnnounce && !showLoader) {
					checkAndAnnounceNewItems(kitchenOrders)
				}

				console.log('✅ Kitchen orders loaded:', kitchenOrders.length)
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

	// Check for new preparing items and announce them
	const checkAndAnnounceNewItems = (currentOrders) => {
		// Extract all preparing items from current orders
		const preparingOrders = currentOrders.filter((order) =>
			order.items.some((item) => item.status === ITEM_STATUS.PREPARING),
		)

		const currentPreparingItems = extractPreparingItems(
			preparingOrders.map((order) => ({
				...order,
				items: order.items.filter((item) => item.status === ITEM_STATUS.PREPARING),
			})),
		)

		// Find new items (not in previous set and not already announced)
		const newItems = currentPreparingItems.filter((item) => {
			const itemKey = item.itemKey
			return (
				!previousPreparingItemsRef.current.has(itemKey) && !announcedItems.has(itemKey)
			)
		})

		// Update previous preparing items set
		previousPreparingItemsRef.current = new Set(
			currentPreparingItems.map((item) => item.itemKey),
		)

		// Announce new items if any
		if (newItems.length > 0 && !isSpeaking) {
			announceNewItems(newItems)
		}
	}

	// Announce new items
	const announceNewItems = async (newItems) => {
		const token = window.accessToken

		if (!token) {
			console.error('❌ No access token available for TTS')
			return
		}

		if (isSpeaking) {
			console.log('⏭️ Already speaking, skipping announcement')
			return
		}

		setIsSpeaking(true)

		try {
			const announcementText = generateNewItemsAnnouncement(newItems)
			console.log('🔊 Announcing new items:', announcementText)

			const success = await speakText(announcementText, token)

			if (success) {
				console.log('✅ Successfully announced new items')
				// Mark items as announced
				setAnnouncedItems((prev) => {
					const newSet = new Set(prev)
					newItems.forEach((item) => newSet.add(item.itemKey))
					return newSet
				})
			} else {
				console.error('❌ Failed to announce new items')
			}
		} catch (error) {
			console.error('❌ Error announcing new items:', error)
		} finally {
			setIsSpeaking(false)
		}
	}

	// Announce all preparing orders
	const announceAllPreparingOrders = async () => {
		const token = window.accessToken

		if (!token) {
			alert('No authentication token available. Please login again.')
			return
		}

		if (isSpeaking) {
			console.log('⏭️ Already speaking, please wait')
			return
		}

		// Get all preparing orders
		const preparingOrders = orders.filter((order) =>
			order.items.some((item) => item.status === ITEM_STATUS.PREPARING),
		)

		if (preparingOrders.length === 0) {
			alert('No orders are currently preparing')
			return
		}

		setIsSpeaking(true)

		try {
			// Filter to only preparing items
			const ordersWithPreparingItems = preparingOrders.map((order) => ({
				...order,
				items: order.items.filter((item) => item.status === ITEM_STATUS.PREPARING),
			}))

			const announcementText = generateKitchenAnnouncement(ordersWithPreparingItems)
			console.log('🔊 Announcing all preparing orders:', announcementText)

			const success = await speakText(announcementText, token)

			if (!success) {
				alert('Failed to announce orders. Please check console for errors.')
			} else {
				console.log('✅ Successfully announced all preparing orders')
			}
		} catch (error) {
			console.error('❌ Error announcing orders:', error)
			alert('Failed to announce orders. Please try again.')
		} finally {
			setIsSpeaking(false)
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

	// Filter orders based on status and search
	useEffect(() => {
		let filtered = [...orders]

		// Filter by status
		const statusValue = ITEM_STATUS[selectedStatus]
		filtered = filtered
			.map((order) => {
				const items = order.items.filter((item) => item.status === statusValue)
				if (items.length === 0) return null
				return { ...order, items }
			})
			.filter(Boolean)

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
	}, [orders, selectedStatus, searchQuery])

	// Update item status
	const handleUpdateItemStatus = async (
		orderId,
		itemIds,
		newStatus,
		rejectionReason = null,
	) => {
		if (!user?.userId) return

		try {
			const tenantId = user.userId

			const result = await updateOrderItemsStatusAPI(tenantId, orderId, {
				itemIds,
				status: ITEM_STATUS_LABELS[newStatus].toUpperCase(),
				rejectionReason,
			})

			if (result.success) {
				console.log('✅ Item status updated:', result.data)

				// Remove items from announced set when marked as READY
				if (newStatus === ITEM_STATUS.READY) {
					setAnnouncedItems((prev) => {
						const newSet = new Set(prev)
						itemIds.forEach((itemId) => {
							const itemKey = createItemKey(orderId, itemId)
							newSet.delete(itemKey)
						})
						return newSet
					})
				}

				// Refresh orders
				fetchOrders(false)
			} else {
				console.error('❌ Failed to update item status:', result.message)
				alert(`Failed to update status: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error updating item status:', error)
			alert('An error occurred while updating item status')
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

	// Calculate elapsed time since item started preparing
	const calculateElapsedTime = (preparingAt) => {
		if (!preparingAt) return null
		const start = new Date(preparingAt)
		const now = new Date()
		const diffMs = now - start
		const diffMins = Math.floor(diffMs / 60000)
		return diffMins
	}

	// Get countdown display
	const getTimeDisplay = (item) => {
		if (item.status !== ITEM_STATUS.PREPARING || !item.preparingAt) return null

		const elapsed = calculateElapsedTime(item.preparingAt)
		if (elapsed === null) return null

		const estimatedTime = item.estimatedPrepTime || 15 // Default 15 minutes
		const remaining = estimatedTime - elapsed

		if (remaining > 0) {
			return (
				<span className="text-orange-400 font-medium">⏱️ {remaining} mins remaining</span>
			)
		} else {
			return (
				<span className="text-red-400 font-medium animate-pulse">
					⚠️ Overdue by {Math.abs(remaining)} mins
				</span>
			)
		}
	}

	// Render loading skeleton
	if (loading) {
		return (
			<BasePageLayout activeRoute="/user/kitchen">
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
		<BasePageLayout activeRoute="/user/kitchen">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">Kitchen Display</h1>
						<p className="text-gray-400">Manage incoming orders and cooking status</p>
					</div>
					<div className="flex items-center gap-2">
						{/* Test TTS button */}
						<button
							onClick={async () => {
								const token = window.accessToken
								if (!token) {
									alert('No token found. Please login.')
									return
								}
								setIsSpeaking(true)
								try {
									await speakText('Test announcement. This is a test.', token)
									console.log('✅ Test announcement completed')
								} catch (error) {
									console.error('❌ Test failed:', error)
									alert('Test failed: ' + error.message)
								} finally {
									setIsSpeaking(false)
								}
							}}
							disabled={isSpeaking}
							className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 rounded-lg transition-colors disabled:opacity-50"
							title="Test TTS"
						>
							<span className="material-symbols-outlined">play_circle</span>
							<span className="text-sm font-medium">Test</span>
						</button>

						{/* Auto-announce toggle */}
						<button
							onClick={() => setAutoAnnounce(!autoAnnounce)}
							className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
								autoAnnounce
									? 'bg-green-500/20 text-green-400 border border-green-500/50'
									: 'bg-white/10 text-gray-400 border border-white/20'
							}`}
							title={autoAnnounce ? 'Auto-announce enabled' : 'Auto-announce disabled'}
						>
							<span className="material-symbols-outlined">
								{autoAnnounce ? 'volume_up' : 'volume_off'}
							</span>
							<span className="text-sm font-medium">
								{autoAnnounce ? 'Auto' : 'Manual'}
							</span>
						</button>

						{/* Announce all button */}
						<button
							onClick={announceAllPreparingOrders}
							disabled={isSpeaking || orders.length === 0}
							className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							title="Announce all preparing orders"
						>
							<span
								className={`material-symbols-outlined ${
									isSpeaking ? 'animate-pulse' : ''
								}`}
							>
								campaign
							</span>
							<span className="text-sm font-medium">
								{isSpeaking ? 'Speaking...' : 'Announce All'}
							</span>
						</button>

						{/* Refresh button */}
						<button
							onClick={() => fetchOrders(false)}
							disabled={refreshing}
							className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
						>
							<span
								className={`material-symbols-outlined ${
									refreshing ? 'animate-spin' : ''
								}`}
							>
								refresh
							</span>
							Refresh
						</button>
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-4 border border-blue-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-blue-400 text-3xl">
								check_circle
							</span>
							<div>
								<p className="text-blue-400 text-sm font-medium">Accepted</p>
								<p className="text-white text-2xl font-bold">
									{orders.reduce(
										(count, order) =>
											count +
											order.items.filter((item) => item.status === ITEM_STATUS.ACCEPTED)
												.length,
										0,
									)}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-orange-500/20 backdrop-blur-md rounded-lg p-4 border border-orange-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-orange-400 text-3xl">
								cooking
							</span>
							<div>
								<p className="text-orange-400 text-sm font-medium">Preparing</p>
								<p className="text-white text-2xl font-bold">
									{orders.reduce(
										(count, order) =>
											count +
											order.items.filter((item) => item.status === ITEM_STATUS.PREPARING)
												.length,
										0,
									)}
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
						{['ACCEPTED', 'PREPARING'].map((status) => (
							<button
								key={status}
								onClick={() => setSelectedStatus(status)}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									selectedStatus === status
										? 'bg-blue-500 text-white'
										: 'bg-white/10 text-gray-300 hover:bg-white/20'
								}`}
							>
								{status}
							</button>
						))}
					</div>
				</div>

				{/* Orders List */}
				{filteredOrders.length === 0 ? (
					<div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-12 text-center">
						<span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
							restaurant
						</span>
						<p className="text-gray-400 text-lg">No orders to display</p>
					</div>
				) : (
					<div className="space-y-4">
						{filteredOrders.map((order) => (
							<div
								key={order.id}
								className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden"
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
										</div>
									</div>

									<span
										className={`material-symbols-outlined text-white transition-transform ${
											expandedOrders.has(order.id) ? 'rotate-180' : ''
										}`}
									>
										expand_more
									</span>
								</div>

								{/* Order Items (Expanded) */}
								{expandedOrders.has(order.id) && (
									<div className="border-t border-white/10 p-4 space-y-3">
										{order.items.map((item) => (
											<div key={item.id} className="bg-white/5 rounded-lg p-4 space-y-3">
												{/* Item Info */}
												<div className="flex items-start justify-between">
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
															Quantity: {item.quantity}
														</p>

														{/* Modifiers */}
														{item.modifiers && item.modifiers.length > 0 && (
															<div className="text-gray-400 text-sm mb-2">
																<strong>Modifiers:</strong>
																<ul className="ml-4 list-disc">
																	{item.modifiers.map((mod, idx) => (
																		<li key={idx}>
																			<span className="text-white font-medium">
																				{mod.modifierGroupName || 'Option'}:
																			</span>{' '}
																			{mod.optionName || mod.name || 'N/A'}
																		</li>
																	))}
																</ul>
															</div>
														)}

														{/* Notes */}
														{item.notes && (
															<p className="text-yellow-400 text-sm">📝 {item.notes}</p>
														)}

														{/* Timer for PREPARING items */}
														{item.status === ITEM_STATUS.PREPARING && (
															<div className="mt-2">{getTimeDisplay(item)}</div>
														)}
													</div>
												</div>

												{/* Action Buttons */}
												<div className="flex gap-2">
													{item.status === ITEM_STATUS.ACCEPTED && (
														<button
															onClick={() =>
																handleUpdateItemStatus(
																	order.id,
																	[item.id],
																	ITEM_STATUS.PREPARING,
																)
															}
															className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
														>
															🔥 Start Cooking
														</button>
													)}

													{item.status === ITEM_STATUS.PREPARING && (
														<button
															onClick={() =>
																handleUpdateItemStatus(
																	order.id,
																	[item.id],
																	ITEM_STATUS.READY,
																)
															}
															className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
														>
															✓ Mark Ready
														</button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</BasePageLayout>
	)
}

export default KitchenManagement
