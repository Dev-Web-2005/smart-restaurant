import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useUser } from '../../../contexts/UserContext'
import { useLoading } from '../../../contexts/LoadingContext'
import { useNotifications } from '../../../contexts/NotificationContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { InlineLoader, CardSkeleton } from '../../../components/common/LoadingSpinner'

// --- CONSTANTS ---
const TIME_LIMIT_MINUTES = 30
const TIME_LIMIT_MS = TIME_LIMIT_MINUTES * 60 * 1000

// Helper tạo timestamp giả lập
const getMockTime = (minutesAgo) => {
	const d = new Date()
	d.setMinutes(d.getMinutes() - minutesAgo)
	return d.getTime()
}

// --- Dữ liệu Mock ---
const mockActiveOrders = [
	{
		id: 'A3F8B',
		destination: 'Table 5',
		items: 3,
		totalPrice: 45.0,
		placedTime: getMockTime(15),
		status: 'PREPARING',
	},
	{
		id: 'C1D9E',
		destination: 'Table 12',
		items: 5,
		totalPrice: 62.5,
		placedTime: getMockTime(35),
		status: 'PREPARING',
	},
	{
		id: 'E4F2A',
		destination: 'Takeaway',
		items: 2,
		totalPrice: 23.75,
		placedTime: getMockTime(5),
		status: 'READY',
	},
	{
		id: 'B7G8H',
		destination: 'Table 3',
		items: 1,
		totalPrice: 15.0,
		placedTime: getMockTime(10),
		status: 'READY',
	},
	{
		id: 'K9M2N',
		destination: 'Table 8',
		items: 6,
		totalPrice: 88.2,
		placedTime: getMockTime(20),
		status: 'PREPARING',
	},
	{
		id: 'F5P6Q',
		destination: 'Table 2',
		items: 4,
		totalPrice: 12.75,
		placedTime: getMockTime(30),
		status: 'PREPARING',
	},
]

const mockPendingOrders = [
	{
		id: 'L1V4T',
		destination: 'Table 9',
		items: 4,
		time: '12:45 PM',
		totalPrice: 45.5,
		placedTime: getMockTime(2),
		paymentStatus: 'PAID', // PAID hoặc UNPAID
	},
	{
		id: 'R8S3Y',
		destination: 'John D.',
		items: 6,
		time: '12:42 PM',
		totalPrice: 112.0,
		placedTime: getMockTime(3),
		paymentStatus: 'UNPAID',
	},
]

// --- Dữ liệu Mock Chi tiết Order ---
const mockOrderDetails = {
	A3F8B: {
		id: 'A3F8B',
		table: 'Table 5',
		totalPrice: 45.0,
		status: 'Preparing',
		items: [
			{ name: 'Spicy Miso Ramen', qty: 1, price: 15.5, notes: 'Extra spicy' },
			{ name: 'Coca Cola', qty: 2, price: 4.5, notes: 'No ice' },
			{ name: 'Fries', qty: 1, price: 8.0, notes: 'Extra salt' },
		],
	},
	L1V4T: {
		id: 'L1V4T',
		table: 'Table 9',
		totalPrice: 45.5,
		status: 'Pending',
		items: [
			{ name: 'Caesar Salad', qty: 1, price: 12.0, notes: 'Dressing on side' },
			{ name: 'Grilled Salmon', qty: 1, price: 33.5, notes: '' },
		],
	},
}

// Định nghĩa các class màu
const getColor = (name) => {
	switch (name) {
		case 'primary':
			return '#137fec'
		case 'red-400':
			return '#f87171'
		case 'yellow-300':
			return '#fde047'
		case 'yellow-500':
			return '#eab308'
		case 'green-400':
			return '#4ade80'
		case 'red-800':
			return '#e53e3e'
		default:
			return 'white'
	}
}

// Hàm tính toán dữ liệu TIMER
const calculateTimeData = (placedTime) => {
	const elapsed = Date.now() - placedTime
	const remainingMs = TIME_LIMIT_MS - elapsed
	const isDelayed = remainingMs <= 0

	let progress = Math.min(100, (elapsed / TIME_LIMIT_MS) * 100)

	let displayTime
	let absRemaining = Math.abs(remainingMs)
	const minutes = Math.floor(absRemaining / 60000)
	const seconds = Math.floor((absRemaining % 60000) / 1000)

	displayTime = `${minutes.toString().padStart(2, '0')}:${seconds
		.toString()
		.padStart(2, '0')}`

	return {
		progress: progress,
		timeRemaining: displayTime,
		isDelayed: isDelayed,
		timeStatus: isDelayed ? 'Delayed' : 'Preparing',
	}
}

// =========================================================
// 🚨 COMPONENT MỚI: OrderDetailModal (ĐÃ SỬA VỚI PORTAL)
// =========================================================
const OrderDetailModal = ({ isOpen, onClose, details }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => {
				setIsVisible(true)
			})
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
		}

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose()
			}
		}

		const handleEscape = (event) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			document.addEventListener('keydown', handleEscape)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen, onClose])

	if (!isOpen || !details) return null

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative w-full max-w-xl mx-4 bg-black/80 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
				style={{
					maxHeight: '90vh',
					overflowY: 'auto',
				}}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-[#9dabb9] hover:text-red-400 transition-colors z-10"
				>
					<span className="material-symbols-outlined text-2xl">close</span>
				</button>

				<div className="flex justify-between items-start mb-6 border-b border-white/10 pb-3">
					<div>
						<h3 className="text-2xl font-bold text-white m-0">Order Details</h3>
						<p className="text-sm text-[#9dabb9] mt-1">
							ID: {details.id} | To: {details.table}
						</p>
					</div>
				</div>

				<div className="space-y-4 max-h-96 overflow-y-auto pr-4">
					{details.items.map((item, index) => (
						<div
							key={index}
							className="flex justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-lg"
						>
							<div className="flex flex-col">
								<p className="text-white font-semibold">
									{item.qty}x {item.name}
								</p>
								{item.notes && (
									<p className="text-xs text-yellow-300/80">Note: {item.notes}</p>
								)}
							</div>
							<span className="text-base font-bold text-white">
								${(item.qty * item.price).toFixed(2)}
							</span>
						</div>
					))}
				</div>

				<div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
					<p className="text-xl font-bold text-white">Total:</p>
					<p className="text-3xl font-black text-[#4ade80]">
						${details.totalPrice.toFixed(2)}
					</p>
				</div>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// --- Sub-component: Active Order Card ---
const ActiveOrderCard = ({ order, onAction, onView, timeData, actionType }) => {
	const timeBoxClass = timeData.isDelayed ? 'bg-red-600' : 'bg-black/50 backdrop-blur-md'
	const timeBoxTextColor = timeData.isDelayed
		? `text-[${getColor('yellow-400')}]`
		: 'text-white'
	const timeValueColor = timeData.isDelayed
		? `text-[${getColor('yellow-300')}]`
		: 'text-white'
	const progressBarColor = timeData.isDelayed ? getColor('red-800') : getColor('primary')

	// Xác định button config dựa trên actionType
	const buttonConfig =
		actionType === 'COMPLETE_COOKING'
			? {
					text: 'Kitchen Complete',
					icon: 'restaurant',
					color: 'bg-blue-500/20 text-blue-400 border-blue-400/50 hover:bg-blue-600/30',
			  }
			: {
					text: 'Mark as Served',
					icon: 'check_circle',
					color:
						'bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/50 hover:bg-green-600/30',
			  }

	return (
		<div
			onClick={() => onView(order.id)}
			className="bg-black/40 backdrop-blur-md rounded-xl p-4 flex flex-col gap-3 text-left border border-white/10 cursor-pointer 
                       transition-all duration-200 hover:bg-black/50 hover:shadow-lg active:scale-[0.99] 
                       focus:ring-2 focus:ring-[#137fec]"
		>
			<div className="flex justify-between items-center">
				<p className="text-white font-bold m-0">{order.id}</p>
				<p className="text-white font-semibold m-0">{order.destination}</p>
			</div>
			<p className="text-sm text-gray-300 m-0">{order.items} items</p>

			<div className={`rounded-lg p-3 text-center ${timeBoxClass}`}>
				<p className={`text-xs ${timeBoxTextColor} m-0 mb-1`}>
					{timeData.isDelayed ? 'DELAYED' : 'TIME REMAINING'}
				</p>
				<p className={`text-xl font-bold ${timeValueColor} m-0`}>
					{timeData.timeRemaining}
				</p>
			</div>

			<div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mt-1 mb-3">
				<div
					className="h-full rounded-full"
					style={{
						width: `${timeData.progress}%`,
						backgroundColor: progressBarColor,
					}}
				></div>
			</div>

			<button
				onClick={(e) => {
					e.stopPropagation()
					onAction(order.id)
				}}
				className={`w-full h-10 rounded-lg text-sm font-bold transition-colors active:scale-[0.98] border flex items-center justify-center gap-2 ${buttonConfig.color}`}
			>
				{buttonConfig.text}
			</button>
		</div>
	)
}

// --- Sub-component: Pending Order Item ---
const PendingOrderItem = ({ order, onApprove, onDecline, onView }) => {
	const handleApproveClick = () => onApprove(order.id)
	const handleDeclineClick = () => onDecline(order.id)

	const isPaid = order.paymentStatus === 'PAID'

	return (
		<div
			onClick={() => onView(order.id)}
			className="bg-black/30 backdrop-blur-md rounded-lg m-4 p-4 flex items-center justify-between transition-all duration-200 hover:bg-black/40 hover:shadow-md cursor-pointer border border-white/10"
		>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<p className="text-white font-semibold m-0">{order.destination}</p>
					<span
						className={`text-xs px-2 py-0.5 rounded-full font-bold ${
							isPaid
								? 'bg-green-500/20 text-green-400 border border-green-400/50'
								: 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/50'
						}`}
					>
						{isPaid ? 'Paid' : 'Unpaid'}
					</span>
				</div>
				<div className="flex items-center gap-4 text-sm text-gray-300">
					<span className="flex items-center">
						{new Date(order.placedTime).toLocaleTimeString('en-US', {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</span>
					<span className="font-bold text-white">${order.totalPrice.toFixed(2)}</span>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<button
					onClick={(e) => {
						e.stopPropagation()
						handleDeclineClick()
					}}
					title="Decline"
					className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-600/20 text-[#f87171] hover:bg-red-600/30 transition-colors"
				>
					<span className="material-symbols-outlined text-base">close</span>
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation()
						handleApproveClick()
					}}
					title="Approve"
					className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-600/20 text-[#4ade80] hover:bg-green-600/30 transition-colors"
				>
					<span className="material-symbols-outlined text-base">check</span>
				</button>
			</div>
		</div>
	)
}

const OrderManagement = () => {
	const { user, loading: contextLoading } = useUser()
	const { decrementPendingOrders } = useNotifications()

	const [activeTab, setActiveTab] = useState('PREPARING') // 'PREPARING' hoặc 'READY'
	const [activeOrders, setActiveOrders] = useState([])
	const [pendingOrders, setPendingOrders] = useState([])
	const [loading, setLoading] = useState(true)
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
	const [orderDetails, setOrderDetails] = useState(null)
	const [tick, setTick] = useState(0)

	// Lọc orders theo status
	const preparingOrders = activeOrders.filter((order) => order.status === 'PREPARING')
	const readyOrders = activeOrders.filter((order) => order.status === 'READY')

	const fetchOrders = async () => {
		console.log('Fetching active and pending orders...')
		setLoading(true)

		setTimeout(() => {
			const sortedMockActive = [...mockActiveOrders].sort(
				(a, b) => a.placedTime - b.placedTime,
			)
			const sortedMockPending = [...mockPendingOrders].sort(
				(a, b) => a.placedTime - b.placedTime,
			)
			setActiveOrders(sortedMockActive)
			setPendingOrders(sortedMockPending)
			setLoading(false)
		}, 500)
	}

	const handleViewDetails = async (orderId) => {
		console.log(`Fetching details for Order ID: ${orderId}`)
		setIsDetailModalOpen(true)
		setOrderDetails(null)

		setTimeout(() => {
			setOrderDetails(mockOrderDetails[orderId] || mockOrderDetails['A3F8B'])
		}, 300)
	}

	const handleCompleteCooking = async (orderId) => {
		console.log(`Marking order ${orderId} as cooking completed.`)
		setActiveOrders((prev) =>
			prev.map((order) => (order.id === orderId ? { ...order, status: 'READY' } : order)),
		)
	}

	const handleServe = async (orderId) => {
		console.log(`Marking order ${orderId} as served.`)
		setActiveOrders((prev) => prev.filter((order) => order.id !== orderId))
	}

	const handleApprove = async (orderId) => {
		console.log(`Approving order: ${orderId}`)

		const approvedOrder = pendingOrders.find((o) => o.id === orderId)
		if (approvedOrder) {
			setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
			decrementPendingOrders() // Update sidebar notification

			setActiveOrders((prev) =>
				[
					...prev,
					{
						...approvedOrder,
						status: 'PREPARING',
					},
				].sort((a, b) => (a.placedTime || 0) - (b.placedTime || 0)),
			)
		}
	}

	const handleDecline = async (orderId) => {
		console.log(`Declining order: ${orderId}`)
		setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
		decrementPendingOrders() // Update sidebar notification
	}

	useEffect(() => {
		if (!loading) {
			const interval = setInterval(() => {
				setTick((prev) => prev + 1)
			}, 1000)
			return () => clearInterval(interval)
		}
	}, [loading])

	useEffect(() => {
		if (!contextLoading) {
			fetchOrders()
		}
	}, [contextLoading])

	if (contextLoading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading User Context...</p>
			</div>
		)
	}

	return (
		<>
			<BasePageLayout activeRoute="Order">
				<div className="w-full h-full">
					<header className="mb-8">
						<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
							Order Management
						</h1>
						<p className="text-gray-300 text-base mt-2">
							Monitor and manage all active and incoming orders.
						</p>
					</header>

					<div className="flex flex-col lg:flex-row gap-8 h-full">
						<div className="flex flex-col flex-3 lg:w-3/5">
							<div className="section-header mb-6">
								<h2 className="text-2xl font-bold text-white m-0">Active Orders</h2>
								<p className="text-gray-300 text-sm">
									Manage orders in preparation and ready to serve.
								</p>
							</div>

							{/* Tab Switcher */}
							<div className="flex gap-2 mb-6 bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10">
								<button
									onClick={() => setActiveTab('PREPARING')}
									className={`relative flex-1 py-3 px-4 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
										activeTab === 'PREPARING'
											? 'bg-blue-500 text-white shadow-lg'
											: 'text-gray-400 hover:text-white hover:bg-white/5'
									}`}
								>
									In Kitchen
									{preparingOrders.length > 0 && (
										<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 shadow-lg">
											{preparingOrders.length}
										</span>
									)}
								</button>
								<button
									onClick={() => setActiveTab('READY')}
									className={`relative flex-1 py-3 px-4 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
										activeTab === 'READY'
											? 'bg-green-500 text-white shadow-lg'
											: 'text-gray-400 hover:text-white hover:bg-white/5'
									}`}
								>
									Ready to Serve
									{readyOrders.length > 0 && (
										<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 shadow-lg">
											{readyOrders.length}
										</span>
									)}
								</button>
							</div>

							<div className="flex-1 overflow-hidden">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-4 -mr-4 h-full">
									{loading ? (
										<p className="text-[#9dabb9] lg:col-span-3">
											Loading active orders...
										</p>
									) : activeTab === 'PREPARING' ? (
										preparingOrders.length > 0 ? (
											preparingOrders.map((order) => (
												<ActiveOrderCard
													key={order.id}
													order={order}
													onAction={handleCompleteCooking}
													onView={handleViewDetails}
													timeData={calculateTimeData(order.placedTime)}
													actionType="COMPLETE_COOKING"
												/>
											))
										) : (
											<p className="text-[#9dabb9] lg:col-span-3 text-center py-10">
												No orders being prepared.
											</p>
										)
									) : readyOrders.length > 0 ? (
										readyOrders.map((order) => (
											<ActiveOrderCard
												key={order.id}
												order={order}
												onAction={handleServe}
												onView={handleViewDetails}
												timeData={calculateTimeData(order.placedTime)}
												actionType="MARK_SERVED"
											/>
										))
									) : (
										<p className="text-[#9dabb9] lg:col-span-3 text-center py-10">
											No orders ready to serve.
										</p>
									)}
								</div>
							</div>
						</div>

						<div className="flex flex-col flex-2 lg:w-2/5 bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
							<header className="section-header mb-6">
								<h2 className="text-2xl font-bold text-white m-0">
									Pending Orders ({pendingOrders.length})
								</h2>
								<p className="text-gray-300 text-sm">
									Approve or decline new incoming orders.
								</p>
							</header>

							<div className="pending-orders-list flex-1 space-y-4 overflow-y-auto pr-4 -mr-4">
								{loading ? (
									<p className="text-[#9dabb9]">Loading pending list...</p>
								) : pendingOrders.length > 0 ? (
									pendingOrders.map((order) => (
										<PendingOrderItem
											key={order.id}
											order={order}
											onApprove={handleApprove}
											onDecline={handleDecline}
											onView={handleViewDetails}
										/>
									))
								) : (
									<p className="text-[#9dabb9] text-center py-10">
										No new orders waiting for approval.
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</BasePageLayout>

			{/* 🚨 MODAL CHI TIẾT - Nằm ngoài BasePageLayout */}
			<OrderDetailModal
				isOpen={isDetailModalOpen}
				onClose={() => setIsDetailModalOpen(false)}
				details={orderDetails}
			/>
		</>
	)
}

export default OrderManagement
