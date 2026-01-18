import React from 'react'
import OrderStatusTimeline from './OrderStatusTimeline'

const OrderCard = ({
	order,
	canCancel = false,
	canPay = false,
	onCancelClick,
	onPayClick,
	isCancelling = false,
}) => {
	// Check if order is cancelled
	const isOrderCancelled = order.status === 'CANCELLED'

	// Get status color for order or item status
	const getStatusColor = (status) => {
		switch (status) {
			case 'PENDING':
			case 'RECEIVED':
				return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
			case 'ACCEPTED':
			case 'PREPARING':
				return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
			case 'READY':
			case 'SERVED':
				return 'bg-green-500/20 text-green-400 border-green-500/30'
			case 'REJECTED':
			case 'CANCELLED':
				return 'bg-red-500/20 text-red-400 border-red-500/30'
			default:
				return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
		}
	}

	// Group items by createdAt (each checkout session)
	// Items with same createdAt (within 1 second) belong to same order batch
	// Sorted newest first
	const groupItemsByCreatedAt = (items) => {
		const groups = []
		const sortedItems = [...items].sort(
			(a, b) => new Date(b.createdAt) - new Date(a.createdAt), // Newest first
		)

		sortedItems.forEach((item) => {
			const itemTime = new Date(item.createdAt).getTime()

			// Find existing group within 1 second window
			const existingGroup = groups.find((group) => {
				const groupTime = new Date(group.createdAt).getTime()
				return Math.abs(itemTime - groupTime) < 1000 // 1 second tolerance
			})

			if (existingGroup) {
				existingGroup.items.push(item)
			} else {
				groups.push({
					createdAt: item.createdAt,
					items: [item],
				})
			}
		})

		return groups
	}

	const orderBatches = groupItemsByCreatedAt(order.items)

	// Determine timeline step for a batch of items
	const getBatchTimelineStep = (items) => {
		const statuses = items.map((item) => item.status)

		// If any item is rejected, don't show timeline (show rejection message instead)
		if (statuses.includes('REJECTED')) {
			return null
		}

		// All items served
		if (statuses.every((s) => s === 'SERVED')) {
			return 'Ready' // Show completed timeline
		}

		// Any item preparing or ready
		if (statuses.some((s) => ['PREPARING', 'READY'].includes(s))) {
			return 'Preparing'
		}

		// Any item accepted
		if (statuses.some((s) => s === 'ACCEPTED')) {
			return 'Preparing'
		}

		// All pending
		return 'Received'
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
		<div
			className={`backdrop-blur-xl bg-[#1A202C]/80 rounded-xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-2xl ${
				isOrderCancelled ? 'border-red-500/30 opacity-75' : 'border-white/20'
			}`}
		>
			{/* Cancelled Banner */}
			{isOrderCancelled && (
				<div className="bg-red-500/20 border-b border-red-500/30 px-4 py-3 flex items-center justify-center gap-2">
					<span className="material-symbols-outlined text-red-400">cancel</span>
					<span className="text-red-400 font-medium">Order Cancelled</span>
				</div>
			)}

			{/* Header - Total Amount Only */}
			<div className="p-4 sm:p-6 border-b border-white/10">
				<div className="flex items-center justify-between">
					<div className="text-center flex-1">
						<p className="text-xs text-[#9dabb9]">Total Amount</p>
						<p
							className={`text-xl sm:text-2xl font-bold ${
								isOrderCancelled ? 'text-gray-500 line-through' : 'text-[#4ade80]'
							}`}
						>
							${(order.total || order.totalAmount || 0).toFixed(2)}
						</p>
					</div>

					{/* Cancel Button - Only show if can cancel and not already cancelled */}
					{canCancel && !isOrderCancelled && (
						<button
							onClick={onCancelClick}
							disabled={isCancelling}
							className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 border border-red-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{isCancelling ? (
								<>
									<span className="animate-spin h-4 w-4 border-2 border-red-400/30 border-t-red-400 rounded-full"></span>
									Cancelling...
								</>
							) : (
								<>
									<span className="material-symbols-outlined text-lg">cancel</span>
									Cancel Order
								</>
							)}
						</button>
					)}

					{/* Pay Button - Only show if all items served */}
					{canPay && !isOrderCancelled && (
						<button
							onClick={onPayClick}
							className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 border border-green-500/30 transition-colors text-sm font-medium flex items-center gap-2"
						>
							<span className="material-symbols-outlined text-lg">payments</span>
							Request Payment
						</button>
					)}
				</div>
			</div>

			{/* Items List - Grouped by Checkout Sessions */}
			<div className="divide-y divide-white/10">
				{orderBatches.map((batch, batchIndex) => {
					const timelineStep = getBatchTimelineStep(batch.items)
					const hasRejectedItems = batch.items.some((item) => item.status === 'REJECTED')
					const displayNumber = orderBatches.length - batchIndex // Reverse numbering

					return (
						<div key={`batch-${batchIndex}`} className="p-4 sm:p-6">
							{/* Batch Header */}
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<span className="material-symbols-outlined text-[#9dabb9] text-lg">
										schedule
									</span>
									<p className="text-sm text-[#9dabb9]">
										{batchIndex === orderBatches.length - 1
											? 'Initial Order'
											: `Additional Order #${displayNumber - 1}`}
									</p>
								</div>
								<p className="text-xs text-[#9dabb9]">
									{batch.items.length} item{batch.items.length > 1 ? 's' : ''}
								</p>
							</div>

							{/* Timeline - Only if not rejected */}
							{timelineStep && !hasRejectedItems && (
								<div className="mb-6">
									<OrderStatusTimeline currentStep={timelineStep} />
								</div>
							)}

							{/* Items in this batch */}
							<div className="space-y-3">
								{batch.items.map((item, itemIndex) => {
									const isRejected = item.status === 'REJECTED'
									const isPending = item.status === 'PENDING'
									const isPreparing = ['ACCEPTED', 'PREPARING'].includes(item.status)
									const isReady = item.status === 'READY'
									const isServed = item.status === 'SERVED'

									return (
										<div
											key={`item-${itemIndex}`}
											className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all ${
												isRejected
													? 'bg-red-500/10 border-red-500/20'
													: isPending
														? 'bg-blue-500/10 border-blue-500/20'
														: isPreparing
															? 'bg-yellow-500/10 border-yellow-500/20'
															: isReady
																? 'bg-green-500/10 border-green-500/20'
																: isServed
																	? 'bg-emerald-500/10 border-emerald-500/20 opacity-75'
																	: 'bg-[#2D3748]/50 border-white/10'
											}`}
										>
											<div className="flex-1">
												<div className="flex items-center gap-2 flex-wrap">
													<p className="text-white font-medium text-sm">{item.name}</p>
													<span
														className={`px-2 py-0.5 rounded text-[10px] font-bold ${
															isRejected
																? 'bg-red-500/20 text-red-400'
																: isPending
																	? 'bg-blue-500/20 text-blue-400'
																	: isPreparing
																		? 'bg-yellow-500/20 text-yellow-400'
																		: isReady
																			? 'bg-green-500/20 text-green-400'
																			: isServed
																				? 'bg-emerald-500/20 text-emerald-400'
																				: 'bg-gray-500/20 text-gray-400'
														}`}
													>
														{isRejected
															? '❌ REJECTED'
															: isPending
																? '⏳ PENDING'
																: item.status === 'PREPARING'
																	? '🔥 COOKING'
																	: item.status === 'ACCEPTED'
																		? '✓ CONFIRMED'
																		: isReady
																			? '✓ READY'
																			: isServed
																				? '✓✓ SERVED'
																				: item.status}
													</span>
												</div>

												{/* Rejection Reason */}
												{isRejected && item.rejectionReason && (
													<p className="text-red-300 text-xs mt-1">
														❌ {item.rejectionReason}
													</p>
												)}

												{/* Modifiers */}
												{item.modifiers && item.modifiers.length > 0 && (
													<p className="text-[#9dabb9] text-xs mt-1">
														{Array.isArray(item.modifiers)
															? item.modifiers
																	.map((m) =>
																		typeof m === 'string' ? m : m.optionName || m.name,
																	)
																	.join(', ')
															: ''}
													</p>
												)}

												{/* Special Notes */}
												{item.notes && (
													<p className="text-yellow-400 text-xs mt-1">📝 {item.notes}</p>
												)}
											</div>

											{/* Price */}
											<div className="text-right flex-shrink-0">
												<p
													className={`font-semibold text-sm ${
														isRejected
															? 'text-white line-through opacity-60'
															: 'text-white'
													}`}
												>
													$
													{((item.unitPrice || item.price || 0) * item.quantity).toFixed(
														2,
													)}
												</p>
												<p className="text-[#9dabb9] text-xs">
													{item.quantity} × $
													{(item.unitPrice || item.price || 0).toFixed(2)}
												</p>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default OrderCard
