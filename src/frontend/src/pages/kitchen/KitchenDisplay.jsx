import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '../../contexts/UserContext'
import { useKitchenSocket } from '../../contexts/KitchenSocketContext'
import { useAlert } from '../../contexts/AlertContext'
import TicketCard from '../../components/kitchen/TicketCard'
import KitchenStats from '../../components/kitchen/KitchenStats'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import {
	getKitchenDisplay,
	getKitchenStats,
	startTicket,
	markItemsReady,
	bumpTicket,
	updateTicketPriority,
} from '../../services/api/kitchenAPI'

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
	const { user } = useUser()
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

	const [tickets, setTickets] = useState([])
	const [stats, setStats] = useState(null)
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState('ACTIVE') // ACTIVE, READY, ALL
	const [sortBy, setSortBy] = useState('OLDEST') // OLDEST, NEWEST, PRIORITY
	const [showStats, setShowStats] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [autoRefresh, setAutoRefresh] = useState(true)

	const refreshIntervalRef = useRef(null)
	const lastFetchRef = useRef(0)

	/**
	 * Fetch kitchen display data
	 */
	const fetchKitchenData = useCallback(
		async (silent = false) => {
			if (!user?.tenantId) return

			// Throttle requests (max 1 per 2 seconds)
			const now = Date.now()
			if (now - lastFetchRef.current < 2000) return
			lastFetchRef.current = now

			if (!silent) setLoading(true)

			try {
				const result = await getKitchenDisplay(user.tenantId)

				if (result.success) {
					setTickets(result.data.tickets || [])
				} else {
					showAlert('error', result.message || 'Failed to fetch kitchen data')
				}
			} catch (error) {
				console.error('Error fetching kitchen data:', error)
				showAlert('error', 'Error loading kitchen display')
			} finally {
				if (!silent) setLoading(false)
			}
		},
		[user?.tenantId, showAlert],
	)

	/**
	 * Fetch kitchen statistics
	 */
	const fetchStats = useCallback(async () => {
		if (!user?.tenantId) return

		try {
			const result = await getKitchenStats(user.tenantId)

			if (result.success) {
				setStats(result.data)
			}
		} catch (error) {
			console.error('Error fetching stats:', error)
		}
	}, [user?.tenantId])

	/**
	 * Start ticket (PENDING → IN_PROGRESS)
	 */
	const handleStartTicket = async (ticketId) => {
		try {
			const result = await startTicket(user.tenantId, ticketId, {
				cookId: user.id,
				cookName: user.name || user.email,
			})

			if (result.success) {
				showAlert('success', 'Ticket started! 🍳')
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
		try {
			const result = await markItemsReady(user.tenantId, ticketId, itemIds)

			if (result.success) {
				showAlert('success', 'Items marked ready! ✅')
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
		try {
			const result = await bumpTicket(user.tenantId, ticketId)

			if (result.success) {
				showAlert('success', 'Ticket bumped! 🎯')
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
		try {
			const result = await updateTicketPriority(user.tenantId, ticketId, priority)

			if (result.success) {
				showAlert('success', `Priority updated to ${priority}! ⚡`)
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
	 * Filter and sort tickets
	 */
	const getFilteredTickets = useCallback(() => {
		let filtered = [...tickets]

		// Apply filter
		switch (filter) {
			case 'ACTIVE':
				filtered = filtered.filter(
					(t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS',
				)
				break
			case 'READY':
				filtered = filtered.filter((t) => t.status === 'READY')
				break
			case 'ALL':
				// Show all
				break
			default:
				break
		}

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
	}, [tickets, filter, sortBy])

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
	 * WebSocket event handlers
	 */
	useEffect(() => {
		// New ticket created
		const handleNewTicket = (payload) => {
			console.log('New ticket received:', payload)
			fetchKitchenData(true)
			showAlert('info', `New ticket #${payload.data.ticketNumber} received! 📥`, 3000)
		}

		// Ticket ready
		const handleTicketReady = (payload) => {
			console.log('Ticket ready:', payload)
			fetchKitchenData(true)
		}

		// Ticket completed
		const handleTicketCompleted = (payload) => {
			console.log('Ticket completed:', payload)
			fetchKitchenData(true)
		}

		// Timer updates (update local state only)
		const handleTimerUpdate = (payload) => {
			if (Array.isArray(payload.data)) {
				setTickets((prevTickets) => {
					const updatedTickets = [...prevTickets]
					payload.data.forEach((update) => {
						const idx = updatedTickets.findIndex((t) => t.id === update.ticketId)
						if (idx !== -1) {
							updatedTickets[idx] = {
								...updatedTickets[idx],
								elapsedSeconds: update.elapsedSeconds,
								ageColor: update.ageColor,
							}
						}
					})
					return updatedTickets
				})
			}
		}

		// Register handlers
		on('kitchen.ticket.new', handleNewTicket)
		on('kitchen.ticket.ready', handleTicketReady)
		on('kitchen.ticket.completed', handleTicketCompleted)
		on('kitchen.timers.update', handleTimerUpdate)

		return () => {
			off('kitchen.ticket.new')
			off('kitchen.ticket.ready')
			off('kitchen.ticket.completed')
			off('kitchen.timers.update')
		}
	}, [on, off, fetchKitchenData, showAlert])

	/**
	 * Handle new tickets from WebSocket
	 */
	useEffect(() => {
		if (newTickets && newTickets.length > 0) {
			fetchKitchenData(true)
			clearNewTickets()
		}
	}, [newTickets, clearNewTickets, fetchKitchenData])

	/**
	 * Handle ticket updates from WebSocket
	 */
	useEffect(() => {
		if (ticketUpdates) {
			fetchKitchenData(true)
			clearTicketUpdates()
		}
	}, [ticketUpdates, clearTicketUpdates, fetchKitchenData])

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
			<div className="flex items-center justify-center min-h-screen bg-gray-100">
				<LoadingSpinner />
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
			{/* Header */}
			<div className="bg-white shadow-md sticky top-0 z-10">
				<div className="container mx-auto px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<h1 className="text-2xl font-bold text-gray-800">
								🍳 Kitchen Display System
							</h1>
							<div className="flex items-center gap-2">
								<span
									className={`w-3 h-3 rounded-full ${
										isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
									}`}
								/>
								<span className="text-sm text-gray-600">
									{isConnected ? 'Connected' : 'Disconnected'}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							{/* Filter Buttons */}
							<div className="flex gap-2">
								<button
									onClick={() => setFilter('ACTIVE')}
									className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
										filter === 'ACTIVE'
											? 'bg-blue-600 text-white'
											: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
									}`}
								>
									Active (
									{
										tickets.filter(
											(t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS',
										).length
									}
									)
								</button>
								<button
									onClick={() => setFilter('READY')}
									className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
										filter === 'READY'
											? 'bg-green-600 text-white'
											: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
									}`}
								>
									Ready ({tickets.filter((t) => t.status === 'READY').length})
								</button>
								<button
									onClick={() => setFilter('ALL')}
									className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
										filter === 'ALL'
											? 'bg-purple-600 text-white'
											: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
									}`}
								>
									All ({tickets.length})
								</button>
							</div>

							{/* Sort Dropdown */}
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="px-3 py-1 rounded-lg border border-gray-300 text-sm"
							>
								<option value="OLDEST">Oldest First</option>
								<option value="NEWEST">Newest First</option>
								<option value="PRIORITY">Priority</option>
							</select>

							{/* Stats Toggle */}
							<button
								onClick={() => setShowStats(!showStats)}
								className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
									showStats
										? 'bg-yellow-600 text-white'
										: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
								}`}
							>
								📊 Stats
							</button>

							{/* Fullscreen Toggle */}
							<button
								onClick={toggleFullscreen}
								className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
							>
								{isFullscreen ? '🔲' : '⛶'} Fullscreen
							</button>

							{/* Refresh Button */}
							<button
								onClick={() => fetchKitchenData()}
								className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
							>
								🔄 Refresh
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

				{/* Tickets Grid */}
				{filteredTickets.length === 0 ? (
					<div className="text-center py-20">
						<div className="text-6xl mb-4">😴</div>
						<div className="text-2xl font-semibold text-gray-600">
							No {filter.toLowerCase()} tickets
						</div>
						<div className="text-gray-500 mt-2">
							Kitchen is clear! Ready for new orders.
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
			<div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs text-gray-600">
				<div>Auto-refresh: {autoRefresh ? '✅ ON' : '❌ OFF'}</div>
				<div>Last update: {new Date().toLocaleTimeString()}</div>
			</div>
		</div>
	)
}

export default KitchenDisplay
