import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useUser } from '../../contexts/UserContext'
import { useKitchenSocket } from '../../contexts/KitchenSocketContext'
import { useAlert } from '../../contexts/AlertContext'
import TicketCard from '../../components/kitchen/TicketCard'
import KitchenStats from '../../components/kitchen/KitchenStats'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import BackgroundImage from '../../components/common/BackgroundImage'
import {
	getKitchenDisplay,
	getKitchenStats,
	startTicket,
	markItemsReady,
	bumpTicket,
	updateTicketPriority,
} from '../../services/api/kitchenAPI'

/**
 * LUỒNG HOẠT ĐỘNG KITCHEN DISPLAY SYSTEM:
 *
 * 1. Waiter ACCEPT items → Order Service emit `order.items.accepted`
 *    → Kitchen Service tạo Ticket với status PENDING
 *    → Kitchen Service emit `kitchen.ticket.new`
 *    → Frontend nhận event → refresh display
 *
 * 2. Kitchen click "Start Cooking" → API startTicket()
 *    → Kitchen Service gọi Order Service RPC (items → PREPARING)
 *    → Order Service emit `order.items.preparing` (Waiter/Customer nhận)
 *    → Kitchen Service cập nhật ticket status → IN_PROGRESS
 *    → Frontend refresh display
 *
 * 3. Kitchen click "Mark Ready" → API markItemsReady()
 *    → Kitchen Service gọi Order Service RPC (items → READY)
 *    → Order Service emit `order.items.ready` (Waiter/Customer nhận)
 *    → Kitchen Service cập nhật ticket status → READY (nếu tất cả items ready)
 *    → Kitchen Service emit `kitchen.ticket.ready`
 *    → Frontend refresh display
 *
 * 4. Kitchen click "BUMP" → API bumpTicket()
 *    → Kitchen Service cập nhật ticket status → COMPLETED
 *    → Kitchen Service emit `kitchen.ticket.completed`
 *    → Frontend refresh display (ticket biến mất khỏi active)
 *
 * TICKET STATUS: PENDING → IN_PROGRESS → READY → COMPLETED
 * ITEM STATUS: PENDING → PREPARING → READY
 */

/**
 * Kitchen Display System (KDS) Component
 *
 * Modern Kitchen Display System for restaurant kitchen staff
 *
 * Features:
 * - Real-time ticket updates via WebSocket
 * - Color-coded tickets by age (green → yellow → red)
 * - Priority management (NORMAL → HIGH → URGENT → FIRE)
 * - Timer tracking with visual indicators
 * - Touch-friendly interface with large buttons
 * - Grid layout optimized for kitchen monitors
 * - Sound alerts for new tickets
 * - Bump screen workflow
 * - Statistics dashboard
 *
 * Inspired by: Toast POS, Square KDS, Oracle MICROS
 */
const KitchenDisplay = () => {
	const { user, logout } = useUser()
	const { showAlert } = useAlert()
	const {
		isConnected,
		on,
		off,
		newTickets,
		ticketUpdates,
		timerUpdates,
		clearNewTickets,
		clearTicketUpdates,
	} = useKitchenSocket()

	// State for tickets organized by category (matching API response)
	const [displayData, setDisplayData] = useState({
		fireTickets: [],
		urgentTickets: [],
		activeTickets: [],
		pendingTickets: [],
		readyTickets: [],
		summary: {
			totalActive: 0,
			totalPending: 0,
			totalReady: 0,
			oldestTicketAge: 0,
			averageAge: 0,
		},
	})
	const [stats, setStats] = useState(null)
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState('ACCEPTED') // ACCEPTED, COOKING, BUMP
	const [sortBy, setSortBy] = useState('OLDEST') // OLDEST, NEWEST, PRIORITY
	const [showStats, setShowStats] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [autoRefresh, setAutoRefresh] = useState(true)
	const [lastUpdateTime, setLastUpdateTime] = useState(new Date())

	// Debounce refs to prevent "too many requests" error
	const fetchDebounceRef = useRef(null)
	const isFetchingRef = useRef(false)
	const refreshIntervalRef = useRef(null)
	const lastFetchRef = useRef(0)

	/**
	 * Get effective tenantId for current user
	 * CHEF role uses ownerId (restaurant owner's ID), User/ADMIN uses tenantId
	 */
	const getEffectiveTenantId = useCallback(() => {
		return user?.ownerId || user?.tenantId || localStorage.getItem('currentTenantId')
	}, [user?.ownerId, user?.tenantId])

	/**
	 * Fetch kitchen display data with deduplication
	 * API returns: { fireTickets, urgentTickets, activeTickets, pendingTickets, readyTickets, summary }
	 */
	const fetchKitchenData = useCallback(
		async (silent = false) => {
			const tenantId = getEffectiveTenantId()
			if (!tenantId) {
				console.warn('⚠️ [KitchenDisplay] No tenantId found, skipping fetch')
				if (!silent) setLoading(false)
				return
			}

			// Prevent concurrent fetches
			if (isFetchingRef.current) {
				console.log('⏳ [KitchenDisplay] Fetch already in progress, skipping')
				return
			}

			// Throttle requests (max 1 per 2 seconds)
			const now = Date.now()
			if (now - lastFetchRef.current < 2000) {
				console.log('⏳ [KitchenDisplay] Throttled, too soon since last fetch')
				return
			}
			lastFetchRef.current = now

			isFetchingRef.current = true
			if (!silent) setLoading(true)

			try {
				const result = await getKitchenDisplay(tenantId)

				if (result.success && result.data) {
					// Store full display data structure
					setDisplayData({
						fireTickets: result.data.fireTickets || [],
						urgentTickets: result.data.urgentTickets || [],
						activeTickets: result.data.activeTickets || [],
						pendingTickets: result.data.pendingTickets || [],
						readyTickets: result.data.readyTickets || [],
						summary: result.data.summary || {
							totalActive: 0,
							totalPending: 0,
							totalReady: 0,
							oldestTicketAge: 0,
							averageAge: 0,
						},
					})
					setLastUpdateTime(new Date())
					console.log('✅ [KitchenDisplay] Data loaded:', {
						fire: result.data.fireTickets?.length || 0,
						urgent: result.data.urgentTickets?.length || 0,
						active: result.data.activeTickets?.length || 0,
						pending: result.data.pendingTickets?.length || 0,
						ready: result.data.readyTickets?.length || 0,
					})
				} else {
					console.warn('⚠️ [KitchenDisplay] Failed:', result.message)
					if (!silent) {
						showAlert('error', result.message || 'Failed to fetch kitchen data')
					}
				}
			} catch (error) {
				console.error('❌ [KitchenDisplay] Error fetching:', error)
				if (!silent) {
					showAlert('error', 'Error loading kitchen display')
				}
			} finally {
				isFetchingRef.current = false
				if (!silent) setLoading(false)
			}
		},
		[getEffectiveTenantId, showAlert],
	)

	/**
	 * Debounced fetch - coalesces rapid events into single API call
	 */
	const debouncedFetchKitchenData = useCallback(() => {
		if (fetchDebounceRef.current) {
			clearTimeout(fetchDebounceRef.current)
		}
		fetchDebounceRef.current = setTimeout(() => {
			fetchKitchenData(true) // silent refresh
		}, 500) // 500ms debounce
	}, [fetchKitchenData])

	/**
	 * Fetch kitchen statistics
	 */
	const fetchStats = useCallback(async () => {
		const tenantId = getEffectiveTenantId()
		if (!tenantId) return

		try {
			const result = await getKitchenStats(tenantId)

			if (result.success) {
				setStats(result.data)
			}
		} catch (error) {
			console.error('Error fetching stats:', error)
		}
	}, [getEffectiveTenantId])

	/**
	 * Start ticket (PENDING → IN_PROGRESS)
	 */
	const handleStartTicket = async (ticketId) => {
		const tenantId = getEffectiveTenantId()
		if (!tenantId) return

		try {
			const result = await startTicket(tenantId, ticketId, {
				cookId: user.id,
				cookName: user.name || user.email,
			})

			if (result.success) {
				showAlert('success', 'Ticket started!')
				fetchKitchenData(true) // Silent refresh
			} else {
				showAlert('error', result.message || 'Failed to start ticket')
			}
		} catch (error) {
			console.error('Error starting ticket:', error)
			showAlert('error', 'Error starting ticket')
		}
	}

	/**
	 * Mark items ready
	 */
	const handleMarkReady = async (ticketId, itemIds) => {
		const tenantId = getEffectiveTenantId()
		if (!tenantId) return

		try {
			const result = await markItemsReady(tenantId, ticketId, itemIds)

			if (result.success) {
				showAlert('success', 'Items marked ready!')
				fetchKitchenData(true)
			} else {
				showAlert('error', result.message || 'Failed to mark items ready')
			}
		} catch (error) {
			console.error('Error marking items ready:', error)
			showAlert('error', 'Error marking items ready')
		}
	}

	/**
	 * Bump ticket (complete)
	 */
	const handleBumpTicket = async (ticketId) => {
		const tenantId = getEffectiveTenantId()
		if (!tenantId) return

		try {
			const result = await bumpTicket(tenantId, ticketId)

			if (result.success) {
				showAlert('success', 'Ticket bumped!')
				fetchKitchenData(true)
				fetchStats() // Update stats
			} else {
				showAlert('error', result.message || 'Failed to bump ticket')
			}
		} catch (error) {
			console.error('Error bumping ticket:', error)
			showAlert('error', 'Error bumping ticket')
		}
	}

	/**
	 * Update ticket priority
	 */
	const handlePriorityChange = async (ticketId, priority) => {
		const tenantId = getEffectiveTenantId()
		if (!tenantId) return

		try {
			const result = await updateTicketPriority(tenantId, ticketId, priority)

			if (result.success) {
				showAlert('success', `Priority updated to ${priority}!`)
				fetchKitchenData(true)
			} else {
				showAlert('error', result.message || 'Failed to update priority')
			}
		} catch (error) {
			console.error('Error updating priority:', error)
			showAlert('error', 'Error updating priority')
		}
	}

	/**
	 * Get all tickets combined from display data categories
	 * Memoized to avoid recalculating on every render
	 */
	const allTickets = useMemo(() => {
		const combined = [
			...displayData.fireTickets,
			...displayData.urgentTickets,
			...displayData.activeTickets,
			...displayData.pendingTickets,
			...displayData.readyTickets,
		]
		// Remove duplicates by ticket ID (in case same ticket appears in multiple categories)
		const uniqueMap = new Map()
		combined.forEach((t) => uniqueMap.set(t.id, t))
		return Array.from(uniqueMap.values())
	}, [displayData])

	/**
	 * Filter and sort tickets based on current filter and sort settings
	 * Uses the categorized display data for efficient filtering
	 *
	 * Tabs:
	 * - ACCEPTED: PENDING tickets (waiting to start cooking) - includes fire/urgent pending
	 * - COOKING: IN_PROGRESS tickets (currently being cooked) - includes fire/urgent cooking
	 * - BUMP: READY tickets (waiting to be bumped/completed)
	 */
	const getFilteredTickets = useCallback(() => {
		let filtered = []

		// Apply filter - use pre-categorized data from API for efficiency
		switch (filter) {
			case 'ACCEPTED':
				// ACCEPTED = PENDING tickets (waiting to start cooking)
				// pendingTickets from API are status=PENDING
				// Also include fire/urgent tickets that are PENDING
				filtered = [
					...displayData.fireTickets.filter((t) => t.status === 'PENDING'),
					...displayData.urgentTickets.filter((t) => t.status === 'PENDING'),
					...displayData.pendingTickets,
				]
				break
			case 'COOKING':
				// COOKING = IN_PROGRESS tickets (currently cooking)
				// activeTickets from API are status=IN_PROGRESS
				// Also include fire/urgent tickets that are IN_PROGRESS
				filtered = [
					...displayData.fireTickets.filter((t) => t.status === 'IN_PROGRESS'),
					...displayData.urgentTickets.filter((t) => t.status === 'IN_PROGRESS'),
					...displayData.activeTickets,
				]
				break
			case 'BUMP':
				// BUMP = READY tickets (waiting to be bumped)
				filtered = [...displayData.readyTickets]
				break
			default:
				filtered = [...displayData.pendingTickets]
				break
		}

		// Remove duplicates (in case same ticket in multiple priority categories)
		const uniqueMap = new Map()
		filtered.forEach((t) => uniqueMap.set(t.id, t))
		filtered = Array.from(uniqueMap.values())

		// Apply sort
		switch (sortBy) {
			case 'OLDEST':
				filtered.sort((a, b) => (b.elapsedSeconds || 0) - (a.elapsedSeconds || 0))
				break
			case 'NEWEST':
				filtered.sort((a, b) => (a.elapsedSeconds || 0) - (b.elapsedSeconds || 0))
				break
			case 'PRIORITY':
				const priorityOrder = { FIRE: 4, URGENT: 3, HIGH: 2, NORMAL: 1 }
				filtered.sort((a, b) => {
					const aPriority = priorityOrder[a.priority] || 1
					const bPriority = priorityOrder[b.priority] || 1
					return bPriority - aPriority
				})
				break
			default:
				break
		}

		return filtered
	}, [displayData, allTickets, filter, sortBy])

	/**
	 * Toggle fullscreen
	 */
	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen()
			setIsFullscreen(true)
		} else {
			document.exitFullscreen()
			setIsFullscreen(false)
		}
	}

	/**
	 * Handle logout
	 */
	const handleLogout = async () => {
		try {
			await logout()
			showAlert('success', 'Logged out successfully!')
			// Redirect to login page
			window.location.href = '/login'
		} catch (error) {
			console.error('Logout error:', error)
			showAlert('error', 'Logout failed')
		}
	}

	/**
	 * WebSocket event handlers for real-time updates
	 *
	 * Kitchen-specific events:
	 * - kitchen.ticket.new: New ticket created when waiter accepts items
	 * - kitchen.ticket.ready: All items in ticket marked ready
	 * - kitchen.ticket.completed: Ticket bumped/completed
	 * - kitchen.ticket.priority: Priority changed
	 * - kitchen.timers.update: Timer updates (every 5 seconds)
	 *
	 * Order events (from Order Service, also useful for Kitchen):
	 * - order.items.accepted: Waiter accepted items → new ticket will be created
	 * - order.items.preparing: Items started preparing (confirmation)
	 * - order.items.ready: Items marked ready (confirmation)
	 */
	useEffect(() => {
		// New ticket created (when waiter accepts items → Kitchen Service creates ticket)
		const handleNewTicket = (payload) => {
			console.log('🎫 [Kitchen] New ticket received:', payload)
			debouncedFetchKitchenData()
			const ticketNumber =
				payload?.data?.ticketNumber || payload?.ticket?.ticketNumber || 'Unknown'
			showAlert('info', `New ticket ${ticketNumber} received!`, 3000)
		}

		// Ticket ready (all items in ticket are ready)
		const handleTicketReady = (payload) => {
			console.log('✅ [Kitchen] Ticket ready:', payload)
			debouncedFetchKitchenData()
			const ticketNumber =
				payload?.data?.ticketNumber || payload?.ticket?.ticketNumber || ''
			showAlert('success', `Ticket ${ticketNumber} is ready!`, 3000)
		}

		// Ticket completed (bumped)
		const handleTicketCompleted = (payload) => {
			console.log('🎯 [Kitchen] Ticket completed:', payload)
			debouncedFetchKitchenData()
			const ticketNumber = payload?.data?.ticketNumber || payload?.ticketNumber || ''
			showAlert('success', `Ticket ${ticketNumber} bumped!`, 2000)
		}

		// Priority changed
		const handlePriorityChange = (payload) => {
			console.log('⚡ [Kitchen] Priority changed:', payload)
			debouncedFetchKitchenData()
		}

		// Timer updates - update local state efficiently without full API refresh
		const handleTimerUpdate = (payload) => {
			const updates = payload?.data?.tickets || payload?.data || payload?.tickets
			if (Array.isArray(updates) && updates.length > 0) {
				setDisplayData((prevData) => {
					// Create a map of updates for quick lookup
					const updateMap = new Map()
					updates.forEach((update) => {
						const id = update.id || update.ticketId
						if (id) {
							updateMap.set(id, {
								elapsedSeconds: update.elapsedSeconds,
								elapsedFormatted: update.elapsedFormatted,
								ageColor: update.ageColor,
							})
						}
					})

					// Helper to update tickets in a category
					const updateCategory = (tickets) =>
						tickets.map((t) => {
							const update = updateMap.get(t.id)
							if (update) {
								return { ...t, ...update }
							}
							return t
						})

					return {
						...prevData,
						fireTickets: updateCategory(prevData.fireTickets),
						urgentTickets: updateCategory(prevData.urgentTickets),
						activeTickets: updateCategory(prevData.activeTickets),
						pendingTickets: updateCategory(prevData.pendingTickets),
						readyTickets: updateCategory(prevData.readyTickets),
					}
				})
			}
		}

		// Order events - when waiter accepts items, kitchen ticket is created
		const handleOrderItemsAccepted = (payload) => {
			console.log('📥 [Kitchen] Order items accepted by waiter:', payload)
			// Kitchen Service will create a ticket and emit kitchen.ticket.new
			// But we can also refresh here for faster updates
			debouncedFetchKitchenData()
		}

		// Order items preparing - confirmation that items started cooking
		const handleOrderItemsPreparing = (payload) => {
			console.log('🍳 [Kitchen] Order items preparing:', payload)
			debouncedFetchKitchenData()
		}

		// Order items ready - confirmation that items are ready
		const handleOrderItemsReady = (payload) => {
			console.log('✅ [Kitchen] Order items ready:', payload)
			debouncedFetchKitchenData()
		}

		// Register Kitchen-specific event handlers
		on('kitchen.ticket.new', handleNewTicket)
		on('kitchen.ticket.ready', handleTicketReady)
		on('kitchen.ticket.completed', handleTicketCompleted)
		on('kitchen.ticket.priority', handlePriorityChange)
		on('kitchen.timers.update', handleTimerUpdate)

		// Also listen to Order events for real-time sync
		on('order.items.accepted', handleOrderItemsAccepted)
		on('order.items.preparing', handleOrderItemsPreparing)
		on('order.items.ready', handleOrderItemsReady)

		return () => {
			// Clear debounce timer
			if (fetchDebounceRef.current) {
				clearTimeout(fetchDebounceRef.current)
			}
			// Unregister Kitchen events
			off('kitchen.ticket.new')
			off('kitchen.ticket.ready')
			off('kitchen.ticket.completed')
			off('kitchen.ticket.priority')
			off('kitchen.timers.update')
			// Unregister Order events
			off('order.items.accepted')
			off('order.items.preparing')
			off('order.items.ready')
		}
	}, [on, off, debouncedFetchKitchenData, showAlert])

	/**
	 * Handle new tickets from WebSocket
	 */
	useEffect(() => {
		if (newTickets && newTickets.length > 0) {
			debouncedFetchKitchenData()
			clearNewTickets()
		}
	}, [newTickets, clearNewTickets, debouncedFetchKitchenData])

	/**
	 * Handle ticket updates from WebSocket
	 */
	useEffect(() => {
		if (ticketUpdates) {
			debouncedFetchKitchenData()
			clearTicketUpdates()
		}
	}, [ticketUpdates, clearTicketUpdates, debouncedFetchKitchenData])

	/**
	 * Auto-refresh every 30 seconds
	 */
	useEffect(() => {
		if (autoRefresh) {
			refreshIntervalRef.current = setInterval(() => {
				fetchKitchenData(true) // Silent refresh
			}, 30000)
		}

		return () => {
			if (refreshIntervalRef.current) {
				clearInterval(refreshIntervalRef.current)
			}
		}
	}, [autoRefresh, fetchKitchenData])

	/**
	 * Initial load
	 */
	useEffect(() => {
		fetchKitchenData()
		fetchStats()
	}, [fetchKitchenData, fetchStats])

	const filteredTickets = getFilteredTickets()

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen relative">
				<BackgroundImage overlayOpacity={75} fixed={true} />
				<LoadingSpinner />
			</div>
		)
	}

	return (
		<div className="min-h-screen relative">
			{/* Background image with dark overlay - giống các trang khác */}
			<BackgroundImage overlayOpacity={75} fixed={true} />

			{/* Header */}
			<div className="bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
				<div className="container mx-auto px-4 py-3">
					{/* Mobile Header */}
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div className="flex items-center gap-4">
							<h1 className="text-xl md:text-2xl font-bold text-white">
								Kitchen Display
							</h1>
							<div className="flex items-center gap-2">
								<span
									className={`w-3 h-3 rounded-full ${
										isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
									}`}
								/>
								<span className="text-sm text-gray-400">
									{isConnected ? 'Live' : 'Offline'}
								</span>
							</div>
							{/* User info */}
							<div className="flex items-center gap-2 ml-auto lg:ml-0">
								<span className="text-sm text-gray-400">
									{user?.username || user?.email || 'Chef'}
								</span>
								<button
									onClick={handleLogout}
									className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs font-medium transition-colors"
									title="Logout"
								>
									🚪 Logout
								</button>
							</div>
						</div>

						{/* Controls - scrollable on mobile */}
						<div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
							{/* Filter Buttons - ACCEPTED, COOKING, BUMP */}
							<div className="flex gap-2 flex-shrink-0">
								<button
									onClick={() => setFilter('ACCEPTED')}
									className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
										filter === 'ACCEPTED'
											? 'bg-blue-500 text-white'
											: 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
									}`}
								>
									Accepted (
									{displayData.pendingTickets.length +
										displayData.fireTickets.filter((t) => t.status === 'PENDING').length +
										displayData.urgentTickets.filter((t) => t.status === 'PENDING')
											.length}
									)
								</button>
								<button
									onClick={() => setFilter('COOKING')}
									className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
										filter === 'COOKING'
											? 'bg-orange-500 text-white'
											: 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
									}`}
								>
									Cooking (
									{displayData.activeTickets.length +
										displayData.fireTickets.filter((t) => t.status === 'IN_PROGRESS')
											.length +
										displayData.urgentTickets.filter((t) => t.status === 'IN_PROGRESS')
											.length}
									)
								</button>
								<button
									onClick={() => setFilter('BUMP')}
									className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
										filter === 'BUMP'
											? 'bg-green-500 text-white'
											: 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
									}`}
								>
									Bump ({displayData.readyTickets.length})
								</button>
							</div>

							{/* Sort Dropdown */}
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm flex-shrink-0"
							>
								<option value="OLDEST" className="bg-slate-800">
									Oldest First
								</option>
								<option value="NEWEST" className="bg-slate-800">
									Newest First
								</option>
								<option value="PRIORITY" className="bg-slate-800">
									Priority
								</option>
							</select>

							{/* Stats Toggle */}
							<button
								onClick={() => setShowStats(!showStats)}
								className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
									showStats
										? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
										: 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
								}`}
							>
								Stats
							</button>

							{/* Fullscreen Toggle */}
							<button
								onClick={toggleFullscreen}
								className="px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 text-sm flex-shrink-0"
							>
								{isFullscreen ? 'Exit' : 'Fullscreen'}
							</button>

							{/* Refresh Button */}
							<button
								onClick={() => fetchKitchenData()}
								className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm flex-shrink-0"
							>
								Refresh
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-6">
				{/* Statistics Panel (Collapsible) */}
				{showStats && (
					<div className="mb-6">
						<KitchenStats stats={stats} />
					</div>
				)}

				{/* Summary Stats Bar */}
				<div className="grid grid-cols-3 gap-3 mb-6">
					<div className="bg-blue-500/10 backdrop-blur-md rounded-lg p-3 border border-blue-500/20">
						<div className="flex items-center gap-2">
							<div>
								<p className="text-blue-400 text-xs font-medium">Cooking</p>
								<p className="text-white text-xl font-bold">
									{displayData.activeTickets.length}
								</p>
							</div>
						</div>
					</div>
					<div className="bg-yellow-500/10 backdrop-blur-md rounded-lg p-3 border border-yellow-500/20">
						<div className="flex items-center gap-2">
							<div>
								<p className="text-yellow-400 text-xs font-medium">Pending</p>
								<p className="text-white text-xl font-bold">
									{displayData.pendingTickets.length}
								</p>
							</div>
						</div>
					</div>
					<div className="bg-green-500/10 backdrop-blur-md rounded-lg p-3 border border-green-500/20">
						<div className="flex items-center gap-2">
							<div>
								<p className="text-green-400 text-xs font-medium">Ready</p>
								<p className="text-white text-xl font-bold">
									{displayData.readyTickets.length}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Tickets Grid - Max 3 per row */}
				{filteredTickets.length === 0 ? (
					<div className="bg-white/3 backdrop-blur-md rounded-lg border border-white/5 p-12 text-center">
						<div className="text-2xl font-semibold text-white">
							No {filter.toLowerCase()} tickets
						</div>
						<div className="text-gray-400 mt-2">
							Kitchen is clear! Ready for new orders.
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredTickets.map((ticket) => (
							<TicketCard
								key={ticket.id}
								ticket={ticket}
								onStart={handleStartTicket}
								onMarkReady={(itemIds) => handleMarkReady(ticket.id, itemIds)}
								onBump={handleBumpTicket}
								onPriorityChange={handlePriorityChange}
							/>
						))}
					</div>
				)}
			</div>

			{/* Footer Info */}
			<div className="fixed bottom-4 right-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-3 text-xs text-gray-400">
				<div className="flex items-center gap-2">
					<span
						className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-500'}`}
					/>
					<span>Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
				</div>
				<div className="mt-1 text-gray-500">
					Updated: {lastUpdateTime.toLocaleTimeString()}
				</div>
			</div>
		</div>
	)
}

export default KitchenDisplay
