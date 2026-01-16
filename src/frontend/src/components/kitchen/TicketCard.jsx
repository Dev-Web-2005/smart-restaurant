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
	const timerRef = useRef(null)

	// Sync with prop updates
	useEffect(() => {
		if (ticket.elapsedSeconds !== undefined && ticket.elapsedSeconds !== elapsedSeconds) {
			setElapsedSeconds(ticket.elapsedSeconds)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ticket.elapsedSeconds])

	// Local timer for accurate seconds
	useEffect(() => {
		if (ticket.status === 'IN_PROGRESS' && !ticket.isPaused) {
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
	 * Get card color based on elapsed time and priority
	 */
	const getCardStyle = () => {
		const warningThreshold = 600 // 10 minutes
		const criticalThreshold = 900 // 15 minutes

		let bgColor = 'bg-white'
		let borderColor = 'border-gray-300'
		let textColor = 'text-gray-900'

		// Status-based colors
		if (ticket.status === 'READY') {
			bgColor = 'bg-green-50'
			borderColor = 'border-green-500'
		} else if (ticket.status === 'COMPLETED') {
			bgColor = 'bg-gray-100'
			borderColor = 'border-gray-400'
			textColor = 'text-gray-600'
		} else if (ticket.status === 'CANCELLED') {
			bgColor = 'bg-red-50'
			borderColor = 'border-red-400'
		} else {
			// Age-based colors for active tickets
			if (elapsedSeconds >= criticalThreshold) {
				bgColor = 'bg-red-100'
				borderColor = 'border-red-600'
			} else if (elapsedSeconds >= warningThreshold) {
				bgColor = 'bg-yellow-100'
				borderColor = 'border-yellow-500'
			}
		}

		// Priority override
		if (ticket.priority === 'FIRE') {
			bgColor = 'bg-red-200'
			borderColor = 'border-red-700'
		} else if (ticket.priority === 'URGENT') {
			bgColor = 'bg-orange-100'
			borderColor = 'border-orange-600'
		}

		return `${bgColor} ${borderColor} ${textColor}`
	}

	/**
	 * Get timer color based on elapsed time
	 */
	const getTimerColor = () => {
		const warningThreshold = 600
		const criticalThreshold = 900

		if (elapsedSeconds >= criticalThreshold) {
			return 'text-red-700 font-bold animate-pulse'
		} else if (elapsedSeconds >= warningThreshold) {
			return 'text-yellow-700 font-bold'
		}
		return 'text-gray-700'
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
						🔥 FIRE
					</span>
				)
			case 'URGENT':
				return (
					<span className="px-3 py-1 bg-orange-600 text-white font-bold rounded-full text-sm">
						⚡ URGENT
					</span>
				)
			case 'HIGH':
				return (
					<span className="px-3 py-1 bg-yellow-600 text-white font-semibold rounded-full text-sm">
						⬆️ HIGH
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
				className={`p-4 rounded-lg border-3 shadow-md cursor-pointer hover:shadow-lg transition-all ${getCardStyle()}`}
				onClick={() => setIsExpanded(true)}
			>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-3">
						<div className="text-3xl font-bold text-blue-600">#{ticket.ticketNumber}</div>
						<div className="text-sm">
							<div className="font-semibold">
								Table {ticket.tableNumber || ticket.tableId}
							</div>
							<div className="text-xs opacity-75">{ticket.items?.length || 0} items</div>
						</div>
					</div>
					<div className={`text-2xl font-bold ${getTimerColor()}`}>
						{formatTime(elapsedSeconds)}
					</div>
				</div>
				{getPriorityBadge()}
			</div>
		)
	}

	return (
		<div className={`p-4 rounded-lg border-3 shadow-lg transition-all ${getCardStyle()}`}>
			{/* Header */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<div className="text-4xl font-bold text-blue-600">#{ticket.ticketNumber}</div>
					<div>
						<div className="text-lg font-bold">
							Table {ticket.tableNumber || ticket.tableId}
						</div>
						{ticket.customerName && (
							<div className="text-sm text-gray-600">{ticket.customerName}</div>
						)}
						<div className="text-xs text-gray-500">
							Order #{ticket.orderId?.slice(0, 8)}
						</div>
					</div>
				</div>
				<div className="text-right">
					<div className={`text-3xl font-bold ${getTimerColor()}`}>
						{formatTime(elapsedSeconds)}
					</div>
					<div className="text-xs text-gray-500 mt-1">
						{ticket.status.replace('_', ' ')}
					</div>
				</div>
			</div>

			{/* Priority Badge */}
			{getPriorityBadge()}

			{/* Order Type & Notes */}
			{(ticket.orderType || ticket.notes) && (
				<div className="mb-3 p-2 bg-blue-50 rounded text-sm">
					{ticket.orderType && (
						<div className="font-semibold text-blue-700">📋 {ticket.orderType}</div>
					)}
					{ticket.notes && <div className="text-gray-700 mt-1">💬 {ticket.notes}</div>}
				</div>
			)}

			{/* Items */}
			<div className="space-y-2 mb-3">
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
			<div className="flex gap-2 mb-3 text-sm">
				{counts.pending > 0 && (
					<span className="px-2 py-1 bg-gray-200 rounded">
						⏳ {counts.pending} pending
					</span>
				)}
				{counts.preparing > 0 && (
					<span className="px-2 py-1 bg-yellow-200 rounded">
						🍳 {counts.preparing} cooking
					</span>
				)}
				{counts.ready > 0 && (
					<span className="px-2 py-1 bg-green-200 rounded">✅ {counts.ready} ready</span>
				)}
			</div>

			{/* Action Buttons */}
			<div className="grid grid-cols-2 gap-2">
				{canStart && (
					<button
						onClick={() => onStart && onStart(ticket.id)}
						className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
					>
						🍳 Start Cooking
					</button>
				)}

				{canMarkReady && (
					<button
						onClick={() =>
							onMarkReady &&
							onMarkReady(
								ticket.items?.filter((i) => i.status === 'PREPARING').map((i) => i.id),
							)
						}
						className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
					>
						✅ Mark Ready
					</button>
				)}

				{canBump && (
					<button
						onClick={() => onBump && onBump(ticket.id)}
						className="col-span-2 px-4 py-3 bg-purple-600 text-white font-bold text-lg rounded-lg hover:bg-purple-700 transition-colors"
					>
						🎯 BUMP (Complete)
					</button>
				)}

				{/* Priority Controls */}
				{ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' && (
					<div className="col-span-2 flex gap-2 mt-2">
						<button
							onClick={() => onPriorityChange && onPriorityChange(ticket.id, 'HIGH')}
							className="flex-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200"
							disabled={ticket.priority === 'HIGH'}
						>
							⬆️ High
						</button>
						<button
							onClick={() => onPriorityChange && onPriorityChange(ticket.id, 'URGENT')}
							className="flex-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200"
							disabled={ticket.priority === 'URGENT'}
						>
							⚡ Urgent
						</button>
						<button
							onClick={() => onPriorityChange && onPriorityChange(ticket.id, 'FIRE')}
							className="flex-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
							disabled={ticket.priority === 'FIRE'}
						>
							🔥 Fire
						</button>
					</div>
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
