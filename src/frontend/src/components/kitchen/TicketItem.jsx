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
				return 'bg-gray-100 text-gray-700 border-gray-300'
			case 'ACCEPTED':
				return 'bg-blue-100 text-blue-700 border-blue-300'
			case 'PREPARING':
				return 'bg-yellow-100 text-yellow-700 border-yellow-400'
			case 'READY':
				return 'bg-green-100 text-green-700 border-green-400'
			case 'SERVED':
				return 'bg-gray-50 text-gray-500 border-gray-200 line-through'
			default:
				return 'bg-gray-100 text-gray-700 border-gray-300'
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
				className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all ${getStatusColor(
					item.status,
				)}`}
				onClick={() => onToggleStatus && onToggleStatus(item)}
			>
				<div className="flex items-center gap-2 flex-1">
					<span className="text-lg">{getStatusIcon(item.status)}</span>
					<span className="font-semibold text-sm">
						{item.quantity}x {item.itemName || item.name}
					</span>
				</div>
				{item.specialInstructions && (
					<span className="text-xs text-red-600 font-medium ml-2">⚠️</span>
				)}
			</div>
		)
	}

	return (
		<div
			className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${getStatusColor(
				item.status,
			)}`}
			onClick={() => onToggleStatus && onToggleStatus(item)}
		>
			{/* Header with quantity and name */}
			<div className="flex items-start justify-between mb-2">
				<div className="flex items-center gap-2">
					<span className="text-2xl">{getStatusIcon(item.status)}</span>
					<div>
						<div className="font-bold text-lg">
							{item.quantity}x {item.itemName || item.name}
						</div>
						<div className="text-xs opacity-75">{item.status.replace('_', ' ')}</div>
					</div>
				</div>
				{item.price && (
					<div className="text-sm font-semibold">
						${(item.price * item.quantity).toFixed(2)}
					</div>
				)}
			</div>

			{/* Modifiers */}
			{item.modifiers && item.modifiers.length > 0 && (
				<div className="mb-2 pl-8">
					{item.modifiers.map((modifier, idx) => (
						<div key={idx} className="text-sm opacity-90">
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
				<div className="mt-2 p-2 bg-red-50 border border-red-300 rounded text-sm">
					<div className="font-semibold text-red-700 mb-1">⚠️ Special Instructions:</div>
					<div className="text-red-900">{item.specialInstructions}</div>
				</div>
			)}

			{/* Notes */}
			{item.notes && (
				<div className="mt-2 text-xs opacity-75 italic">Note: {item.notes}</div>
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
