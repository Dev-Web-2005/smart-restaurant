import React from 'react'
import OrderCard from '../components/OrderCard'

const OrdersPage = ({ orders, loading, tenantId, onBrowseMenu, onRefresh }) => {
	return (
		<div className="p-4 max-w-4xl mx-auto">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-white mb-2">Your Orders</h2>
					<p className="text-[#9dabb9] text-sm">
						Track your order status and view history
					</p>
				</div>
				{onRefresh && (
					<button
						onClick={onRefresh}
						disabled={loading}
						className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
						title="Refresh orders"
					>
						<span
							className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}
						>
							refresh
						</span>
						<span className="hidden sm:inline">Refresh</span>
					</button>
				)}
			</div>

			{loading && orders.length === 0 ? (
				<div className="text-center py-20">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
					<p className="text-[#9dabb9] text-lg">Loading orders...</p>
				</div>
			) : orders.length === 0 ? (
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
						<OrderCard
							key={order.id}
							order={order}
							tenantId={tenantId}
							onRefresh={onRefresh}
						/>
					))}
				</div>
			)}
		</div>
	)
}

export default OrdersPage
