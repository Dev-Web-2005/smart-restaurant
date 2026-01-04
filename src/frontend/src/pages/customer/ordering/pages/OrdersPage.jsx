import React from 'react'
import OrderCard from '../components/OrderCard'

const OrdersPage = ({ orders, onBrowseMenu }) => {
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
					{orders.map((order) => (
						<OrderCard key={order.id} order={order} />
					))}
				</div>
			)}
		</div>
	)
}

export default OrdersPage
