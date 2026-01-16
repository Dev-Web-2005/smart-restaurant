import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { useAlert } from '../../contexts/AlertContext'
import { useKitchenSocket } from '../../contexts/KitchenSocketContext'
import {
	getKitchenDisplay,
	getKitchenStats,
	startTicket,
	markItemsReady,
	bumpTicket,
	updateTicketPriority,
	cancelTicket,
	recallItems,
} from '../../services/api/kitchenAPI'
import TicketCard from './components/TicketCard'
import KitchenStats from './components/KitchenStats'
import { Filter, Volume2, VolumeX, RefreshCw, Settings, LogOut } from 'lucide-react'

/**
 * Kitchen Display System (KDS)
 *
 * Professional KDS inspired by Toast POS, Square KDS, Oracle MICROS
 *
 * Features:
 * - Real-time WebSocket updates
 * - Color-coded timer tracking (green → yellow → red)
 * - Priority management (FIRE, URGENT, HIGH, NORMAL)
 * - Touch-friendly large buttons
 * - Sound alerts for new tickets
 * - Auto-refresh display data
 * - Status filtering (PENDING, IN_PROGRESS, READY)
 * - Bump screen workflow
 * - Performance statistics
 */
const KitchenDisplay = () => {
	const { user, logout } = useUser()
	const { showSuccess, showError, showWarning, showInfo } = useAlert()
	const navigate = useNavigate()
	const kitchenSocket = useKitchenSocket()

	// State
	const [tickets, setTickets] = useState([])
	const [stats, setStats] = useState(null)
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState('ACTIVE') // ACTIVE, PENDING, IN_PROGRESS, READY, ALL
	const [soundEnabled, setSoundEnabled] = useState(true)
	const [newTicketIds, setNewTicketIds] = useState(new Set())

	// Refs
	const refreshIntervalRef = useRef(null)
	const audioRef = useRef(null)

	// Initialize sound
	useEffect(() => {
		audioRef.current = new Audio('/notification.mp3') // Add notification sound to public folder
		audioRef.current.volume = 0.5
	}, [])

	// Play sound for new tickets
	const playNotificationSound = useCallback(() => {
		if (soundEnabled && audioRef.current) {
			audioRef.current.play().catch((err) => console.warn('Audio play failed:', err))
		}
	}, [soundEnabled])

	// Fetch display data
	const fetchDisplayData = useCallback(async () => {
		try {
			const result = await getKitchenDisplay()
			if (result.success) {
				const displayData = result.data

				// Check for new tickets (not in current state)
				if (tickets.length > 0 && displayData.tickets) {
					const currentTicketIds = new Set(tickets.map((t) => t.id))
					const newTickets = displayData.tickets.filter(
						(t) => !currentTicketIds.has(t.id),
					)

					if (newTickets.length > 0) {
						playNotificationSound()
						// Mark new tickets
						const newIds = new Set(newTickets.map((t) => t.id))
						setNewTicketIds(newIds)
						// Clear "new" status after 5 seconds
						setTimeout(() => setNewTicketIds(new Set()), 5000)
					}
				}

				setTickets(displayData.tickets || [])
			}
		} catch (error) {
			console.error('Error fetching display data:', error)
		}
	}, [tickets, playNotificationSound])

	// Fetch statistics
	const fetchStats = useCallback(async () => {
		try {
			const result = await getKitchenStats()
			if (result.success) {
				setStats(result.data)
			}
		} catch (error) {
			console.error('Error fetching stats:', error)
		}
	}, [])

	// Initial load
	useEffect(() => {
		const loadData = async () => {
			setLoading(true)
			await Promise.all([fetchDisplayData(), fetchStats()])
			setLoading(false)
		}

		loadData()

		// Auto-refresh every 3 seconds (display data)
		refreshIntervalRef.current = setInterval(() => {
			fetchDisplayData()
		}, 3000)

		// Refresh stats every 10 seconds
		const statsInterval = setInterval(() => {
			fetchStats()
		}, 10000)

		return () => {
			if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
			clearInterval(statsInterval)
		}
	}, [fetchDisplayData, fetchStats])

	// WebSocket event handlers
	useEffect(() => {
		if (!kitchenSocket?.isConnected) return

		// Listen for new kitchen tickets
		const handleNewTicket = (payload) => {
			console.log('🆕 New kitchen ticket:', payload)
			playNotificationSound()
			showInfo('New ticket received!')
			fetchDisplayData()
			fetchStats()
		}

		// Listen for ticket ready
		const handleTicketReady = (payload) => {
			console.log('✅ Ticket ready:', payload)
			showSuccess(`Ticket #${payload.data.ticketNumber} is ready!`)
			fetchDisplayData()
			fetchStats()
		}

		// Listen for ticket completed
		const handleTicketCompleted = (payload) => {
			console.log('👋 Ticket bumped:', payload)
			fetchDisplayData()
			fetchStats()
		}

		// Listen for priority changes
		const handlePriorityChange = (payload) => {
			console.log('🔥 Priority changed:', payload)
			fetchDisplayData()
		}

		// Listen for timer updates (every 5 seconds from backend)
		const handleTimerUpdate = (payload) => {
			console.log('⏱️ Timer update:', payload)
			// Update timers without full refresh
			if (payload.data && payload.data.tickets) {
				setTickets((prevTickets) =>
					prevTickets.map((ticket) => {
						const updated = payload.data.tickets.find((t) => t.id === ticket.id)
						return updated
							? {
									...ticket,
									elapsedSeconds: updated.elapsedSeconds,
									elapsedFormatted: updated.elapsedFormatted,
									ageColor: updated.ageColor,
							  }
							: ticket
					}),
				)
			}
		}

		// Attach listeners
		const socket = kitchenSocket.socket
		socket.on('kitchen.ticket.new', handleNewTicket)
		socket.on('kitchen.ticket.ready', handleTicketReady)
		socket.on('kitchen.ticket.completed', handleTicketCompleted)
		socket.on('kitchen.ticket.priority', handlePriorityChange)
		socket.on('kitchen.timers.update', handleTimerUpdate)

		// Cleanup
		return () => {
			socket.off('kitchen.ticket.new', handleNewTicket)
			socket.off('kitchen.ticket.ready', handleTicketReady)
			socket.off('kitchen.ticket.completed', handleTicketCompleted)
			socket.off('kitchen.ticket.priority', handlePriorityChange)
			socket.off('kitchen.timers.update', handleTimerUpdate)
		}
	}, [
		kitchenSocket,
		playNotificationSound,
		fetchDisplayData,
		fetchStats,
		showInfo,
		showSuccess,
	])

	// Ticket actions
	const handleStartTicket = useCallback(
		async (ticketId) => {
			const result = await startTicket(ticketId)
			if (result.success) {
				showSuccess('Ticket started!')
				fetchDisplayData()
				fetchStats()
			} else {
				showError(result.message || 'Failed to start ticket')
			}
		},
		[fetchDisplayData, fetchStats, showSuccess, showError],
	)

	const handleMarkItemsReady = useCallback(
		async (ticketId, itemIds) => {
			const result = await markItemsReady(ticketId, itemIds)
			if (result.success) {
				showSuccess('Items marked ready!')
				fetchDisplayData()
				fetchStats()
			} else {
				showError(result.message || 'Failed to mark items ready')
			}
		},
		[fetchDisplayData, fetchStats, showSuccess, showError],
	)

	const handleBumpTicket = useCallback(
		async (ticketId) => {
			const result = await bumpTicket(ticketId)
			if (result.success) {
				showSuccess('Ticket bumped!')
				fetchDisplayData()
				fetchStats()
			} else {
				showError(result.message || 'Failed to bump ticket')
			}
		},
		[fetchDisplayData, fetchStats, showSuccess, showError],
	)

	const handleUpdatePriority = useCallback(
		async (ticketId, priority) => {
			const result = await updateTicketPriority(ticketId, priority)
			if (result.success) {
				showSuccess(`Priority updated to ${priority}`)
				fetchDisplayData()
			} else {
				showError(result.message || 'Failed to update priority')
			}
		},
		[fetchDisplayData, showSuccess, showError],
	)

	const handleCancelTicket = useCallback(
		async (ticketId) => {
			if (!confirm('Are you sure you want to cancel this ticket?')) return

			const reason = prompt('Cancellation reason:')
			if (!reason) return

			const result = await cancelTicket(ticketId, reason)
			if (result.success) {
				showWarning('Ticket cancelled')
				fetchDisplayData()
				fetchStats()
			} else {
				showError(result.message || 'Failed to cancel ticket')
			}
		},
		[fetchDisplayData, fetchStats, showWarning, showError],
	)

	const handleRecallItems = useCallback(
		async (ticketId, itemIds) => {
			const reason = prompt('Recall reason (e.g., customer requested modification):')
			if (!reason) return

			const result = await recallItems(ticketId, itemIds, reason)
			if (result.success) {
				showInfo('Items recalled for remake')
				fetchDisplayData()
			} else {
				showError(result.message || 'Failed to recall items')
			}
		},
		[fetchDisplayData, showInfo, showError],
	)

	// Filter tickets
	const filteredTickets = tickets.filter((ticket) => {
		if (filter === 'ALL') return true
		if (filter === 'ACTIVE')
			return (
				ticket.status === 'PENDING' ||
				ticket.status === 'IN_PROGRESS' ||
				ticket.status === 'READY'
			)
		return ticket.status === filter
	})

	// Sort tickets: FIRE → URGENT → HIGH → NORMAL, then by elapsed time (oldest first)
	const sortedTickets = [...filteredTickets].sort((a, b) => {
		const priorityOrder = { FIRE: 0, URGENT: 1, HIGH: 2, NORMAL: 3 }
		const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
		if (priorityDiff !== 0) return priorityDiff
		return b.elapsedSeconds - a.elapsedSeconds // Oldest first
	})

	// Handle logout
	const handleLogout = () => {
		logout()
		navigate('/login')
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
					<div className="text-xl font-semibold">Loading Kitchen Display...</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
				<div className="max-w-screen-2xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold">🍳 Kitchen Display System</h1>
							<div className="text-sm opacity-90 mt-1">
								{user?.restaurantName || 'Smart Restaurant'} • {user?.role || 'Chef'}
							</div>
						</div>

						<div className="flex items-center gap-4">
							{/* WebSocket Status */}
							<div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
								<div
									className={`w-3 h-3 rounded-full ${
										kitchenSocket?.isConnected
											? 'bg-green-400 animate-pulse'
											: 'bg-red-400'
									}`}
								/>
								<span className="text-sm font-medium">
									{kitchenSocket?.isConnected ? 'Connected' : 'Disconnected'}
								</span>
							</div>

							{/* Sound Toggle */}
							<button
								onClick={() => setSoundEnabled(!soundEnabled)}
								className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
								title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
							>
								{soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
							</button>

							{/* Refresh */}
							<button
								onClick={() => {
									fetchDisplayData()
									fetchStats()
								}}
								className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
								title="Refresh"
							>
								<RefreshCw size={24} />
							</button>

							{/* Settings */}
							<button
								className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
								title="Settings"
							>
								<Settings size={24} />
							</button>

							{/* Logout */}
							<button
								onClick={handleLogout}
								className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors font-semibold"
							>
								<LogOut size={24} />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-screen-2xl mx-auto px-6 py-6">
				{/* Statistics */}
				<KitchenStats stats={stats} />

				{/* Filters */}
				<div className="flex items-center gap-2 mb-6 flex-wrap">
					<div className="flex items-center gap-2 mr-4">
						<Filter size={20} className="text-gray-600" />
						<span className="font-semibold text-gray-700">Filter:</span>
					</div>
					{['ACTIVE', 'PENDING', 'IN_PROGRESS', 'READY', 'ALL'].map((status) => (
						<button
							key={status}
							onClick={() => setFilter(status)}
							className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
								filter === status
									? 'bg-blue-600 text-white'
									: 'bg-white text-gray-700 hover:bg-gray-100'
							}`}
						>
							{status.replace('_', ' ')}
							<span className="ml-2 bg-white/20 px-2 py-1 rounded text-sm">
								{status === 'ACTIVE'
									? (stats?.pendingCount || 0) +
									  (stats?.inProgressCount || 0) +
									  (stats?.readyCount || 0)
									: status === 'PENDING'
									? stats?.pendingCount || 0
									: status === 'IN_PROGRESS'
									? stats?.inProgressCount || 0
									: status === 'READY'
									? stats?.readyCount || 0
									: tickets.length}
							</span>
						</button>
					))}
				</div>

				{/* Tickets Grid */}
				{sortedTickets.length === 0 ? (
					<div className="bg-white rounded-lg shadow-md p-12 text-center">
						<div className="text-6xl mb-4">🎉</div>
						<div className="text-2xl font-semibold text-gray-700 mb-2">
							All caught up!
						</div>
						<div className="text-gray-500">No tickets to display for this filter</div>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
						{sortedTickets.map((ticket) => (
							<TicketCard
								key={ticket.id}
								ticket={ticket}
								isNew={newTicketIds.has(ticket.id)}
								onStartTicket={handleStartTicket}
								onMarkItemsReady={handleMarkItemsReady}
								onBumpTicket={handleBumpTicket}
								onUpdatePriority={handleUpdatePriority}
								onRecall={handleRecallItems}
								onCancel={handleCancelTicket}
							/>
						))}
					</div>
				)}
			</div>

			{/* Custom Styles */}
			<style jsx>{`
				@keyframes pulse-border {
					0%,
					100% {
						border-color: rgba(59, 130, 246, 0.5);
					}
					50% {
						border-color: rgba(59, 130, 246, 1);
					}
				}
				.animate-pulse-border {
					animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
				}
			`}</style>
		</div>
	)
}

export default KitchenDisplay
