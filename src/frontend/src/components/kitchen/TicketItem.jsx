import React from 'react'
import PropTypes from 'prop-types'

/**
 * TicketItem Component
 *
 * Displays a single order item within a kitchen ticket
 * Shows item name, quantity, modifiers, and special instructions
 */
const TicketItem = ({ item, onToggleStatus, isCompact = false }) => {
	const getStatusColor = (status) => {
		switch (status) {
			case 'PENDING':
				return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
			case 'ACCEPTED':
				return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
			case 'PREPARING':
				return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
			case 'READY':
				return 'bg-green-500/20 text-green-300 border-green-500/30'
			case 'SERVED':
				return 'bg-gray-500/10 text-gray-500 border-gray-500/20 line-through'
			default:
				return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
		}
	}

	const getStatusIcon = (status) => {
		switch (status) {
			case 'PENDING':
				return '⏳'
			case 'ACCEPTED':
				return '📋'
			case 'PREPARING':
				return '🍳'
			case 'READY':
				return '✅'
			case 'SERVED':
				return '🍽️'
			default:
				return '📄'
		}
	}

	if (isCompact) {
		return (
			<div
				className={`flex items-center justify-between p-2 rounded-lg border transition-all ${getStatusColor(
					item.status,
				)}`}
				onClick={() => onToggleStatus && onToggleStatus(item)}
			>
				<div className="flex items-center gap-2 flex-1 min-w-0">
					<span className="text-lg flex-shrink-0">{getStatusIcon(item.status)}</span>
					<span className="font-semibold text-sm truncate">
						{item.quantity}x {item.itemName || item.name}
					</span>
				</div>
				{item.specialInstructions && (
					<span className="text-xs text-red-400 font-medium ml-2 flex-shrink-0">⚠️</span>
				)}
			</div>
		)
	}

	return (
		<div
			className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-white/5 ${getStatusColor(
				item.status,
			)}`}
			onClick={() => onToggleStatus && onToggleStatus(item)}
		>
			{/* Header with quantity and name */}
			<div className="flex items-start justify-between mb-2 gap-2">
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<span className="text-xl flex-shrink-0">{getStatusIcon(item.status)}</span>
					<div className="min-w-0">
						<div className="font-bold text-base text-white truncate">
							{item.quantity}x {item.itemName || item.name}
						</div>
						<div className="text-xs text-gray-400">{item.status.replace('_', ' ')}</div>
					</div>
				</div>
				{item.price && (
					<div className="text-sm font-semibold text-gray-400 flex-shrink-0">
						${(item.price * item.quantity).toFixed(2)}
					</div>
				)}
			</div>

			{/* Modifiers */}
			{item.modifiers && item.modifiers.length > 0 && (
				<div className="mb-2 pl-8">
					{item.modifiers.map((modifier, idx) => (
						<div key={idx} className="text-sm text-gray-400">
							• {modifier.name || modifier.modifierName}
							{modifier.options && modifier.options.length > 0 && (
								<span className="ml-1">
									({modifier.options.map((opt) => opt.name || opt.optionName).join(', ')})
								</span>
							)}
						</div>
					))}
				</div>
			)}

			{/* Special Instructions */}
			{item.specialInstructions && (
				<div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-sm">
					<div className="font-semibold text-red-400 mb-1">⚠️ Special Instructions:</div>
					<div className="text-red-300">{item.specialInstructions}</div>
				</div>
			)}

			{/* Notes */}
			{item.notes && (
				<div className="mt-2 text-xs text-gray-500 italic">Note: {item.notes}</div>
			)}
		</div>
	)
}

TicketItem.propTypes = {
	item: PropTypes.shape({
		id: PropTypes.string,
		itemId: PropTypes.string,
		itemName: PropTypes.string,
		name: PropTypes.string,
		quantity: PropTypes.number.isRequired,
		status: PropTypes.string.isRequired,
		price: PropTypes.number,
		modifiers: PropTypes.array,
		specialInstructions: PropTypes.string,
		notes: PropTypes.string,
	}).isRequired,
	onToggleStatus: PropTypes.func,
	isCompact: PropTypes.bool,
}

export default TicketItem
