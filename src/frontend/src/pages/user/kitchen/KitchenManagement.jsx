import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useUser } from '../../../contexts/UserContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { CardSkeleton } from '../../../components/common/LoadingSpinner'
import socketClient from '../../../services/websocket/socketClient'
import {
	getKitchenDisplay,
	startTicket,
	markItemsReady,
} from '../../../services/api/kitchenAPI'

/**
 * KitchenManagement - Kitchen Display System (KDS)
 *
 * ⚠️ REFACTORED: Now uses Kitchen Service API (tickets) instead of Order Service API
 * This ensures synchronization with KitchenDisplay (CHEF view)
 *
 * Displays tickets that need kitchen attention:
 * - PENDING: Tickets waiting to start cooking (tab: ACCEPTED)
 * - IN_PROGRESS: Tickets currently being cooked (tab: PREPARING)
 *
 * Status Flow:
 * PENDING → IN_PROGRESS → READY → COMPLETED
 *
 * API Flow:
 * - startTicket() → Kitchen Service → Order Service RPC → WebSocket events
 * - markItemsReady() → Kitchen Service → Order Service RPC → WebSocket events
 *
 * This ensures both KitchenManagement and KitchenDisplay stay in sync!
 */

// Ticket Status Constants (matching Kitchen Service)
const TICKET_STATUS = {
	PENDING: 'PENDING',
	IN_PROGRESS: 'IN_PROGRESS',
	READY: 'READY',
	COMPLETED: 'COMPLETED',
	CANCELLED: 'CANCELLED',
}

// Item Status Constants (matching Kitchen Ticket Items)
const ITEM_STATUS = {
	PENDING: 'PENDING',
	PREPARING: 'PREPARING',
	READY: 'READY',
	CANCELLED: 'CANCELLED',
}

const ITEM_STATUS_LABELS = {
	[ITEM_STATUS.PENDING]: 'Pending',
	[ITEM_STATUS.PREPARING]: 'Preparing',
	[ITEM_STATUS.READY]: 'Ready',
	[ITEM_STATUS.CANCELLED]: 'Cancelled',
}

const ITEM_STATUS_COLORS = {
	[ITEM_STATUS.PENDING]: 'bg-blue-500/20 text-blue-300',
	[ITEM_STATUS.PREPARING]: 'bg-orange-500/20 text-orange-300',
	[ITEM_STATUS.READY]: 'bg-green-500/20 text-green-300',
	[ITEM_STATUS.CANCELLED]: 'bg-gray-500/20 text-gray-300',
}

const TICKET_STATUS_COLORS = {
	[TICKET_STATUS.PENDING]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
	[TICKET_STATUS.IN_PROGRESS]: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
	[TICKET_STATUS.READY]: 'bg-green-500/20 text-green-300 border-green-500/30',
	[TICKET_STATUS.COMPLETED]: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
	[TICKET_STATUS.CANCELLED]: 'bg-red-500/20 text-red-300 border-red-500/30',
}

// Priority colors for visual indicators
const PRIORITY_COLORS = {
	NORMAL: 'border-l-gray-500',
	HIGH: 'border-l-yellow-500',
	URGENT: 'border-l-orange-500',
	FIRE: 'border-l-red-500',
}

const KitchenManagement = () => {
	const { user } = useUser()

	// State management - now using tickets instead of orders
	const [loading, setLoading] = useState(true)
	const [tickets, setTickets] = useState([])
	const [filteredTickets, setFilteredTickets] = useState([])
	const [selectedTab, setSelectedTab] = useState('ACCEPTED') // ACCEPTED = PENDING tickets, PREPARING = IN_PROGRESS tickets
	const [searchQuery, setSearchQuery] = useState('')
	const [expandedTickets, setExpandedTickets] = useState(new Set())
	const [isProcessingBatch, setIsProcessingBatch] = useState(false)

	// TTS state management (preserved from original)
	const [isSpeaking] = useState(false)
	const [autoAnnounce, setAutoAnnounce] = useState(true)

	// Auto-refresh interval
	const intervalRef = useRef(null)
	const fetchDebounceRef = useRef(null)
	const isFetchingRef = useRef(false)
	const lastFetchRef = useRef(0)

	/**
	 * Get effective tenantId for current user
	 */
	const getEffectiveTenantId = useCallback(() => {
		return (
			user?.ownerId ||
			user?.userId ||
			user?.tenantId ||
			localStorage.getItem('currentTenantId')
		)
	}, [user?.ownerId, user?.userId, user?.tenantId])

	/**
	 * Fetch kitchen display data (tickets) from Kitchen Service
	 * Uses the same API as KitchenDisplay to ensure synchronization
	 */
	const fetchTickets = useCallback(
		async (showLoader = true) => {
			const tenantId = getEffectiveTenantId()
			if (!tenantId) {
				console.error('❌ [KitchenManagement] No tenantId available')
				return
			}

			// Prevent concurrent fetches
			if (isFetchingRef.current) {
				console.log('⏳ [KitchenManagement] Already fetching, skipping...')
				return
			}

			// Throttle requests (max 1 per 2 seconds)
			const now = Date.now()
			if (now - lastFetchRef.current < 2000) {
				console.log('⏳ [KitchenManagement] Throttled, skipping...')
				return
			}
			lastFetchRef.current = now

			isFetchingRef.current = true
			if (showLoader) setLoading(true)

			try {
				console.log(
					'🔄 [KitchenManagement] Fetching kitchen tickets for tenant:',
					tenantId,
				)

				const response = await getKitchenDisplay(tenantId)

				if (response.success && response.data) {
					// Combine all ticket categories from the display data
					const allTickets = [
						...(response.data.fireTickets || []),
						...(response.data.urgentTickets || []),
						...(response.data.activeTickets || []),
						...(response.data.pendingTickets || []),
						...(response.data.readyTickets || []),
					]

					// Remove duplicates by ticket ID
					const uniqueMap = new Map()
					allTickets.forEach((t) => uniqueMap.set(t.id, t))
					const uniqueTickets = Array.from(uniqueMap.values())

					// Filter only PENDING and IN_PROGRESS tickets (exclude READY, COMPLETED)
					const kitchenTickets = uniqueTickets.filter(
						(t) =>
							t.status === TICKET_STATUS.PENDING ||
							t.status === TICKET_STATUS.IN_PROGRESS,
					)

					console.log(
						'✅ [KitchenManagement] Kitchen tickets fetched:',
						kitchenTickets.length,
					)
					setTickets(kitchenTickets)
				} else {
					console.warn('⚠️ [KitchenManagement] Unexpected response:', response)
					setTickets([])
				}
			} catch (error) {
				console.error('❌ [KitchenManagement] Error fetching tickets:', error)
				setTickets([])
			} finally {
				setLoading(false)
				isFetchingRef.current = false
			}
		},
		[getEffectiveTenantId],
	)

	/**
	 * Debounced fetch - coalesces rapid events into single API call
	 */
	const debouncedFetchTickets = useCallback(() => {
		if (fetchDebounceRef.current) {
			clearTimeout(fetchDebounceRef.current)
		}
		fetchDebounceRef.current = setTimeout(() => {
			fetchTickets(false)
		}, 500)
	}, [fetchTickets])

	// Announce all preparing orders (preserved from original)
	const announceAllPreparingOrders = async () => {
		const preparingTickets = tickets.filter((t) => t.status === TICKET_STATUS.IN_PROGRESS)

		if (preparingTickets.length === 0) {
			alert('No tickets are currently preparing')
			return
		}

		console.log('🔊 Would announce all preparing tickets')
		alert('API call removed - TTS functionality disabled')
	}

	// Initial load
	useEffect(() => {
		fetchTickets()

		// Auto-refresh every 30 seconds (backup for WebSocket)
		intervalRef.current = setInterval(() => {
			fetchTickets(false)
		}, 30000)

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
			if (fetchDebounceRef.current) {
				clearTimeout(fetchDebounceRef.current)
			}
		}
	}, [fetchTickets])

	// WebSocket setup for real-time updates
	useEffect(() => {
		const setupWebSocket = () => {
			const authToken = window.accessToken || localStorage.getItem('authToken')
			const tenantId = getEffectiveTenantId()

			if (!authToken || !tenantId) {
				console.error(
					'❌ [KitchenManagement] No token or tenantId, skipping WebSocket setup',
				)
				return
			}

			// Only connect if not already connected
			if (socketClient.isSocketConnected()) {
				console.log(
					'🔵 [KitchenManagement] WebSocket already connected, reusing connection',
				)
			} else {
				// Connect WebSocket
				socketClient.connect(authToken)
			}

			// Define event handlers - listen to BOTH kitchen and order events
			const handleKitchenTicketNew = (payload) => {
				console.log('🎫 [KitchenManagement] New kitchen ticket - refreshing', payload)
				debouncedFetchTickets()
			}

			const handleKitchenTicketReady = (payload) => {
				console.log('✅ [KitchenManagement] Ticket ready - refreshing', payload)
				debouncedFetchTickets()
			}

			const handleKitchenTicketCompleted = (payload) => {
				console.log('🎉 [KitchenManagement] Ticket completed - refreshing', payload)
				debouncedFetchTickets()
			}

			const handleItemsAccepted = (payload) => {
				console.log(
					'✅ [KitchenManagement] Items accepted (new ticket will be created) - refreshing',
					payload,
				)
				debouncedFetchTickets()
			}

			const handleItemsPreparing = (payload) => {
				console.log('🔥 [KitchenManagement] Items preparing - refreshing', payload)
				debouncedFetchTickets()
			}

			const handleItemsReady = (payload) => {
				console.log('✅ [KitchenManagement] Items ready - refreshing', payload)
				debouncedFetchTickets()
			}

			// Listen for kitchen-specific events (from Kitchen Service)
			socketClient.on('kitchen.ticket.new', handleKitchenTicketNew)
			socketClient.on('kitchen.ticket.ready', handleKitchenTicketReady)
			socketClient.on('kitchen.ticket.completed', handleKitchenTicketCompleted)

			// Also listen to order events (from Order Service)
			socketClient.on('order.items.accepted', handleItemsAccepted)
			socketClient.on('order.items.preparing', handleItemsPreparing)
			socketClient.on('order.items.ready', handleItemsReady)
		}

		const tenantId = getEffectiveTenantId()
		if (tenantId) {
			setupWebSocket()
		} else {
			console.error(
				'❌ [KitchenManagement] User authentication required for real-time updates',
			)
		}

		// Cleanup on unmount
		return () => {
			socketClient.off('kitchen.ticket.new')
			socketClient.off('kitchen.ticket.ready')
			socketClient.off('kitchen.ticket.completed')
			socketClient.off('order.items.accepted')
			socketClient.off('order.items.preparing')
			socketClient.off('order.items.ready')
		}
	}, [getEffectiveTenantId, debouncedFetchTickets])

	// Compute stats from tickets
	const stats = useMemo(() => {
		const pendingCount = tickets.filter((t) => t.status === TICKET_STATUS.PENDING).length
		const inProgressCount = tickets.filter(
			(t) => t.status === TICKET_STATUS.IN_PROGRESS,
		).length
		const pendingItemsCount = tickets
			.filter((t) => t.status === TICKET_STATUS.PENDING)
			.reduce((sum, t) => sum + (t.items?.length || 0), 0)
		const inProgressItemsCount = tickets
			.filter((t) => t.status === TICKET_STATUS.IN_PROGRESS)
			.reduce((sum, t) => sum + (t.items?.length || 0), 0)

		return {
			pendingTickets: pendingCount,
			inProgressTickets: inProgressCount,
			pendingItems: pendingItemsCount,
			inProgressItems: inProgressItemsCount,
		}
	}, [tickets])

	// Filter tickets based on tab and search
	useEffect(() => {
		let filtered = [...tickets]

		// Filter by tab (ACCEPTED = PENDING tickets, PREPARING = IN_PROGRESS tickets)
		if (selectedTab === 'ACCEPTED') {
			filtered = filtered.filter((t) => t.status === TICKET_STATUS.PENDING)
		} else if (selectedTab === 'PREPARING') {
			filtered = filtered.filter((t) => t.status === TICKET_STATUS.IN_PROGRESS)
		}

		// Filter by search query (table name or item name)
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter((ticket) => {
				// Check if table name matches
				if (ticket.tableNumber?.toLowerCase().includes(query)) {
					return true
				}

				// Check if ticket number matches
				if (ticket.ticketNumber?.toString().includes(query)) {
					return true
				}

				// Check if any item name matches
				if (ticket.items?.some((item) => item.name?.toLowerCase().includes(query))) {
					return true
				}

				return false
			})
		}

		// Sort by createdAt (oldest first)
		filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

		setFilteredTickets(filtered)
	}, [tickets, selectedTab, searchQuery])

	/**
	 * Start cooking a ticket - calls Kitchen Service API
	 * This ensures synchronization with KitchenDisplay
	 */
	const handleStartTicket = async (ticketId) => {
		const tenantId = getEffectiveTenantId()
		if (!tenantId) return

		try {
			console.log('🔥 [KitchenManagement] Starting ticket:', ticketId)

			const response = await startTicket(tenantId, ticketId, {
				cookId: user?.userId,
				cookName: user?.username || user?.email,
			})

			if (response.success) {
				console.log('✅ [KitchenManagement] Ticket started successfully')
				// Refresh to get updated data
				await fetchTickets(false)
			} else {
				console.error('❌ [KitchenManagement] Failed to start ticket:', response.message)
				alert(response.message || 'Failed to start ticket')
			}
		} catch (error) {
			console.error('❌ [KitchenManagement] Error starting ticket:', error)
			alert('Failed to start ticket. Please try again.')
		}
	}

	/**
	 * Mark items as ready - calls Kitchen Service API
	 */
	const handleMarkItemsReady = async (ticketId, itemIds) => {
		const tenantId = getEffectiveTenantId()
		if (!tenantId) return

		try {
			console.log('✅ [KitchenManagement] Marking items ready:', { ticketId, itemIds })

			const response = await markItemsReady(tenantId, ticketId, itemIds)

			if (response.success) {
				console.log('✅ [KitchenManagement] Items marked ready successfully')
				await fetchTickets(false)
			} else {
				console.error(
					'❌ [KitchenManagement] Failed to mark items ready:',
					response.message,
				)
				alert(response.message || 'Failed to mark items ready')
			}
		} catch (error) {
			console.error('❌ [KitchenManagement] Error marking items ready:', error)
			alert('Failed to mark items ready. Please try again.')
		}
	}

	/**
	 * Mark all items in a specific ticket as ready
	 */
	const handleMarkTicketReady = async (ticketId) => {
		const ticket = tickets.find((t) => t.id === ticketId)
		if (!ticket) return

		const preparingItems =
			ticket.items?.filter((i) => i.status === ITEM_STATUS.PREPARING) || []
		if (preparingItems.length === 0) {
			alert('No preparing items to mark as ready')
			return
		}

		const itemIds = preparingItems.map((i) => i.id)
		await handleMarkItemsReady(ticketId, itemIds)
	}

	/**
	 * Mark all PREPARING items as READY (all tickets)
	 */
	const handleMarkAllReady = async () => {
		const preparingTickets = filteredTickets.filter(
			(t) => t.status === TICKET_STATUS.IN_PROGRESS,
		)

		if (preparingTickets.length === 0) {
			alert('No preparing tickets to mark as ready')
			return
		}

		setIsProcessingBatch(true)

		try {
			console.log('✅ [KitchenManagement] Marking all preparing items as READY')

			// Process each ticket
			for (const ticket of preparingTickets) {
				const preparingItems =
					ticket.items?.filter((i) => i.status === ITEM_STATUS.PREPARING) || []
				if (preparingItems.length > 0) {
					const itemIds = preparingItems.map((i) => i.id)
					await handleMarkItemsReady(ticket.id, itemIds)
				}
			}

			console.log('✅ All items marked as READY')
		} catch (error) {
			console.error('❌ Error marking items as ready:', error)
			alert('Failed to mark items as ready. Please try again.')
		} finally {
			setIsProcessingBatch(false)
		}
	}

	// Toggle ticket expansion
	const toggleTicketExpansion = (ticketId) => {
		setExpandedTickets((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(ticketId)) {
				newSet.delete(ticketId)
			} else {
				newSet.add(ticketId)
			}
			return newSet
		})
	}

	// Calculate elapsed time since ticket started
	const calculateElapsedTime = (startedAt) => {
		if (!startedAt) return null
		const start = new Date(startedAt)
		const now = new Date()
		const diffMs = now - start
		const diffMins = Math.floor(diffMs / 60000)
		return diffMins
	}

	// Get time display for ticket/item
	const getTimeDisplay = (ticket) => {
		if (ticket.status !== TICKET_STATUS.IN_PROGRESS) return null

		const startTime = ticket.startedAt || ticket.createdAt
		const elapsed = calculateElapsedTime(startTime)
		if (elapsed === null) return null

		const estimatedTime = ticket.estimatedTime || 15 // Default 15 minutes

		if (elapsed <= estimatedTime) {
			return (
				<span className="text-orange-400 font-medium">
					⏱️ {elapsed} mins ({estimatedTime - elapsed} mins remaining)
				</span>
			)
		} else {
			return (
				<span className="text-red-400 font-medium animate-pulse">
					⚠️ Overdue by {elapsed - estimatedTime} mins
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
						<p className="text-gray-400">
							Manage incoming tickets and cooking status
							<span className="ml-2 text-xs text-blue-400">
								(Synced with CHEF Display)
							</span>
						</p>
					</div>
					<div className="flex items-center gap-2">
						{/* Test TTS button */}
						<button
							onClick={() => {
								console.log('🔊 Test TTS clicked (API removed)')
								alert('TTS API removed - functionality disabled')
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
							disabled={isSpeaking || tickets.length === 0}
							className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							title="Announce all preparing tickets"
						>
							<span
								className={`material-symbols-outlined ${isSpeaking ? 'animate-pulse' : ''}`}
							>
								campaign
							</span>
							<span className="text-sm font-medium">
								{isSpeaking ? 'Speaking...' : 'Announce All'}
							</span>
						</button>

						{/* Refresh button */}
						<button
							onClick={() => fetchTickets()}
							className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors"
							title="Refresh tickets"
						>
							<span className="material-symbols-outlined">refresh</span>
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
								<p className="text-blue-400 text-sm font-medium">Accepted (Pending)</p>
								<p className="text-white text-2xl font-bold">
									{stats.pendingTickets} tickets ({stats.pendingItems} items)
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
									{stats.inProgressTickets} tickets ({stats.inProgressItems} items)
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
								placeholder="Search by table, ticket number, or item name..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<div className="flex gap-2">
						{['ACCEPTED', 'PREPARING'].map((tab) => (
							<button
								key={tab}
								onClick={() => setSelectedTab(tab)}
								className={`px-4 py-2 rounded-lg font-medium transition-colors ${
									selectedTab === tab
										? 'bg-blue-500 text-white'
										: 'bg-white/10 text-gray-300 hover:bg-white/20'
								}`}
							>
								{tab === 'ACCEPTED'
									? `Accepted (${stats.pendingTickets})`
									: `Preparing (${stats.inProgressTickets})`}
							</button>
						))}
					</div>
				</div>

				{/* Tickets List */}
				{filteredTickets.length === 0 ? (
					<div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-12 text-center">
						<span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
							restaurant
						</span>
						<p className="text-gray-400 text-lg">No tickets to display</p>
						<p className="text-gray-500 text-sm mt-2">
							{selectedTab === 'ACCEPTED'
								? 'No pending tickets waiting to be cooked'
								: 'No tickets currently being prepared'}
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{/* Mark All Ready button - only show on PREPARING tab */}
						{selectedTab === 'PREPARING' && (
							<div className="flex justify-end">
								<button
									onClick={handleMarkAllReady}
									disabled={isProcessingBatch}
									className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
								>
									{isProcessingBatch ? (
										<span className="material-symbols-outlined animate-spin text-sm">
											progress_activity
										</span>
									) : (
										<span className="material-symbols-outlined text-sm">done_all</span>
									)}
									Mark All Ready
								</button>
							</div>
						)}

						{filteredTickets.map((ticket) => (
							<div
								key={ticket.id}
								className={`bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden border-l-4 ${
									PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.NORMAL
								}`}
							>
								{/* Ticket Header */}
								<div className="p-4 border-b border-white/10">
									<div
										className="flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors py-2 px-2 rounded-lg"
										onClick={() => toggleTicketExpansion(ticket.id)}
									>
										<div className="flex items-center gap-4">
											<span className="material-symbols-outlined text-blue-400 text-3xl">
												table_restaurant
											</span>
											<div>
												<h3 className="text-white text-lg font-semibold">
													{ticket.snapshotTableName || ticket.tableNumber || 'Table'}
													{ticket.snapshotFloorName && (
														<span className="ml-2 text-sm font-normal text-blue-400">
															({ticket.snapshotFloorName})
														</span>
													)}
													<span className="ml-2 text-sm font-normal text-gray-400">
														Ticket #{ticket.ticketNumber}
													</span>
												</h3>
												<p className="text-gray-400 text-sm">
													{ticket.items?.length || 0} item(s) • Order #
													{ticket.orderId?.slice(0, 8)}
												</p>
												{ticket.status === TICKET_STATUS.IN_PROGRESS && (
													<div className="mt-1">{getTimeDisplay(ticket)}</div>
												)}
											</div>
										</div>

										<div className="flex items-center gap-3">
											{/* Ticket Status Badge */}
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
													TICKET_STATUS_COLORS[ticket.status]
												}`}
											>
												{ticket.status}
											</span>

											{/* Priority Badge */}
											{ticket.priority && ticket.priority !== 'NORMAL' && (
												<span
													className={`px-2 py-1 rounded text-xs font-bold ${
														ticket.priority === 'FIRE'
															? 'bg-red-500 text-white animate-pulse'
															: ticket.priority === 'URGENT'
																? 'bg-orange-500 text-white'
																: 'bg-yellow-500 text-black'
													}`}
												>
													{ticket.priority}
												</span>
											)}

											{/* Start All button for PENDING tickets */}
											{ticket.status === TICKET_STATUS.PENDING && (
												<button
													onClick={(e) => {
														e.stopPropagation()
														handleStartTicket(ticket.id)
													}}
													className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
												>
													🔥 Start All
												</button>
											)}

											{/* Mark Ready button for IN_PROGRESS tickets */}
											{ticket.status === TICKET_STATUS.IN_PROGRESS && (
												<button
													onClick={(e) => {
														e.stopPropagation()
														handleMarkTicketReady(ticket.id)
													}}
													className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
												>
													✓ Mark Ready
												</button>
											)}

											<span
												className={`material-symbols-outlined text-white transition-transform ${
													expandedTickets.has(ticket.id) ? 'rotate-180' : ''
												}`}
											>
												expand_more
											</span>
										</div>
									</div>
								</div>

								{/* Ticket Items (Expanded) */}
								{expandedTickets.has(ticket.id) && (
									<div className="p-4 space-y-3">
										{ticket.items?.map((item) => (
											<div key={item.id} className="bg-white/5 rounded-lg p-4">
												{/* Item Info */}
												<div className="flex items-start gap-3">
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
																				{mod.modifierGroupName ||
																					mod.groupName ||
																					'Option'}
																				:
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
													</div>
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
