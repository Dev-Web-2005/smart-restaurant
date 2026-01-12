import React, { useState } from 'react'
import OrderStatusTimeline from './OrderStatusTimeline'
import { updateOrderItemsStatusAPI } from '../../../../services/api/orderAPI'

const OrderCard = ({ order, tenantId, onRefresh }) => {
	const [cancelling, setCancelling] = useState(null) // Track which item is being cancelled

	const getStatusColor = (status) => {
		switch (status) {
			case 'PENDING':
			case 'RECEIVED':
				return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
			case 'ACCEPTED':
				return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
			case 'PREPARING':
				return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
			case 'READY':
				return 'bg-green-500/20 text-green-400 border-green-500/30'
			case 'SERVED':
				return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
			case 'REJECTED':
			case 'CANCELLED':
				return 'bg-red-500/20 text-red-400 border-red-500/30'
			default:
				return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
		}
	}

	const getItemStatusLabel = (status) => {
		const labels = {
			PENDING: 'Pending',
			ACCEPTED: 'Accepted',
			PREPARING: 'Preparing',
			READY: 'Ready',
			SERVED: 'Served',
			REJECTED: 'Rejected',
			CANCELLED: 'Cancelled',
		}
		return labels[status] || status
	}

	const canCancelItem = (itemStatus) => {
		// Customer can only cancel items that haven't started preparing
		return itemStatus === 'PENDING' || itemStatus === 'ACCEPTED'
	}

	const handleCancelItem = async (itemId, itemName) => {
		if (!tenantId || !order.id) {
			alert('Missing order information')
			return
		}

		const confirmed = window.confirm(
			`Are you sure you want to cancel "${itemName}"?\n\nThis action cannot be undone.`,
		)

		if (!confirmed) return

		setCancelling(itemId)

		try {
			console.log('🚫 Cancelling item:', { orderId: order.id, itemId })

			const result = await updateOrderItemsStatusAPI(tenantId, order.id, {
				itemIds: [itemId],
				status: 'CANCELLED',
			})

			if (result.success) {
				console.log('✅ Item cancelled successfully')
				alert(`"${itemName}" has been cancelled`)

				// Refresh orders to show updated status
				if (onRefresh) {
					onRefresh()
				}
			} else {
				console.error('❌ Failed to cancel item:', result.message)
				alert(`Failed to cancel item: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Cancel item error:', error)
			alert('Failed to cancel item. Please try again.')
		} finally {
			setCancelling(null)
		}
	}

	const formatDate = (dateString) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffMs = now - date
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMs / 3600000)
		const diffDays = Math.floor(diffMs / 86400000)

		if (diffMins < 1) return 'Just now'
		if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
		if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
		if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
		})
	}

	return (
		<div className="backdrop-blur-xl bg-[#1A202C]/80 rounded-xl shadow-lg border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
			{/* Header */}
			<div className="p-4 sm:p-6 border-b border-white/10">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex-1">
						<div className="flex items-center gap-3 flex-wrap">
							<h3 className="text-base sm:text-lg font-bold text-white">
								Order {order.id}
							</h3>
							<span
								className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${getStatusColor(
									order.status,
								)}`}
							>
								{order.status}
							</span>
						</div>
						<p className="text-[#9dabb9] text-xs sm:text-sm mt-1">
							{formatDate(order.createdAt)}
						</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-[#9dabb9]">Total Amount</p>
						<p className="text-xl sm:text-2xl font-bold text-[#4ade80]">
							${order.totalAmount.toFixed(2)}
						</p>
					</div>
				</div>
			</div>

			{/* Timeline - Only for non-rejected orders */}
			{order.status !== 'REJECTED' && order.currentStep && (
				<div className="px-4 sm:px-6 py-2 bg-[#2D3748]/30">
					<OrderStatusTimeline currentStep={order.currentStep} />
				</div>
			)}

			{/* Rejection Reason */}
			{order.status === 'REJECTED' && order.rejectionReason && (
				<div className="px-4 sm:px-6 py-4 bg-red-500/10 border-t border-red-500/20">
					<div className="flex items-start gap-3">
						<span className="material-symbols-outlined text-red-400 text-xl flex-shrink-0">
							error
						</span>
						<div>
							<p className="text-red-400 font-semibold text-sm">Order Rejected</p>
							<p className="text-red-300 text-xs mt-1">{order.rejectionReason}</p>
						</div>
					</div>
				</div>
			)}

			{/* Items List */}
			<div className="p-4 sm:p-6">
				<h4 className="text-sm font-semibold text-white mb-3">Order Items</h4>
				<div className="space-y-2">
					{order.items.map((item, index) => (
						<div
							key={index}
							className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#2D3748]/50"
						>
							<div className="flex-1">
								<div className="flex items-start gap-2 mb-1">
									<p className="text-white font-medium text-sm flex-1">{item.name}</p>
									{item.status && (
										<span
											className={`px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${getStatusColor(
												item.status,
											)}`}
										>
											{getItemStatusLabel(item.status)}
										</span>
									)}
								</div>
								{item.modifiers && item.modifiers.length > 0 && (
									<p className="text-[#9dabb9] text-xs mt-1">
										{item.modifiers.join(', ')}
									</p>
								)}
								{item.rejectionReason && (
									<p className="text-red-400 text-xs mt-1 italic">
										❌ {item.rejectionReason}
									</p>
								)}
								{/* Cancel button for pending/accepted items */}
								{canCancelItem(item.status) && (
									<button
										onClick={() => handleCancelItem(item.id, item.name)}
										disabled={cancelling === item.id}
										className="mt-2 text-xs text-red-400 hover:text-red-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{cancelling === item.id ? 'Cancelling...' : 'Cancel this item'}
									</button>
								)}
							</div>
							<div className="text-right flex-shrink-0">
								<p className="text-white font-semibold text-sm">
									${(item.price * item.quantity).toFixed(2)}
								</p>
								<p className="text-[#9dabb9] text-xs">
									{item.quantity} × ${item.price.toFixed(2)}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default OrderCard
