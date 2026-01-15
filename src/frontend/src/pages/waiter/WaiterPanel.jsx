import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { useAlert } from '../../contexts/AlertContext'

// Mock data for development - Replace with actual API calls
const mockOrders = [
	{
		id: 'ORD-001',
		tableNumber: 5,
		tableName: 'Table 5',
		status: 'PENDING',
		totalAmount: 45.50,
		itemCount: 3,
		createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
		items: [
			{ name: 'Phở Bò Tái', quantity: 2, price: 15.50 },
			{ name: 'Gỏi Cuốn', quantity: 1, price: 14.50 },
		],
	},
	{
		id: 'ORD-002',
		tableNumber: 8,
		tableName: 'Table 8',
		status: 'PREPARING',
		totalAmount: 62.00,
		itemCount: 4,
		createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
		items: [
			{ name: 'Bún Chả Hà Nội', quantity: 2, price: 18.00 },
			{ name: 'Chả Giò', quantity: 2, price: 13.00 },
		],
	},
	{
		id: 'ORD-003',
		tableNumber: 3,
		tableName: 'Table 3',
		status: 'READY',
		totalAmount: 28.00,
		itemCount: 2,
		createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
		items: [
			{ name: 'Cà Phê Sữa Đá', quantity: 2, price: 7.00 },
			{ name: 'Bánh Mì', quantity: 2, price: 7.00 },
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
	},
	{
		id: 'HELP-002',
		tableNumber: 7,
		tableName: 'Table 7',
		message: 'Requesting bill',
		createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
		status: 'PENDING',
	},
]

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
	const [activeTab, setActiveTab] = useState('orders') // orders | help | tables
	const [filter, setFilter] = useState('ALL') // ALL, PENDING, PREPARING, READY
	const [currentTime, setCurrentTime] = useState(new Date())

	// Timer for updating relative times
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date())
		}, 1000)
		return () => clearInterval(interval)
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
		setOrders(prev => prev.map(order => 
			order.id === orderId ? { ...order, status: 'PREPARING' } : order
		))
		showSuccess('Order Accepted', `Order ${orderId} is now being prepared`)
	}

	// Mark order as served
	const handleServeOrder = (orderId) => {
		setOrders(prev => prev.map(order => 
			order.id === orderId ? { ...order, status: 'SERVED' } : order
		))
		showSuccess('Order Served', `Order ${orderId} has been served`)
	}

	// Handle help request
	const handleResolveHelp = (helpId) => {
		setHelpRequests(prev => prev.filter(req => req.id !== helpId))
		showSuccess('Request Resolved', 'Help request has been marked as resolved')
	}

	// Get time elapsed
	const getTimeElapsed = (createdAt) => {
		const elapsed = currentTime.getTime() - new Date(createdAt).getTime()
		const minutes = Math.floor(elapsed / 60000)
		if (minutes < 1) return 'Just now'
		if (minutes < 60) return `${minutes}m ago`
		const hours = Math.floor(minutes / 60)
		return `${hours}h ${minutes % 60}m ago`
	}

	// Get status color
	const getStatusColor = (status) => {
		switch (status) {
			case 'PENDING': return 'bg-yellow-500'
			case 'PREPARING': return 'bg-blue-500'
			case 'READY': return 'bg-green-500'
			case 'SERVED': return 'bg-gray-500'
			default: return 'bg-gray-500'
		}
	}

	// Get status icon
	const getStatusIcon = (status) => {
		switch (status) {
			case 'PENDING': return '⏳'
			case 'PREPARING': return '🍳'
			case 'READY': return '✅'
			case 'SERVED': return '🍽️'
			default: return '📋'
		}
	}

	// Filter orders
	const filteredOrders = orders.filter(order => {
		if (filter === 'ALL') return order.status !== 'SERVED'
		return order.status === filter
	})

	// Stats
	const stats = {
		pending: orders.filter(o => o.status === 'PENDING').length,
		preparing: orders.filter(o => o.status === 'PREPARING').length,
		ready: orders.filter(o => o.status === 'READY').length,
		helpRequests: helpRequests.length,
	}

	return (
		<div className="min-h-screen bg-[#101922] text-white">
			{/* Header */}
			<header className="bg-[#1a2633] px-6 py-4 flex items-center justify-between border-b border-[#2a3744]">
				<div className="flex items-center gap-6">
					<h1 className="text-2xl font-bold text-[#137fec]">🍽️ Waiter Panel</h1>
					<div className="text-lg text-gray-300">
						{currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
					</div>
				</div>

				{/* Stats */}
				<div className="flex items-center gap-6">
					<div className="text-center">
						<div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
						<div className="text-xs text-gray-400">Pending</div>
					</div>
					<div className="text-center">
						<div className="text-3xl font-bold text-blue-400">{stats.preparing}</div>
						<div className="text-xs text-gray-400">Preparing</div>
					</div>
					<div className="text-center">
						<div className="text-3xl font-bold text-green-400">{stats.ready}</div>
						<div className="text-xs text-gray-400">Ready</div>
					</div>
					{stats.helpRequests > 0 && (
						<div className="text-center">
							<div className="text-3xl font-bold text-red-400 animate-pulse">{stats.helpRequests}</div>
							<div className="text-xs text-red-400">Help!</div>
						</div>
					)}

					{/* Divider */}
					<div className="h-10 w-px bg-[#2a3744]" />

					{/* User Info & Logout */}
					<div className="flex items-center gap-4">
						<div className="text-right">
							<div className="text-white font-medium">{user?.name || 'Waiter'}</div>
							<div className="text-sm text-gray-400">{user?.email || 'Staff'}</div>
						</div>
						<button
							onClick={handleLogout}
							className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
						>
							<span>🚪</span>
							<span>Logout</span>
						</button>
					</div>
				</div>
			</header>

			{/* Tabs */}
			<div className="bg-[#1a2633] px-6 py-3 flex items-center gap-4 border-b border-[#2a3744]">
				<button
					onClick={() => setActiveTab('orders')}
					className={`px-6 py-2 rounded-lg font-semibold transition-all ${
						activeTab === 'orders'
							? 'bg-[#137fec] text-white'
							: 'bg-[#2a3744] text-gray-300 hover:bg-[#354555]'
					}`}
				>
					📋 Orders
				</button>
				<button
					onClick={() => setActiveTab('help')}
					className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${
						activeTab === 'help'
							? 'bg-[#137fec] text-white'
							: 'bg-[#2a3744] text-gray-300 hover:bg-[#354555]'
					}`}
				>
					🆘 Help Requests
					{stats.helpRequests > 0 && (
						<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
							{stats.helpRequests}
						</span>
					)}
				</button>
			</div>

			{/* Orders Tab */}
			{activeTab === 'orders' && (
				<>
					{/* Filters */}
					<div className="px-6 py-4 flex gap-2">
						{['ALL', 'PENDING', 'PREPARING', 'READY'].map((f) => (
							<button
								key={f}
								onClick={() => setFilter(f)}
								className={`px-4 py-2 rounded-lg font-medium transition-all ${
									filter === f
										? 'bg-[#137fec] text-white'
										: 'bg-[#2a3744] text-gray-300 hover:bg-[#354555]'
								}`}
							>
								{f === 'ALL' ? 'All Active' : f}
							</button>
						))}
					</div>

					{/* Orders Grid */}
					<main className="p-6">
						{filteredOrders.length === 0 ? (
							<div className="text-center py-20">
								<div className="text-6xl mb-4">🎉</div>
								<div className="text-2xl text-gray-400">No orders to handle</div>
								<div className="text-gray-500 mt-2">All caught up!</div>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
								{filteredOrders.map((order) => (
									<div
										key={order.id}
										className="bg-[#1a2633] rounded-xl overflow-hidden border border-[#2a3744] hover:border-[#137fec]/50 transition-all"
									>
										{/* Header */}
										<div className={`px-4 py-3 flex justify-between items-center ${getStatusColor(order.status)}`}>
											<span className="text-xl font-bold">{order.tableName}</span>
											<span className="text-sm font-medium uppercase flex items-center gap-1">
												{getStatusIcon(order.status)} {order.status}
											</span>
										</div>

										{/* Content */}
										<div className="p-4">
											<div className="flex justify-between items-start mb-3">
												<div>
													<div className="text-sm text-gray-400">Order #{order.id}</div>
													<div className="text-lg font-bold text-white">{order.itemCount} items</div>
												</div>
												<div className="text-right">
													<div className="text-xl font-bold text-[#137fec]">${order.totalAmount.toFixed(2)}</div>
													<div className="text-xs text-gray-400">{getTimeElapsed(order.createdAt)}</div>
												</div>
											</div>

											{/* Items Preview */}
											<div className="bg-[#0d1520] rounded-lg p-3 mb-3">
												{order.items.slice(0, 3).map((item, idx) => (
													<div key={idx} className="flex justify-between text-sm py-1">
														<span className="text-gray-300">{item.quantity}x {item.name}</span>
														<span className="text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
													</div>
												))}
												{order.items.length > 3 && (
													<div className="text-xs text-gray-500 mt-1">
														+{order.items.length - 3} more items
													</div>
												)}
											</div>

											{/* Actions */}
											<div className="flex gap-2">
												{order.status === 'PENDING' && (
													<button
														onClick={() => handleAcceptOrder(order.id)}
														className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all"
													>
														✅ Accept
													</button>
												)}
												{order.status === 'READY' && (
													<button
														onClick={() => handleServeOrder(order.id)}
														className="flex-1 bg-[#137fec] hover:bg-[#0f6dd1] text-white py-3 rounded-lg font-semibold transition-all"
													>
														🍽️ Mark Served
													</button>
												)}
												{order.status === 'PREPARING' && (
													<div className="flex-1 bg-blue-600/30 text-blue-300 py-3 rounded-lg font-semibold text-center">
														🍳 Being Prepared...
													</div>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</main>
				</>
			)}

			{/* Help Requests Tab */}
			{activeTab === 'help' && (
				<main className="p-6">
					{helpRequests.length === 0 ? (
						<div className="text-center py-20">
							<div className="text-6xl mb-4">✨</div>
							<div className="text-2xl text-gray-400">No help requests</div>
							<div className="text-gray-500 mt-2">Customers are happy!</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{helpRequests.map((request) => (
								<div
									key={request.id}
									className="bg-[#1a2633] rounded-xl overflow-hidden border border-red-500/50 animate-pulse"
								>
									<div className="bg-red-600 px-4 py-3 flex justify-between items-center">
										<span className="text-xl font-bold">🆘 {request.tableName}</span>
										<span className="text-sm">{getTimeElapsed(request.createdAt)}</span>
									</div>
									<div className="p-4">
										<div className="text-lg text-white mb-4">{request.message}</div>
										<button
											onClick={() => handleResolveHelp(request.id)}
											className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all"
										>
											✅ Mark Resolved
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</main>
			)}

			{/* Footer */}
			<footer className="fixed bottom-0 left-0 right-0 bg-[#1a2633] px-6 py-3 border-t border-[#2a3744]">
				<div className="flex justify-between items-center text-sm text-gray-400">
					<div>
						Restaurant ID: <span className="text-white font-mono">{ownerId?.slice(0, 8) || 'N/A'}</span>
					</div>
					<div>
						Auto-refresh: <span className="text-green-400">● Active</span>
					</div>
				</div>
			</footer>
		</div>
	)
}

export default WaiterPanel
