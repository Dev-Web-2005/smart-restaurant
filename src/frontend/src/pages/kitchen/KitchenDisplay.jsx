import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { useAlert } from '../../contexts/AlertContext'
import {
	getKitchenItems,
	getKitchenStats,
	startPreparing,
	markReady,
	batchStartPreparing,
	batchMarkReady,
} from '../../services/api/kitchenAPI'

// SLA Configuration (in minutes)
const SLA_WARNING_THRESHOLD = 10 // Yellow warning at 10 mins
const SLA_DANGER_THRESHOLD = 15 // Red danger at 15 mins

/**
 * Kitchen Display System (KDS)
 *
 * Features:
 * - Display items pending/preparing
 * - Timer & SLA tracking
 * - Touch-friendly UI
 * - Large text, high contrast
 * - Real-time updates via WebSocket
 */
const KitchenDisplay = () => {
	const { user, logout } = useUser()
	const { showSuccess, showError, showWarning } = useAlert()
	const navigate = useNavigate()
	const { ownerId } = useParams()

	// Handle logout
	const handleLogout = () => {
		logout()
		if (ownerId) {
			navigate(`/login/${ownerId}`)
		} else {
			navigate('/login')
		}
	}

	// State
	const [items, setItems] = useState([])
	const [stats, setStats] = useState({
		pendingCount: 0,
		preparingCount: 0,
		readyCount: 0,
		averagePrepTime: 0,
		delayedCount: 0,
	})
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState('ALL') // ALL, PENDING, PREPARING
	const [selectedItems, setSelectedItems] = useState([])
	const [currentTime, setCurrentTime] = useState(new Date())

	// Refs for interval cleanup
	const refreshIntervalRef = useRef(null)
	const timerIntervalRef = useRef(null)

	// Fetch kitchen items
	const fetchItems = useCallback(async () => {
		try {
			const status = filter === 'ALL' ? undefined : filter
			const result = await getKitchenItems({ status, limit: 100 })

			if (result.success) {
				setItems(result.data.items || [])
			}
		} catch (error) {
			console.error('Error fetching items:', error)
		}
	}, [filter])

	// Fetch stats
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

	// Initial load and refresh interval
	useEffect(() => {
		const loadData = async () => {
			setLoading(true)
			await Promise.all([fetchItems(), fetchStats()])
			setLoading(false)
		}

		loadData()

		// Auto-refresh every 5 seconds
		refreshIntervalRef.current = setInterval(() => {
			fetchItems()
			fetchStats()
		}, 5000)

		// Timer update every second
		timerIntervalRef.current = setInterval(() => {
			setCurrentTime(new Date())
		}, 1000)

		return () => {
			if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
		}
	}, [fetchItems, fetchStats])

	// Handle start preparing
	const handleStartPreparing = async (itemId) => {
		try {
			const result = await startPreparing(itemId)
			if (result.success) {
				showSuccess('Started', 'Started preparing item')
				fetchItems()
				fetchStats()
			} else {
				showError('Error', result.message)
			}
		} catch (error) {
			showError('Error', 'Failed to start preparing')
		}
	}

	// Handle mark ready
	const handleMarkReady = async (itemId) => {
		try {
			const result = await markReady(itemId)
			if (result.success) {
				showSuccess('Ready!', 'Item marked as ready')
				fetchItems()
				fetchStats()
			} else {
				showError('Error', result.message)
			}
		} catch (error) {
			showError('Error', 'Failed to mark ready')
		}
	}

	// Handle batch actions
	const handleBatchStart = async () => {
		if (selectedItems.length === 0) return

		const pendingItems = selectedItems.filter((id) => {
			const item = items.find((i) => i.id === id)
			return item?.status === 'PENDING'
		})

		if (pendingItems.length === 0) {
			showWarning('No Items', 'No pending items selected')
			return
		}

		const result = await batchStartPreparing(pendingItems)
		if (result.success) {
			showSuccess('Started', `Started preparing ${result.data.updated} items`)
			setSelectedItems([])
			fetchItems()
			fetchStats()
		}
	}

	const handleBatchReady = async () => {
		if (selectedItems.length === 0) return

		const preparingItems = selectedItems.filter((id) => {
			const item = items.find((i) => i.id === id)
			return item?.status === 'PREPARING'
		})

		if (preparingItems.length === 0) {
			showWarning('No Items', 'No preparing items selected')
			return
		}

		const result = await batchMarkReady(preparingItems)
		if (result.success) {
			showSuccess('Ready!', `Marked ${result.data.updated} items as ready`)
			setSelectedItems([])
			fetchItems()
			fetchStats()
		}
	}

	// Toggle item selection
	const toggleSelectItem = (itemId) => {
		setSelectedItems((prev) =>
			prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
		)
	}

	// Calculate time display
	const getTimeDisplay = (item) => {
		const now = currentTime.getTime()
		let elapsedMs = 0

		if (item.status === 'PREPARING' && item.startedAt) {
			elapsedMs = now - new Date(item.startedAt).getTime()
		} else if (item.status === 'PENDING' && item.receivedAt) {
			elapsedMs = now - new Date(item.receivedAt).getTime()
		}

		const elapsedMinutes = Math.floor(elapsedMs / 60000)
		const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000)

		return {
			display: `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds
				.toString()
				.padStart(2, '0')}`,
			elapsedMinutes,
			isWarning:
				elapsedMinutes >= SLA_WARNING_THRESHOLD && elapsedMinutes < SLA_DANGER_THRESHOLD,
			isDanger: elapsedMinutes >= SLA_DANGER_THRESHOLD,
		}
	}

	// Get status color
	const getStatusColor = (status) => {
		switch (status) {
			case 'PENDING':
				return 'bg-yellow-500'
			case 'PREPARING':
				return 'bg-blue-500'
			case 'READY':
				return 'bg-green-500'
			default:
				return 'bg-gray-500'
		}
	}

	// Loading state
	if (loading) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-white text-3xl">Loading Kitchen Display...</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			{/* Header */}
			<header className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
				<div className="flex items-center gap-6">
					<h1 className="text-3xl font-bold text-orange-500">🍳 Kitchen Display</h1>
					<div className="text-xl text-gray-300">
						{currentTime.toLocaleTimeString('vi-VN', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
						})}
					</div>
				</div>

				{/* Stats & User Info */}
				<div className="flex items-center gap-8">
					<div className="text-center">
						<div className="text-4xl font-bold text-yellow-400">{stats.pendingCount}</div>
						<div className="text-sm text-gray-400">Pending</div>
					</div>
					<div className="text-center">
						<div className="text-4xl font-bold text-blue-400">{stats.preparingCount}</div>
						<div className="text-sm text-gray-400">Preparing</div>
					</div>
					<div className="text-center">
						<div className="text-4xl font-bold text-green-400">{stats.readyCount}</div>
						<div className="text-sm text-gray-400">Ready</div>
					</div>
					{stats.delayedCount > 0 && (
						<div className="text-center">
							<div className="text-4xl font-bold text-red-500 animate-pulse">
								{stats.delayedCount}
							</div>
							<div className="text-sm text-red-400">Delayed!</div>
						</div>
					)}

					{/* Divider */}
					<div className="h-12 w-px bg-gray-600" />

					{/* User Info & Logout */}
					<div className="flex items-center gap-4">
						<div className="text-right">
							<div className="text-white font-semibold">
								{user?.name || 'Kitchen Staff'}
							</div>
							<div className="text-sm text-gray-400">{user?.email || 'Chef'}</div>
						</div>
						<button
							onClick={handleLogout}
							className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
						>
							<span>🚪</span>
							<span>Logout</span>
						</button>
					</div>
				</div>
			</header>

			{/* Filter & Batch Actions */}
			<div className="px-6 py-4 bg-gray-800 flex items-center justify-between border-b border-gray-700">
				{/* Filters */}
				<div className="flex gap-2">
					{['ALL', 'PENDING', 'PREPARING'].map((f) => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all ${
								filter === f
									? 'bg-orange-500 text-white'
									: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
							}`}
						>
							{f}
						</button>
					))}
				</div>

				{/* Batch Actions */}
				<div className="flex gap-4">
					{selectedItems.length > 0 && (
						<span className="text-lg text-gray-300 self-center">
							{selectedItems.length} selected
						</span>
					)}
					<button
						onClick={handleBatchStart}
						disabled={selectedItems.length === 0}
						className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all ${
							selectedItems.length > 0
								? 'bg-blue-600 hover:bg-blue-700 text-white'
								: 'bg-gray-700 text-gray-500 cursor-not-allowed'
						}`}
					>
						🔥 Start All
					</button>
					<button
						onClick={handleBatchReady}
						disabled={selectedItems.length === 0}
						className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all ${
							selectedItems.length > 0
								? 'bg-green-600 hover:bg-green-700 text-white'
								: 'bg-gray-700 text-gray-500 cursor-not-allowed'
						}`}
					>
						✅ Ready All
					</button>
				</div>
			</div>

			{/* Main Content - Item Grid */}
			<main className="p-6">
				{items.length === 0 ? (
					<div className="text-center py-20">
						<div className="text-6xl mb-4">🎉</div>
						<div className="text-3xl text-gray-400">No items to prepare</div>
						<div className="text-xl text-gray-500 mt-2">All caught up!</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{items.map((item) => {
							const timeInfo = getTimeDisplay(item)
							const isSelected = selectedItems.includes(item.id)

							return (
								<div
									key={item.id}
									onClick={() => toggleSelectItem(item.id)}
									className={`rounded-xl overflow-hidden cursor-pointer transition-all transform hover:scale-[1.02] ${
										isSelected ? 'ring-4 ring-orange-500' : 'ring-1 ring-gray-700'
									} ${
										timeInfo.isDanger
											? 'bg-red-900/50'
											: timeInfo.isWarning
											? 'bg-yellow-900/30'
											: 'bg-gray-800'
									}`}
								>
									{/* Header with Table & Status */}
									<div
										className={`px-4 py-3 flex justify-between items-center ${getStatusColor(
											item.status,
										)}`}
									>
										<span className="text-2xl font-bold">
											Table {item.tableId?.slice(-4) || '???'}
										</span>
										<span className="text-lg font-semibold uppercase">{item.status}</span>
									</div>

									{/* Item Info */}
									<div className="p-4">
										<h3 className="text-2xl font-bold mb-2">{item.name}</h3>
										<div className="text-xl text-gray-300 mb-2">
											Qty: <span className="font-bold text-white">{item.quantity}</span>
										</div>

										{/* Modifiers */}
										{item.modifiers && item.modifiers.length > 0 && (
											<div className="mb-2">
												{item.modifiers.map((mod, idx) => (
													<span
														key={idx}
														className="inline-block bg-gray-700 text-gray-200 px-2 py-1 rounded text-sm mr-2 mb-1"
													>
														{mod.optionName || mod.modifierGroupName}
													</span>
												))}
											</div>
										)}

										{/* Notes */}
										{item.notes && (
											<div className="bg-yellow-900/50 text-yellow-200 px-3 py-2 rounded-lg text-lg mb-2">
												📝 {item.notes}
											</div>
										)}

										{/* Timer */}
										<div
											className={`text-4xl font-mono font-bold text-center py-3 rounded-lg ${
												timeInfo.isDanger
													? 'bg-red-600 text-white animate-pulse'
													: timeInfo.isWarning
													? 'bg-yellow-600 text-black'
													: 'bg-gray-700 text-white'
											}`}
										>
											{timeInfo.display}
										</div>
									</div>

									{/* Action Buttons */}
									<div className="px-4 pb-4 flex gap-2">
										{item.status === 'PENDING' && (
											<button
												onClick={(e) => {
													e.stopPropagation()
													handleStartPreparing(item.id)
												}}
												className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-lg transition-all active:scale-95"
											>
												🔥 START
											</button>
										)}
										{item.status === 'PREPARING' && (
											<button
												onClick={(e) => {
													e.stopPropagation()
													handleMarkReady(item.id)
												}}
												className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 rounded-lg transition-all active:scale-95"
											>
												✅ READY
											</button>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</main>

			{/* Footer Stats */}
			<footer className="fixed bottom-0 left-0 right-0 bg-gray-800 px-6 py-3 border-t border-gray-700">
				<div className="flex justify-between items-center">
					<div className="text-gray-400">
						Average prep time:{' '}
						<span className="text-white font-bold">{stats.averagePrepTime} min</span>
					</div>
					<div className="text-gray-400">
						SLA: <span className="text-yellow-400">⚠️ {SLA_WARNING_THRESHOLD}min</span> |{' '}
						<span className="text-red-400">🔴 {SLA_DANGER_THRESHOLD}min</span>
					</div>
				</div>
			</footer>
		</div>
	)
}

export default KitchenDisplay
