import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { useAlert } from '../../contexts/AlertContext'
import { CardSkeleton } from '../../components/common/LoadingSpinner'

// Mock data for development - Replace with actual API calls
const mockOrders = [
	{
		id: 'ORD-001',
		tableNumber: 5,
		tableName: 'Table 5',
		status: 'PENDING',
		totalAmount: 45.5,
		itemCount: 3,
		createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
		items: [
			{ name: 'Phở Bò Tái', quantity: 2, price: 15.5 },
			{ name: 'Gỏi Cuốn', quantity: 1, price: 14.5 },
		],
	},
	{
		id: 'ORD-002',
		tableNumber: 8,
		tableName: 'Table 8',
		status: 'PREPARING',
		totalAmount: 62.0,
		itemCount: 4,
		createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
		items: [
			{ name: 'Bún Chả Hà Nội', quantity: 2, price: 18.0 },
			{ name: 'Chả Giò', quantity: 2, price: 13.0 },
		],
	},
	{
		id: 'ORD-003',
		tableNumber: 3,
		tableName: 'Table 3',
		status: 'READY',
		totalAmount: 28.0,
		itemCount: 2,
		createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
		items: [
			{ name: 'Cà Phê Sữa Đá', quantity: 2, price: 7.0 },
			{ name: 'Bánh Mì', quantity: 2, price: 7.0 },
		],
	},
]

const mockHelpRequests = [
	{
		id: 'HELP-001',
		tableNumber: 12,
		tableName: 'Table 12',
		message: 'Need more napkins',
		createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
		status: 'PENDING',
		isAcknowledged: false,
	},
	{
		id: 'HELP-002',
		tableNumber: 7,
		tableName: 'Table 7',
		message: 'Requesting bill',
		createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
		status: 'PENDING',
		isAcknowledged: false,
	},
]

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
	const now = Date.now()
	const diff = now - timestamp
	const minutes = Math.floor(diff / 60000)
	const hours = Math.floor(minutes / 60)

	if (minutes < 1) return 'Just now'
	if (minutes < 60) return `${minutes}m ago`
	return `${hours}h ${minutes % 60}m ago`
}

// Helper function to get full date time
const getFullDateTime = (timestamp) => {
	return new Date(timestamp).toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

/**
 * Waiter Panel - For Staff role
 *
 * Features:
 * - View pending orders
 * - Accept/Reject orders
 * - View help requests from customers
 * - Mark orders as served
 * - Real-time updates via WebSocket
 */
const WaiterPanel = () => {
	const { user, logout } = useUser()
	const { showSuccess } = useAlert()
	const navigate = useNavigate()
	const { ownerId } = useParams()

	// State
	const [orders, setOrders] = useState(mockOrders)
	const [helpRequests, setHelpRequests] = useState(mockHelpRequests)
	const [selectedView, setSelectedView] = useState('orders') // 'orders' | 'help'
	const [filter, setFilter] = useState('ALL') // ALL, PENDING, PREPARING, READY
	const [loading, setLoading] = useState(true)

	// Simulating data load
	useEffect(() => {
		setTimeout(() => {
			setLoading(false)
		}, 500)
	}, [])

	// Handle logout
	const handleLogout = () => {
		logout()
		if (ownerId) {
			navigate(`/login/${ownerId}`)
		} else {
			navigate('/login')
		}
	}

	// Accept order
	const handleAcceptOrder = (orderId) => {
		setOrders((prev) =>
			prev.map((order) =>
				order.id === orderId ? { ...order, status: 'PREPARING' } : order,
			),
		)
		showSuccess('Order Accepted', `Order ${orderId} is now being prepared`)
	}

	// Mark order as served
	const handleServeOrder = (orderId) => {
		setOrders((prev) =>
			prev.map((order) =>
				order.id === orderId ? { ...order, status: 'SERVED' } : order,
			),
		)
		showSuccess('Order Served', `Order ${orderId} has been served`)
	}

	// Handle help request
	const handleResolveHelp = (helpId) => {
		setHelpRequests((prev) =>
			prev.map((req) => (req.id === helpId ? { ...req, isAcknowledged: true } : req)),
		)
		showSuccess('Request Resolved', 'Help request has been acknowledged')
	}

	// Filter orders
	const filteredOrders = orders.filter((order) => {
		if (filter === 'ALL') return order.status !== 'SERVED'
		return order.status === filter
	})

	// Filter help requests - show only unacknowledged by default
	const filteredHelpRequests = helpRequests.filter((req) => !req.isAcknowledged)
	const newHelpRequestsCount = filteredHelpRequests.length

	// Stats
	const stats = {
		pending: orders.filter((o) => o.status === 'PENDING').length,
		preparing: orders.filter((o) => o.status === 'PREPARING').length,
		ready: orders.filter((o) => o.status === 'READY').length,
		helpRequests: newHelpRequestsCount,
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-[#101922] flex items-center justify-center">
				<CardSkeleton />
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-[#101922] text-white">
			{/* Top Navigation Bar */}
			<nav className="bg-black/40 backdrop-blur-md border-b border-white/10">
				<div className="max-w-7xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-blue-400 text-3xl">
								restaurant
							</span>
							<h1 className="text-white text-2xl font-bold">Waiter Panel</h1>
						</div>

						<div className="flex items-center gap-4">
							<div className="text-right">
								<p className="text-white font-medium">{user?.name || 'Waiter'}</p>
								<p className="text-sm text-gray-400">{user?.email || 'Staff'}</p>
							</div>
							<button
								onClick={handleLogout}
								className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/50 rounded-lg font-medium transition-colors flex items-center gap-2"
							>
								<span className="material-symbols-outlined">logout</span>
								Logout
							</button>
						</div>
					</div>
				</div>
			</nav>

			{/* Main Content Area */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
					<div className="bg-yellow-500/20 backdrop-blur-md rounded-lg p-4 border border-yellow-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-yellow-400 text-3xl">
								pending
							</span>
							<div>
								<p className="text-yellow-400 text-sm font-medium">Pending Orders</p>
								<p className="text-white text-2xl font-bold">{stats.pending}</p>
							</div>
						</div>
					</div>

					<div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-4 border border-blue-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-blue-400 text-3xl">
								cooking
							</span>
							<div>
								<p className="text-blue-400 text-sm font-medium">Preparing</p>
								<p className="text-white text-2xl font-bold">{stats.preparing}</p>
							</div>
						</div>
					</div>

					<div className="bg-green-500/20 backdrop-blur-md rounded-lg p-4 border border-green-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-green-400 text-3xl">
								check_circle
							</span>
							<div>
								<p className="text-green-400 text-sm font-medium">Ready to Serve</p>
								<p className="text-white text-2xl font-bold">{stats.ready}</p>
							</div>
						</div>
					</div>

					<div className="bg-red-500/20 backdrop-blur-md rounded-lg p-4 border border-red-500/30">
						<div className="flex items-center gap-3">
							<span className="material-symbols-outlined text-red-400 text-3xl">
								help
							</span>
							<div>
								<p className="text-red-400 text-sm font-medium">Help Requests</p>
								<p className="text-white text-2xl font-bold">{stats.helpRequests}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 mb-6 bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10">
					<button
						onClick={() => setSelectedView('orders')}
						className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
							selectedView === 'orders'
								? 'bg-blue-500 text-white shadow-lg'
								: 'text-gray-400 hover:text-white hover:bg-white/5'
						}`}
					>
						<span className="material-symbols-outlined text-sm">receipt_long</span>
						Orders
					</button>
					<button
						onClick={() => setSelectedView('help')}
						className={`relative flex-1 py-3 px-4 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
							selectedView === 'help'
								? 'bg-red-500 text-white shadow-lg'
								: 'text-gray-400 hover:text-white hover:bg-white/5'
						}`}
					>
						<span className="material-symbols-outlined text-sm">help</span>
						Help Requests
						{stats.helpRequests > 0 && (
							<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 shadow-lg">
								{stats.helpRequests}
							</span>
						)}
					</button>
				</div>

				{/* Orders View */}
				{selectedView === 'orders' && (
					<div className="space-y-6">
						{/* Filter Buttons */}
						<div className="flex gap-2">
							{['ALL', 'PENDING', 'PREPARING', 'READY'].map((f) => (
								<button
									key={f}
									onClick={() => setFilter(f)}
									className={`px-4 py-2 rounded-lg font-medium transition-colors ${
										filter === f
											? 'bg-blue-500 text-white'
											: 'bg-white/10 text-gray-300 hover:bg-white/20'
									}`}
								>
									{f === 'ALL' ? 'All Active' : f}
								</button>
							))}
						</div>

						{/* Orders Grid */}
						{filteredOrders.length === 0 ? (
							<div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-12 text-center">
								<span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
									receipt_long
								</span>
								<p className="text-gray-400 text-lg">No orders to handle</p>
								<p className="text-gray-500 mt-2">All caught up!</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{filteredOrders.map((order) => {
									const statusColors = {
										PENDING: 'border-yellow-500/50 bg-yellow-500/5',
										PREPARING: 'border-blue-500/50 bg-blue-500/5',
										READY: 'border-green-500/50 bg-green-500/5',
									}

									return (
										<div
											key={order.id}
											className={`bg-white/10 backdrop-blur-md rounded-lg border overflow-hidden ${
												statusColors[order.status] || 'border-white/20'
											}`}
										>
											{/* Order Header */}
											<div className="p-4 border-b border-white/10">
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center gap-2">
														<span className="material-symbols-outlined text-blue-400">
															table_restaurant
														</span>
														<h3 className="text-white text-lg font-bold">
															{order.tableName}
														</h3>
													</div>
													<span
														className={`px-2 py-1 rounded text-xs font-medium ${
															order.status === 'PENDING'
																? 'bg-yellow-500/20 text-yellow-300'
																: order.status === 'PREPARING'
																? 'bg-blue-500/20 text-blue-300'
																: 'bg-green-500/20 text-green-300'
														}`}
													>
														{order.status}
													</span>
												</div>
												<p className="text-sm text-gray-400">Order #{order.id}</p>
											</div>

											{/* Order Content */}
											<div className="p-4">
												<div className="flex justify-between items-start mb-3">
													<div>
														<p className="text-sm text-gray-400">Items</p>
														<p className="text-lg font-bold text-white">
															{order.itemCount}
														</p>
													</div>
													<div className="text-right">
														<p className="text-sm text-gray-400">Total</p>
														<p className="text-xl font-bold text-blue-400">
															${order.totalAmount.toFixed(2)}
														</p>
													</div>
												</div>

												{/* Items Preview */}
												<div className="bg-black/40 rounded-lg p-3 mb-3 space-y-2">
													{order.items.map((item, idx) => (
														<div key={idx} className="flex justify-between text-sm">
															<span className="text-gray-300">
																{item.quantity}x {item.name}
															</span>
															<span className="text-gray-400">
																${(item.price * item.quantity).toFixed(2)}
															</span>
														</div>
													))}
												</div>

												{/* Timestamp */}
												<div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
													<span className="material-symbols-outlined text-sm">
														schedule
													</span>
													<span>
														{formatTimestamp(new Date(order.createdAt).getTime())}
													</span>
												</div>

												{/* Actions */}
												<div className="flex gap-2">
													{order.status === 'PENDING' && (
														<button
															onClick={() => handleAcceptOrder(order.id)}
															className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-400/50 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
														>
															<span className="material-symbols-outlined text-base">
																check
															</span>
															Accept
														</button>
													)}
													{order.status === 'READY' && (
														<button
															onClick={() => handleServeOrder(order.id)}
															className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-400/50 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
														>
															<span className="material-symbols-outlined text-base">
																check_circle
															</span>
															Mark Served
														</button>
													)}
													{order.status === 'PREPARING' && (
														<div className="flex-1 bg-blue-500/20 text-blue-300 py-2 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
															<span className="material-symbols-outlined text-base">
																cooking
															</span>
															Being Prepared...
														</div>
													)}
												</div>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</div>
				)}

				{/* Help Requests View */}
				{selectedView === 'help' && (
					<div className="space-y-4">
						{filteredHelpRequests.length === 0 ? (
							<div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-12 text-center">
								<span className="material-symbols-outlined text-gray-400 text-6xl mb-4">
									notifications_off
								</span>
								<p className="text-gray-400 text-lg">No new help requests</p>
								<p className="text-gray-500 mt-2">Customers are happy!</p>
							</div>
						) : (
							filteredHelpRequests.map((request) => (
								<div
									key={request.id}
									className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-yellow-500/50 shadow-lg shadow-yellow-500/10"
								>
									<div className="flex items-start justify-between gap-4">
										{/* Left: Info */}
										<div className="flex-1 space-y-2">
											{/* Table Name */}
											<div className="flex items-center gap-2">
												<span className="material-symbols-outlined text-blue-400">
													table_restaurant
												</span>
												<h3 className="text-white text-lg font-bold m-0">
													{request.tableName}
												</h3>
												<span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/50">
													NEW
												</span>
											</div>

											{/* Message */}
											<p className="text-gray-300 text-sm">{request.message}</p>

											{/* Timestamp */}
											<div className="flex items-center gap-2 text-xs text-gray-400">
												<span className="material-symbols-outlined text-sm">
													schedule
												</span>
												<span>
													{getFullDateTime(new Date(request.createdAt).getTime())}
												</span>
												<span className="text-gray-500">•</span>
												<span className="text-yellow-400 font-semibold">
													{formatTimestamp(new Date(request.createdAt).getTime())}
												</span>
											</div>
										</div>

										{/* Right: Action Button */}
										<div className="flex flex-col items-end gap-2">
											<button
												onClick={() => handleResolveHelp(request.id)}
												className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-400/50 rounded-lg transition-colors hover:bg-green-500/30 active:scale-95"
												title="Acknowledge request"
											>
												<span className="material-symbols-outlined">check_circle</span>
												<span className="font-semibold text-sm">Acknowledge</span>
											</button>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default WaiterPanel
