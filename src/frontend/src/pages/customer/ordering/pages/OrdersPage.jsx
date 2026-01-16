import React from 'react'
import OrderCard from '../components/OrderCard'

/**
 * Map backend order to customer-friendly display format
 * Logic:
 * - All items PENDING → Status: "Pending" (waiting for staff acceptance)
 * - At least one item ACCEPTED/PREPARING/READY → Status: "Preparing" (being prepared)
 * - All items SERVED → Status: "Ready" (all items delivered)
 * - Any item REJECTED → Status: "Rejected"
 */
const mapOrderForCustomer = (order) => {
	if (!order || !order.items || order.items.length === 0) {
		return order
	}

	const items = order.items

	// Check if any item is rejected
	const hasRejected = items.some((item) => item.status === 'REJECTED')
	if (hasRejected) {
		const rejectedItems = items.filter((item) => item.status === 'REJECTED')
		return {
			...order,
			status: 'REJECTED',
			currentStep: null,
			rejectionReason: rejectedItems
				.map((item) => `${item.name}: ${item.rejectionReason || 'Not available'}`)
				.join('; '),
		}
	}

	// Check if all items are served
	const allServed = items.every((item) => item.status === 'SERVED')
	if (allServed) {
		return {
			...order,
			status: 'READY',
			currentStep: 'Ready',
		}
	}

	// Check if any item is being prepared (ACCEPTED, PREPARING, or READY but not all served)
	const hasAcceptedOrPreparing = items.some((item) =>
		['ACCEPTED', 'PREPARING', 'READY', 'SERVED'].includes(item.status),
	)
	if (hasAcceptedOrPreparing) {
		return {
			...order,
			status: 'PREPARING',
			currentStep: 'Preparing',
		}
	}

	// All items still pending
	return {
		...order,
		status: 'RECEIVED',
		currentStep: 'Received',
	}
}

const OrdersPage = ({ orders, loading = false, onBrowseMenu }) => {
	// Map orders to customer-friendly format
	const displayOrders = orders.map(mapOrderForCustomer)

	// Show loading state
	if (loading) {
		return (
			<div className="p-4 max-w-4xl mx-auto">
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-white mb-2">Your Orders</h2>
					<p className="text-[#9dabb9] text-sm">
						Track your order status and view history
					</p>
				</div>
				<div className="text-center py-20">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#137fec]"></div>
					<p className="text-[#9dabb9] text-lg mt-4">Loading orders...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-white mb-2">Your Orders</h2>
				<p className="text-[#9dabb9] text-sm">Track your order status and view history</p>
			</div>

			{orders.length === 0 ? (
				<div className="text-center py-20">
					<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4 block">
						receipt_long
					</span>
					<p className="text-[#9dabb9] text-lg">No orders yet</p>
					{onBrowseMenu && (
						<button
							onClick={onBrowseMenu}
							className="mt-6 px-6 py-3 bg-[#137fec] text-white rounded-lg hover:bg-blue-600 transition-colors"
						>
							Browse Menu
						</button>
					)}
				</div>
			) : (
				<div className="space-y-4">
					{displayOrders.map((order) => (
						<OrderCard key={order.id} order={order} />
					))}
				</div>
			)}
		</div>
	)
}

export default OrdersPage
