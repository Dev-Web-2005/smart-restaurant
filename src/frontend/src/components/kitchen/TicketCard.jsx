import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import TicketItem from './TicketItem'

/**
 * TicketCard Component
 *
 * Displays a kitchen ticket with items, timer, and action buttons
 * Implements modern KDS card design with color-coded age indicators
 */
const TicketCard = ({
	ticket,
	onStart,
	onMarkReady,
	onBump,
	onPriorityChange,
	isCompact = false,
}) => {
	// Local state - elapsedSeconds initialized from prop and updated by timer
	const [elapsedSeconds, setElapsedSeconds] = useState(ticket.elapsedSeconds || 0)
	const [isExpanded, setIsExpanded] = useState(!isCompact)
	const [isProcessing, setIsProcessing] = useState(false) // ✅ Track button processing state
	const timerRef = useRef(null)

	// Sync with prop updates
	useEffect(() => {
		if (ticket.elapsedSeconds !== undefined && ticket.elapsedSeconds !== elapsedSeconds) {
			setElapsedSeconds(ticket.elapsedSeconds)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ticket.elapsedSeconds])

	// Local timer for accurate seconds
	// Backend updates every 5 seconds, local timer keeps display smooth
	// Timer runs for both PENDING and IN_PROGRESS tickets
	useEffect(() => {
		const isActiveTicket =
			(ticket.status === 'IN_PROGRESS' || ticket.status === 'PENDING') && !ticket.isPaused

		if (isActiveTicket) {
			timerRef.current = setInterval(() => {
				setElapsedSeconds((prev) => prev + 1)
			}, 1000)
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}
		}
	}, [ticket.status, ticket.isPaused])

	/**
	 * Get card color based on elapsed time and priority (Dark glassmorphism theme)
	 */
	const getCardStyle = () => {
		const warningThreshold = 600 // 10 minutes
		const criticalThreshold = 900 // 15 minutes

		let bgColor = 'bg-white/5'
		let borderColor = 'border-white/10'

		// Status-based colors
		if (ticket.status === 'READY') {
			bgColor = 'bg-green-500/10'
			borderColor = 'border-green-500/40'
		} else if (ticket.status === 'COMPLETED') {
			bgColor = 'bg-gray-500/10'
			borderColor = 'border-gray-500/30'
		} else if (ticket.status === 'CANCELLED') {
			bgColor = 'bg-red-500/10'
			borderColor = 'border-red-500/30'
		} else {
			// Age-based colors for active tickets
			if (elapsedSeconds >= criticalThreshold) {
				bgColor = 'bg-red-500/15'
				borderColor = 'border-red-500/60'
			} else if (elapsedSeconds >= warningThreshold) {
				bgColor = 'bg-yellow-500/10'
				borderColor = 'border-yellow-500/40'
			}
		}

		// Priority override
		if (ticket.priority === 'FIRE') {
			bgColor = 'bg-red-500/20'
			borderColor = 'border-red-500/70'
		} else if (ticket.priority === 'URGENT') {
			bgColor = 'bg-orange-500/15'
			borderColor = 'border-orange-500/60'
		}

		return `${bgColor} ${borderColor} backdrop-blur-xl`
	}

	/**
	 * Get timer color based on elapsed time (Dark theme)
	 */
	const getTimerColor = () => {
		const warningThreshold = 600
		const criticalThreshold = 900

		if (elapsedSeconds >= criticalThreshold) {
			return 'text-red-400 font-bold animate-pulse'
		} else if (elapsedSeconds >= warningThreshold) {
			return 'text-yellow-400 font-bold'
		}
		return 'text-white'
	}

	/**
	 * Format elapsed time as MM:SS
	 */
	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	/**
	 * Get priority badge
	 */
	const getPriorityBadge = () => {
		switch (ticket.priority) {
			case 'FIRE':
				return (
					<span className="px-3 py-1 bg-red-600 text-white font-bold rounded-full text-sm animate-pulse">
						FIRE
					</span>
				)
			case 'URGENT':
				return (
					<span className="px-3 py-1 bg-orange-600 text-white font-bold rounded-full text-sm">
						URGENT
					</span>
				)
			case 'HIGH':
				return (
					<span className="px-3 py-1 bg-yellow-600 text-white font-semibold rounded-full text-sm">
						HIGH
					</span>
				)
			default:
				return null
		}
	}

	/**
	 * Handle item status toggle
	 */
	const handleItemToggle = (item) => {
		if (item.status === 'PENDING' || item.status === 'ACCEPTED') {
			// Start item
			console.log('Start item:', item.id)
		} else if (item.status === 'PREPARING') {
			// Mark ready
			if (onMarkReady) {
				onMarkReady([item.id])
			}
		}
	}

	/**
	 * Get count of items by status
	 */
	const getItemCounts = () => {
		const counts = {
			pending: 0,
			preparing: 0,
			ready: 0,
		}

		ticket.items?.forEach((item) => {
			if (item.status === 'PENDING' || item.status === 'ACCEPTED') counts.pending++
			else if (item.status === 'PREPARING') counts.preparing++
			else if (item.status === 'READY') counts.ready++
		})

		return counts
	}

	const counts = getItemCounts()
	const canStart = ticket.status === 'PENDING'
	const canMarkReady = ticket.status === 'IN_PROGRESS' && counts.preparing > 0
	const canBump =
		ticket.status === 'READY' ||
		(ticket.status === 'IN_PROGRESS' && counts.ready === ticket.items?.length)

	if (isCompact && !isExpanded) {
		return (
			<div
				className={`p-4 rounded-lg border shadow-md cursor-pointer hover:shadow-lg transition-all ${getCardStyle()}`}
				onClick={() => setIsExpanded(true)}
			>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-3">
						<div className="text-2xl font-bold text-blue-400">#{ticket.ticketNumber}</div>
						<div className="text-sm">
							<div className="font-semibold text-white">
								{ticket.tableNumber || `Table ${ticket.tableId?.slice(0, 8)}`}
							</div>
							<div className="text-xs text-gray-400">
								{ticket.items?.length || 0} items
							</div>
						</div>
					</div>
					<div className={`text-xl font-bold ${getTimerColor()}`}>
						{formatTime(elapsedSeconds)}
					</div>
				</div>
				{getPriorityBadge()}
			</div>
		)
	}

	return (
		<div className={`p-4 rounded-lg border shadow-lg transition-all ${getCardStyle()}`}>
			{/* Header */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3 min-w-0 flex-1">
					<div className="text-2xl md:text-3xl font-bold text-blue-400 flex-shrink-0">
						#{ticket.ticketNumber}
					</div>
					<div className="min-w-0">
						<div className="text-base md:text-lg font-bold text-white truncate">
							{ticket.tableNumber || `Table ${ticket.tableId?.slice(0, 8)}`}
						</div>
						{ticket.customerName && (
							<div className="text-sm text-gray-400 truncate">{ticket.customerName}</div>
						)}
						<div className="text-xs text-gray-500">
							Order #{ticket.orderId?.slice(0, 8)}
						</div>
					</div>
				</div>
				<div className="text-right flex-shrink-0">
					<div className={`text-2xl md:text-3xl font-bold ${getTimerColor()}`}>
						{formatTime(elapsedSeconds)}
					</div>
					<div className="text-xs text-gray-400 mt-1">
						{ticket.status.replace('_', ' ')}
					</div>
				</div>
			</div>

			{/* Priority Badge */}
			{getPriorityBadge()}

			{/* Order Type & Notes */}
			{(ticket.orderType || ticket.notes) && (
				<div className="mb-3 p-2 bg-blue-500/20 rounded-lg text-sm border border-blue-500/30">
					{ticket.orderType && (
						<div className="font-semibold text-blue-400">📋 {ticket.orderType}</div>
					)}
					{ticket.notes && <div className="text-gray-300 mt-1">💬 {ticket.notes}</div>}
				</div>
			)}

			{/* Items - scrollable with max height */}
			<div className="space-y-2 mb-3 max-h-48 overflow-y-auto scrollbar-hide">
				{ticket.items?.map((item, idx) => (
					<TicketItem
						key={item.id || idx}
						item={item}
						onToggleStatus={handleItemToggle}
						isCompact={false}
					/>
				))}
			</div>

			{/* Item Status Summary */}
			<div className="flex flex-wrap gap-2 mb-3 text-xs">
				{counts.pending > 0 && (
					<span className="px-2 py-1 bg-gray-500/30 text-gray-300 rounded">
						⏳ {counts.pending} pending
					</span>
				)}
				{counts.preparing > 0 && (
					<span className="px-2 py-1 bg-yellow-500/30 text-yellow-300 rounded">
						🍳 {counts.preparing} cooking
					</span>
				)}
				{counts.ready > 0 && (
					<span className="px-2 py-1 bg-green-500/30 text-green-300 rounded">
						✅ {counts.ready} ready
					</span>
				)}
			</div>

			{/* Action Buttons */}
			<div className="grid grid-cols-2 gap-2">
				{canStart && (
					<button
						onClick={async () => {
							if (isProcessing) return
							setIsProcessing(true)
							try {
								onStart && (await onStart(ticket.id))
							} finally {
								setIsProcessing(false)
							}
						}}
						disabled={isProcessing}
						className={`px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-sm ${
							isProcessing ? 'opacity-50 cursor-not-allowed' : ''
						}`}
					>
						{isProcessing ? '⏳ Starting...' : '🍳 Start Cooking'}
					</button>
				)}

				{canMarkReady && (
					<button
						onClick={async () => {
							if (isProcessing) return
							setIsProcessing(true)
							try {
								const preparingItems = ticket.items
									?.filter((i) => i.status === 'PREPARING')
									.map((i) => i.id)
								onMarkReady && (await onMarkReady(preparingItems))
							} finally {
								setIsProcessing(false)
							}
						}}
						disabled={isProcessing}
						className={`px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm ${
							isProcessing ? 'opacity-50 cursor-not-allowed' : ''
						}`}
					>
						{isProcessing ? '⏳ Processing...' : '✅ Mark Ready'}
					</button>
				)}

				{canBump && (
					<button
						onClick={async () => {
							if (isProcessing) return
							setIsProcessing(true)
							try {
								onBump && (await onBump(ticket.id))
							} finally {
								setIsProcessing(false)
							}
						}}
						disabled={isProcessing}
						className={`col-span-2 px-3 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold text-base rounded-lg transition-colors ${
							isProcessing ? 'opacity-50 cursor-not-allowed' : ''
						}`}
					>
						{isProcessing ? '⏳ Bumping...' : '🎯 BUMP (Complete)'}
					</button>
				)}
			</div>

			{/* Compact Toggle */}
			{isCompact && (
				<button
					onClick={() => setIsExpanded(false)}
					className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700"
				>
					▲ Collapse
				</button>
			)}
		</div>
	)
}

TicketCard.propTypes = {
	ticket: PropTypes.shape({
		id: PropTypes.string.isRequired,
		ticketNumber: PropTypes.string.isRequired,
		orderId: PropTypes.string.isRequired,
		tableId: PropTypes.string,
		tableNumber: PropTypes.string,
		customerName: PropTypes.string,
		status: PropTypes.string.isRequired,
		priority: PropTypes.string,
		orderType: PropTypes.string,
		notes: PropTypes.string,
		elapsedSeconds: PropTypes.number,
		isPaused: PropTypes.bool,
		items: PropTypes.array.isRequired,
	}).isRequired,
	onStart: PropTypes.func,
	onMarkReady: PropTypes.func,
	onBump: PropTypes.func,
	onPriorityChange: PropTypes.func,
	isCompact: PropTypes.bool,
}

export default TicketCard
