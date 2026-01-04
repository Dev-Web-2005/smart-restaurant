import React, { useState, useEffect } from 'react'
import { useUser } from '../../../contexts/UserContext'
import { useNotifications } from '../../../contexts/NotificationContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'

// Mock data for help requests (will be replaced by socket.io in the future)
const mockHelpRequests = [
	{
		id: 'HR001',
		tableName: 'Table 5',
		timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
		isAcknowledged: false,
		message: 'Customer needs assistance',
	},
	{
		id: 'HR002',
		tableName: 'Table 12',
		timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
		isAcknowledged: false,
		message: 'Requesting waiter',
	},
	{
		id: 'HR003',
		tableName: 'Table 3',
		timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago
		isAcknowledged: true,
		message: 'Help requested',
	},
	{
		id: 'HR004',
		tableName: 'Table 8',
		timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
		isAcknowledged: true,
		message: 'Customer needs assistance',
	},
]

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
	const now = Date.now()
	const diff = now - timestamp
	const minutes = Math.floor(diff / 60000)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)

	if (minutes < 1) return 'Just now'
	if (minutes < 60) return `${minutes}m ago`
	if (hours < 24) return `${hours}h ago`
	return `${days}d ago`
}

// Helper function to get full date time
const getFullDateTime = (timestamp) => {
	return new Date(timestamp).toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

// HelpRequest Card Component
const HelpRequestCard = ({ request, onAcknowledge }) => {
	const isNew = !request.isAcknowledged

	return (
		<div
			className={`bg-black/40 backdrop-blur-md rounded-xl p-4 border transition-all duration-200 hover:bg-black/50 ${
				isNew ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'border-white/10'
			}`}
		>
			<div className="flex items-start justify-between gap-4">
				{/* Left: Info */}
				<div className="flex-1 space-y-2">
					{/* Table Name */}
					<div className="flex items-center gap-2">
						<span className="material-symbols-outlined text-blue-400">
							table_restaurant
						</span>
						<h3 className="text-white text-lg font-bold m-0">{request.tableName}</h3>
						{isNew && (
							<span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/50">
								NEW
							</span>
						)}
					</div>

					{/* Message */}
					<p className="text-gray-300 text-sm">{request.message}</p>

					{/* Timestamp */}
					<div className="flex items-center gap-2 text-xs text-gray-400">
						<span className="material-symbols-outlined text-sm">schedule</span>
						<span>{getFullDateTime(request.timestamp)}</span>
						<span className="text-gray-500">•</span>
						<span className={isNew ? 'text-yellow-400 font-semibold' : ''}>
							{formatTimestamp(request.timestamp)}
						</span>
					</div>
				</div>

				{/* Right: Action Button */}
				<div className="flex flex-col items-end gap-2">
					{isNew ? (
						<button
							onClick={() => onAcknowledge(request.id)}
							className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-400/50 rounded-lg transition-colors hover:bg-green-500/30 active:scale-95"
							title="Acknowledge request"
						>
							<span className="material-symbols-outlined">check_circle</span>
							<span className="font-semibold text-sm">Acknowledge</span>
						</button>
					) : (
						<div className="flex items-center gap-2 px-4 py-2 bg-gray-700/40 text-gray-400 border border-gray-600/50 rounded-lg">
							<span className="material-symbols-outlined fill-1">task_alt</span>
							<span className="font-semibold text-sm">Handled</span>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

const HelpRequests = () => {
	const { user, loading: contextLoading } = useUser()
	const { decrementHelpRequests } = useNotifications()

	const [requests, setRequests] = useState([])
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState('NEW') // 'NEW', 'ACKNOWLEDGED'

	// Fetch help requests (will be replaced with socket.io)
	const fetchHelpRequests = async () => {
		console.log('Fetching help requests...')
		setLoading(true)

		// Simulate API call
		// TODO: Replace with socket.io connection
		// socket.on('helpRequest', (newRequest) => { ... })

		setTimeout(() => {
			setRequests(mockHelpRequests.sort((a, b) => b.timestamp - a.timestamp))
			setLoading(false)
		}, 500)
	}

	// Handle acknowledge action
	const handleAcknowledge = async (requestId) => {
		console.log(`Acknowledging request: ${requestId}`)

		// TODO: Send acknowledgement to backend via socket.io
		// socket.emit('acknowledgeHelpRequest', { requestId })

		// Update local state
		setRequests((prev) =>
			prev.map((req) => (req.id === requestId ? { ...req, isAcknowledged: true } : req)),
		)
		decrementHelpRequests() // Update sidebar notification

		// Simulate success feedback (optional)
		// You can integrate with AlertContext for better UX
	}

	// Filter requests based on selected filter
	const filteredRequests = requests.filter((req) => {
		if (filter === 'NEW') return !req.isAcknowledged
		if (filter === 'ACKNOWLEDGED') return req.isAcknowledged
		return true // 'ALL'
	})

	// Count unacknowledged requests
	const newRequestsCount = requests.filter((req) => !req.isAcknowledged).length

	useEffect(() => {
		if (!contextLoading) {
			fetchHelpRequests()

			// TODO: Setup socket.io listener
			// const socket = io(SOCKET_URL)
			// socket.on('helpRequest', (newRequest) => {
			//   setRequests(prev => [newRequest, ...prev])
			//   // Play notification sound
			//   // Show browser notification
			// })
			// return () => socket.disconnect()
		}
	}, [contextLoading])

	if (contextLoading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading User Context...</p>
			</div>
		)
	}

	return (
		<BasePageLayout activeRoute="Help Requests">
			<div className="w-full h-full">
				{/* Header */}
				<header className="mb-8">
					<div className="flex items-center gap-3 mb-2">
						<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] m-0">
							Help Requests
						</h1>
						{newRequestsCount > 0 && (
							<span className="flex items-center justify-center min-w-[32px] h-8 px-3 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
								{newRequestsCount}
							</span>
						)}
					</div>
					<p className="text-gray-300 text-base mt-2">
						Monitor and respond to customer assistance requests in real-time.
					</p>
				</header>

				{/* Filter Tabs */}
				<div className="flex gap-2 mb-6 bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10">
					<button
						onClick={() => setFilter('NEW')}
						className={`relative flex-1 py-3 px-4 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
							filter === 'NEW'
								? 'bg-yellow-500 text-white shadow-lg'
								: 'text-gray-400 hover:text-white hover:bg-white/5'
						}`}
					>
						<span className="material-symbols-outlined text-sm">
							notification_important
						</span>
						New
						{newRequestsCount > 0 && (
							<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 shadow-lg">
								{newRequestsCount}
							</span>
						)}
					</button>
					<button
						onClick={() => setFilter('ACKNOWLEDGED')}
						className={`relative flex-1 py-3 px-4 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
							filter === 'ACKNOWLEDGED'
								? 'bg-green-500 text-white shadow-lg'
								: 'text-gray-400 hover:text-white hover:bg-white/5'
						}`}
					>
						<span className="material-symbols-outlined text-sm fill-1">task_alt</span>
						Handled
						<span className="text-xs opacity-80">
							({requests.filter((r) => r.isAcknowledged).length})
						</span>
					</button>
				</div>

				{/* Requests List */}
				<div className="space-y-4">
					{loading ? (
						<div className="text-center py-10">
							<p className="text-gray-400">Loading help requests...</p>
						</div>
					) : filteredRequests.length > 0 ? (
						filteredRequests.map((request) => (
							<HelpRequestCard
								key={request.id}
								request={request}
								onAcknowledge={handleAcknowledge}
							/>
						))
					) : (
						<div className="text-center py-20">
							<span className="material-symbols-outlined text-6xl text-gray-600 mb-4 block">
								{filter === 'NEW' ? 'notifications_off' : 'check_circle'}
							</span>
							<p className="text-gray-400 text-lg">
								{filter === 'NEW'
									? 'No new help requests at the moment.'
									: filter === 'ACKNOWLEDGED'
									? 'No handled requests yet.'
									: 'No help requests found.'}
							</p>
						</div>
					)}
				</div>

				{/* Info Banner */}
				<div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
					<span className="material-symbols-outlined text-blue-400 flex-shrink-0">
						info
					</span>
					<div className="text-sm text-blue-300">
						<p className="font-semibold mb-1">Real-time Updates Coming Soon</p>
						<p className="text-blue-400/80">
							This page will automatically update when customers press the help button at
							their table. Socket.io integration is pending backend implementation.
						</p>
					</div>
				</div>
			</div>
		</BasePageLayout>
	)
}

export default HelpRequests
