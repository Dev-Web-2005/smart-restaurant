import React, { useMemo } from 'react'
import { Clock, Flame, AlertTriangle, Users, MapPin } from 'lucide-react'

/**
 * Ticket Card Component
 *
 * Displays a kitchen ticket with items, timer, and priority
 * Visual design inspired by Toast POS, Square KDS, Oracle MICROS
 *
 * Features:
 * - Color-coded timer (green → yellow → red)
 * - Priority badges (FIRE, URGENT, HIGH)
 * - Touch-friendly buttons
 * - Item status indicators
 * - Pulse animation for new tickets
 */
const TicketCard = ({
	ticket,
	onStartTicket,
	onMarkItemsReady,
	onBumpTicket,
	onUpdatePriority,
	onRecall,
	onCancel,
	isNew = false,
}) => {
	// Get timer color based on age
	const timerColor = useMemo(() => {
		if (ticket.ageColor === 'RED') return 'bg-red-500'
		if (ticket.ageColor === 'YELLOW') return 'bg-yellow-500'
		return 'bg-green-500'
	}, [ticket.ageColor])

	// Get priority badge
	const priorityBadge = useMemo(() => {
		switch (ticket.priority) {
			case 'FIRE':
				return (
					<div className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
						<Flame size={16} />
						FIRE
					</div>
				)
			case 'URGENT':
				return (
					<div className="flex items-center gap-1 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">
						<AlertTriangle size={16} />
						URGENT
					</div>
				)
			case 'HIGH':
				return (
					<div className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
						HIGH
					</div>
				)
			default:
				return null
		}
	}, [ticket.priority])

	// Get status badge color
	const statusColor = useMemo(() => {
		switch (ticket.status) {
			case 'PENDING':
				return 'bg-gray-400'
			case 'IN_PROGRESS':
				return 'bg-blue-500'
			case 'READY':
				return 'bg-green-500'
			case 'COMPLETED':
				return 'bg-gray-300'
			default:
				return 'bg-gray-400'
		}
	}, [ticket.status])

	return (
		<div
			className={`
				bg-white border-2 rounded-lg shadow-lg overflow-hidden
				${isNew ? 'border-blue-500 animate-pulse-border' : 'border-gray-200'}
				transition-all duration-300 hover:shadow-xl
			`}
		>
			{/* Header */}
			<div className={`${timerColor} text-white px-4 py-3`}>
				<div className="flex items-center justify-between">
					{/* Ticket Number & Timer */}
					<div className="flex items-center gap-3">
						<div className="text-3xl font-bold">#{ticket.ticketNumber}</div>
						<div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
							<Clock size={18} />
							<span className="text-2xl font-mono font-bold">
								{ticket.elapsedFormatted}
							</span>
						</div>
					</div>

					{/* Priority Badge */}
					{priorityBadge}
				</div>

				{/* Order Info */}
				<div className="flex items-center gap-4 mt-2 text-sm opacity-90">
					<div className="flex items-center gap-1">
						<MapPin size={14} />
						<span className="font-semibold">
							Table {ticket.tableName || ticket.tableId}
						</span>
					</div>
					{ticket.customerName && (
						<div className="flex items-center gap-1">
							<Users size={14} />
							<span>{ticket.customerName}</span>
						</div>
					)}
					<div className="ml-auto">
						<span className={`${statusColor} px-2 py-1 rounded text-xs font-semibold`}>
							{ticket.status}
						</span>
					</div>
				</div>
			</div>

			{/* Items List */}
			<div className="p-4 space-y-2 max-h-96 overflow-y-auto">
				{ticket.items.map((item, idx) => (
					<div
						key={item.id || idx}
						className={`
							border-l-4 pl-3 py-2
							${
								item.status === 'READY'
									? 'border-green-500 bg-green-50'
									: item.status === 'PREPARING'
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-300'
							}
						`}
					>
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<span className="text-xl font-bold text-gray-700">
										{item.quantity}x
									</span>
									<span className="text-lg font-semibold">{item.itemName}</span>
								</div>

								{/* Modifiers */}
								{item.modifiers && item.modifiers.length > 0 && (
									<div className="ml-8 mt-1 text-sm text-gray-600">
										{item.modifiers.map((mod, midx) => (
											<div key={midx}>+ {mod.name}</div>
										))}
									</div>
								)}

								{/* Special Notes */}
								{item.notes && (
									<div className="ml-8 mt-1 text-sm italic text-orange-600 font-medium">
										📝 {item.notes}
									</div>
								)}

								{/* Recall Reason */}
								{item.recallReason && (
									<div className="ml-8 mt-1 text-sm text-red-600 font-medium">
										🔄 REMAKE: {item.recallReason}
									</div>
								)}
							</div>

							{/* Item Status Badge */}
							<div className="text-sm font-semibold">
								{item.status === 'READY' && (
									<span className="text-green-600">✓ READY</span>
								)}
								{item.status === 'PREPARING' && (
									<span className="text-blue-600">🍳 COOKING</span>
								)}
								{item.status === 'PENDING' && (
									<span className="text-gray-500">⏳ PENDING</span>
								)}
							</div>
						</div>
					</div>
				))}

				{/* Order Notes */}
				{ticket.notes && (
					<div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
						<div className="text-sm font-semibold text-yellow-800">📋 Order Notes:</div>
						<div className="text-sm text-yellow-700 mt-1">{ticket.notes}</div>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="p-4 border-t bg-gray-50 flex flex-wrap gap-2">
				{/* Start Button */}
				{ticket.status === 'PENDING' && (
					<button
						onClick={() => onStartTicket(ticket.id)}
						className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
					>
						🍳 START COOKING
					</button>
				)}

				{/* Mark Ready Button */}
				{ticket.status === 'IN_PROGRESS' && (
					<button
						onClick={() => {
							const readyItemIds = ticket.items
								.filter((item) => item.status !== 'READY')
								.map((item) => item.id)
							onMarkItemsReady(ticket.id, readyItemIds)
						}}
						className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
					>
						✓ MARK READY
					</button>
				)}

				{/* Bump Button */}
				{ticket.status === 'READY' && (
					<button
						onClick={() => onBumpTicket(ticket.id)}
						className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg animate-pulse"
					>
						👋 BUMP
					</button>
				)}

				{/* Priority Buttons */}
				{ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' && (
					<>
						{ticket.priority !== 'FIRE' && (
							<button
								onClick={() => onUpdatePriority(ticket.id, 'FIRE')}
								className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
								title="Mark as FIRE"
							>
								🔥
							</button>
						)}
						{ticket.priority !== 'URGENT' && ticket.priority !== 'FIRE' && (
							<button
								onClick={() => onUpdatePriority(ticket.id, 'URGENT')}
								className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
								title="Mark as URGENT"
							>
								⚠️
							</button>
						)}
					</>
				)}

				{/* Cancel Button */}
				{ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED' && (
					<button
						onClick={() => onCancel(ticket.id)}
						className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
						title="Cancel Ticket"
					>
						✕
					</button>
				)}
			</div>
		</div>
	)
}

export default TicketCard
