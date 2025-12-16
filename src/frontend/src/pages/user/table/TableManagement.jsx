import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import {
	getTablesAPI,
	createTableAPI,
	deleteTableAPI,
	updateTableStatusAPI,
	updateTablePositionAPI,
	getTableStatsAPI,
	getTableQRCodeAPI,
	regenerateTableQRAPI,
	bulkRegenerateQRCodesAPI,
	downloadTableQRCodeAPI,
	batchDownloadQRCodesAPI,
	validateQRScanAPI,
} from '../../../services/api/tableAPI'
import AddTableModal from './AddTableModal'
import { useLoading } from '../../../contexts/LoadingContext'
import { useAlert } from '../../../contexts/AlertContext'
import { InlineLoader, SkeletonLoader } from '../../../components/common/LoadingSpinner'
import AuthenticationWarning from '../../../components/common/AuthenticationWarning'

// --- Dữ liệu Mock cho các bàn với vị trí grid (x, y) ---
// ⚠️ Updated to match Backend Schema (16/12/2025)
// ⚠️ NOTE: Mock data chỉ dùng làm FALLBACK khi API chưa sẵn sàng
// ⚠️ Component sẽ tự động fetch từ backend API khi mount
// Backend fields: id (UUID), tenantId (UUID), floorId (UUID), name, capacity, status, gridX, gridY, isActive, tokenVersion, createdAt, updatedAt
// Frontend additions: floor (number - for UI navigation), location (for display), qrCodeUrl (fetched from QR API)

const MOCK_TENANT_ID = 'tenant-123e4567-e89b-12d3-a456-426614174000'
const MOCK_FLOOR_1_ID = 'floor-550e8400-e29b-41d4-a716-446655440001'
const MOCK_FLOOR_2_ID = 'floor-550e8400-e29b-41d4-a716-446655440002'

let rawTablesData = [
	{
		// Backend fields (match TableDto)
		id: '550e8400-e29b-41d4-a716-446655440101', // UUID string
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 101',
		capacity: 4,
		status: 'Occupied',
		gridX: 0,
		gridY: 0,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-01T08:00:00Z',
		updatedAt: '2025-12-01T08:00:00Z',
		// Frontend-only fields (for UI)
		floor: 1, // For navigation/filtering
		location: 'Trong nhà', // Display only
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-101',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440102',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 102',
		capacity: 2,
		status: 'Available',
		gridX: 1,
		gridY: 0,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-02T09:30:00Z',
		updatedAt: '2025-12-02T09:30:00Z',
		floor: 1,
		location: 'Trong nhà',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-102',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440103',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'VIP 1',
		capacity: 8,
		status: 'Available',
		gridX: 2,
		gridY: 0,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-03T10:15:00Z',
		updatedAt: '2025-12-03T10:15:00Z',
		floor: 1,
		location: 'Phòng VIP',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-103',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440104',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 104',
		capacity: 4,
		status: 'Cleaning',
		gridX: 0,
		gridY: 1,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-04T11:00:00Z',
		updatedAt: '2025-12-04T11:00:00Z',
		floor: 1,
		location: 'Trong nhà',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-104',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440105',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 105',
		capacity: 6,
		status: 'Available',
		gridX: 1,
		gridY: 1,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-05T14:20:00Z',
		updatedAt: '2025-12-05T14:20:00Z',
		floor: 1,
		location: 'Ngoài trời',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-105',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440106',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 106',
		capacity: 2,
		status: 'Available',
		gridX: 2,
		gridY: 1,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-06T16:45:00Z',
		updatedAt: '2025-12-06T16:45:00Z',
		floor: 1,
		location: 'Quầy bar',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-106',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440107',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 107',
		capacity: 4,
		status: 'Occupied',
		gridX: 0,
		gridY: 2,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-07T08:30:00Z',
		updatedAt: '2025-12-07T08:30:00Z',
		floor: 1,
		location: 'Trong nhà',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-107',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440108',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 108',
		capacity: 4,
		status: 'Available',
		gridX: 1,
		gridY: 2,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-08T10:00:00Z',
		updatedAt: '2025-12-08T10:00:00Z',
		floor: 1,
		location: 'Khu gia đình',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-108',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440109',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 109',
		capacity: 2,
		status: 'Available',
		gridX: 2,
		gridY: 2,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-09T12:15:00Z',
		updatedAt: '2025-12-09T12:15:00Z',
		floor: 1,
		location: 'Trong nhà',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-109',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440110',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_1_ID,
		name: 'Bàn 110',
		capacity: 4,
		status: 'Available',
		gridX: 3,
		gridY: 2,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-10T09:00:00Z',
		updatedAt: '2025-12-10T09:00:00Z',
		floor: 1,
		location: 'Trong nhà',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-110',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440201',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_2_ID,
		name: 'Bàn 201',
		capacity: 6,
		status: 'Available',
		gridX: 0,
		gridY: 0,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-11T08:00:00Z',
		updatedAt: '2025-12-11T08:00:00Z',
		floor: 2,
		location: 'Trong nhà',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-201',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440202',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_2_ID,
		name: 'VIP 2',
		capacity: 10,
		status: 'Occupied',
		gridX: 1,
		gridY: 0,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-12T10:30:00Z',
		updatedAt: '2025-12-12T10:30:00Z',
		floor: 2,
		location: 'Phòng VIP',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-202',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440203',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_2_ID,
		name: 'Bàn 203',
		capacity: 4,
		status: 'Cleaning',
		gridX: 0,
		gridY: 1,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-13T11:45:00Z',
		updatedAt: '2025-12-13T11:45:00Z',
		floor: 2,
		location: 'Ngoài trời',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-203',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440204',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_2_ID,
		name: 'Bàn 204',
		capacity: 2,
		status: 'Available',
		gridX: 1,
		gridY: 1,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-14T13:00:00Z',
		updatedAt: '2025-12-14T13:00:00Z',
		floor: 2,
		location: 'Quầy bar',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-204',
	},
	{
		id: '550e8400-e29b-41d4-a716-446655440205',
		tenantId: MOCK_TENANT_ID,
		floorId: MOCK_FLOOR_2_ID,
		name: 'Bàn 205',
		capacity: 4,
		status: 'Available',
		gridX: 2,
		gridY: 1,
		isActive: true,
		tokenVersion: 1,
		createdAt: '2025-12-15T09:30:00Z',
		updatedAt: '2025-12-15T09:30:00Z',
		floor: 2,
		location: 'Trong nhà',
		qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-205',
	},
]

const getStatusColor = (status) => {
	switch (status) {
		case 'Occupied':
			return 'bg-red-600/30 border-red-600/50'
		case 'Cleaning':
			return 'bg-yellow-600/30 border-yellow-600/50'
		default:
			return 'bg-green-600/30 border-green-600/50'
	}
}

const TableCard = ({ table, onClick, onDelete, onDragStart, onDragEnd, isDragging }) => {
	const cardColorClass = getStatusColor(table.status)
	const [isHovered, setIsHovered] = useState(false)

	const handleDragStart = (e) => {
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('text/plain', table.id)
		onDragStart(table)
	}

	// Dynamic glow colors based on status
	const getGlowColor = () => {
		switch (table.status) {
			case 'Occupied':
				return 'rgba(220, 38, 38, 0.4)' // red
			case 'Cleaning':
				return 'rgba(234, 179, 8, 0.4)' // yellow
			default:
				return 'rgba(34, 197, 94, 0.4)' // green
		}
	}

	// Dynamic hover scale based on status
	const getHoverScale = () => {
		switch (table.status) {
			case 'Occupied':
				return '1.03'
			case 'Cleaning':
				return '1.02'
			default:
				return '1.04'
		}
	}

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onDragEnd={onDragEnd}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={`relative flex flex-col items-center justify-center aspect-square text-white transition-all duration-300 cursor-move rounded-2xl bg-gradient-to-br from-gray-800/60 to-black/60 backdrop-blur-xl border-4 ${
				isDragging ? 'opacity-50 scale-95' : ''
			} ${cardColorClass}`}
			style={{
				padding: 'clamp(6px, 4%, 16px)',
				transform: isHovered && !isDragging ? `scale(${getHoverScale()})` : 'scale(1)',
				boxShadow:
					isHovered && !isDragging
						? `0 12px 40px ${getGlowColor()}, 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)`
						: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
				transition:
					'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
				zIndex: isHovered ? 10 : 1,
			}}
		>
			{/* Animated glow effect */}
			{isHovered && !isDragging && (
				<div
					className="absolute inset-0 rounded-2xl opacity-0 animate-pulse-slow pointer-events-none"
					style={{
						background: `radial-gradient(circle at center, ${getGlowColor()} 0%, transparent 70%)`,
						animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
					}}
				/>
			)}

			{/* Shine effect on hover - ĐÃ SỬA: ngắn hơn, chỉ 40% chiều rộng */}
			{isHovered && !isDragging && (
				<div
					className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
					style={{
						background:
							'linear-gradient(120deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 80%)',
						animation: 'shine 1.5s ease-in-out infinite',
					}}
				/>
			)}

			{isHovered && table.status === 'Available' && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onDelete(table.id)
					}}
					className="absolute rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center justify-center z-20 transition-all duration-300 shadow-lg hover:shadow-red-500/50 hover:scale-110"
					style={{
						top: 'clamp(4px, 3%, 10px)',
						right: 'clamp(4px, 3%, 10px)',
						width: 'clamp(20px, 18%, 28px)',
						height: 'clamp(20px, 18%, 28px)',
						fontSize: 'clamp(11px, 2.2vw, 15px)',
					}}
					title="Delete Table"
				>
					✕
				</button>
			)}

			<button
				onClick={() => onClick(table)}
				className="w-full h-full flex flex-col items-center justify-center gap-0.5 overflow-hidden relative z-10"
				style={{
					transition: 'transform 0.2s ease',
				}}
			>
				{/* Tên bàn - Giảm kích thước */}
				<h3
					className="font-extrabold leading-tight text-center overflow-hidden text-ellipsis whitespace-nowrap w-full transition-all duration-300"
					style={{
						fontSize: 'clamp(8px, min(2.2vw, 2.2vh), 24px)',
						letterSpacing: '-0.02em',
						textShadow: isHovered
							? '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(255, 255, 255, 0.3)'
							: '0 1px 2px rgba(0, 0, 0, 0.5)',
						transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
					}}
				>
					{table.name}
				</h3>

				{/* Sức chứa - Giảm kích thước */}
				<p
					className="text-white/95 leading-tight text-center overflow-hidden text-ellipsis whitespace-nowrap w-full font-bold transition-all duration-300"
					style={{
						fontSize: 'clamp(5px, min(2vw, 2vh), 15px)',
						marginTop: 'clamp(2px, 1.5%, 6px)',
						letterSpacing: '-0.01em',
						transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
						textShadow: isHovered ? '0 1px 4px rgba(0, 0, 0, 0.4)' : 'none',
					}}
				>
					{table.capacity} chỗ
				</p>

				{/* Vị trí - Giảm kích thước */}
				<p
					className="text-white/75 leading-tight text-center overflow-hidden text-ellipsis whitespace-nowrap w-full transition-all duration-300"
					style={{
						fontSize: 'clamp(5px, min(1.5vw, 1.5vh), 11px)',
						marginTop: 'clamp(1px, 1%, 4px)',
						fontWeight: '500',
						transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
					}}
				>
					{table.location}
				</p>
			</button>

			{/* Border animation on hover */}
			{isHovered && !isDragging && (
				<div
					className="absolute inset-0 rounded-2xl pointer-events-none"
					style={{
						border: '4px solid transparent',
						background: `linear-gradient(45deg, ${getGlowColor()}, transparent) border-box`,
						mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
						maskComposite: 'exclude',
						animation: 'border-glow 1.5s ease-in-out infinite alternate',
					}}
				/>
			)}
		</div>
	)
}

const EmptyGridCell = ({ gridX, gridY, onDrop, onDragOver, isDropTarget }) => {
	const handleDragOver = (e) => {
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
		onDragOver(gridX, gridY)
	}

	const handleDrop = (e) => {
		e.preventDefault()
		onDrop(gridX, gridY)
	}

	return (
		<div
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			className={`aspect-square border-2 border-dashed rounded-xl transition-all ${
				isDropTarget
					? 'border-blue-500 bg-blue-500/10'
					: 'border-[#2D3748] bg-[#1A202C]/30'
			}`}
		/>
	)
}

const AddTableQuickCard = ({ onClick }) => (
	<button
		onClick={onClick}
		className="flex flex-col items-center justify-center aspect-square w-full rounded-xl p-6 text-center transition-all duration-200 bg-black/30 backdrop-blur-md border-2 border-dashed border-white/20 hover:bg-black/50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
	>
		<span className="text-7xl text-[#137fec] opacity-90 mb-2">+</span>
	</button>
)

// --- Modal sử dụng React Portal ---
const TableStatusModal = ({ isOpen, onClose, table, onUpdateStatus }) => {
	const modalRef = React.useRef(null)
	const [isVisible, setIsVisible] = useState(false)

	// Control body scroll
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

	// Close on outside click and ESC
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

	if (!isOpen || !table) return null

	const statuses = ['Available', 'Occupied', 'Cleaning']

	const getStatusButtonClass = (status) => {
		const baseClasses =
			'w-full h-12 px-4 rounded-lg text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

		if (table.status === status) {
			return `${baseClasses} bg-[#137fec] text-white border-2 border-[#137fec]`
		}

		// Different colors for different statuses
		if (status === 'Available') {
			return `${baseClasses} bg-green-600/20 backdrop-blur-md text-green-400 border-2 border-green-600/30 hover:bg-green-600/40 hover:border-green-500 hover:text-green-300`
		}
		if (status === 'Occupied') {
			return `${baseClasses} bg-red-600/20 backdrop-blur-md text-red-400 border-2 border-red-600/30 hover:bg-red-600/40 hover:border-red-500 hover:text-red-300`
		}
		if (status === 'Cleaning') {
			return `${baseClasses} bg-yellow-600/20 backdrop-blur-md text-yellow-400 border-2 border-yellow-600/30 hover:bg-yellow-600/40 hover:border-yellow-500 hover:text-yellow-300`
		}

		return `${baseClasses} bg-black/30 backdrop-blur-md text-gray-300 border-2 border-white/10 hover:bg-black/50 hover:border-white/20`
	}

	// Modal content component
	const ModalContent = () => (
		<div
			className={`scrollbar-hide fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent'
			}`}
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
			}}
		>
			<div
				ref={modalRef}
				className={`relative bg-black/80 backdrop-blur-md p-6 rounded-xl w-full max-w-3xl shadow-2xl border border-white/10 mx-4 transition-all duration-300 transform scrollbar-hide ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
				style={{
					maxHeight: '90vh',
					overflowY: 'auto',
				}}
			>
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-2xl font-bold text-white">{table.name}</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white hover:bg-red-600/20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
					>
						✕
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{/* QR Code Section - Left Side */}
					<div className="md:col-span-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
						<div className="flex flex-col items-center">
							<p className="text-lg font-semibold text-gray-300 mb-4 text-center">
								Mã QR Bàn
							</p>
							{table.qrCodeUrl ? (
								<>
									<div className="bg-white rounded-xl p-4 shadow-2xl mb-4">
										<img
											src={table.qrCodeUrl}
											alt={`QR Code ${table.name}`}
											className="w-full max-w-64 h-auto object-contain"
											onError={(e) => {
												console.error('QR image load error')
												e.target.src =
													'https://via.placeholder.com/300x300?text=Loading+QR...'
											}}
										/>
									</div>

									{/* QR Info */}
									<div className="text-center mb-4">
										<p className="text-sm text-gray-400 mb-1">Quét để đặt bàn</p>
										<p className="text-xs text-gray-500">{table.name}</p>
									</div>
								</>
							) : (
								<div className="bg-white/10 rounded-xl p-8 shadow-2xl mb-4 flex flex-col items-center justify-center min-h-[300px]">
									<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
									<p className="text-gray-400 text-sm">Đang tải QR Code...</p>
								</div>
							)}

							{/* QR Action Buttons - Using All 6 Backend APIs */}
							<div className="grid grid-cols-1 gap-3 w-full">
								{/* 1. Print QR (getTableQRCodeAPI) */}
								<button
									onClick={async () => {
										const result = await getTableQRCodeAPI(table.id)
										if (result.success && result.image) {
											// Add data URL prefix if needed
											const qrDataUrl = result.image.startsWith('data:')
												? result.image
												: `data:image/png;base64,${result.image}`

											const printWindow = window.open('', '_blank')
											printWindow.document.write(`
												<html>
												<head>
													<title>In QR Code - ${table.name}</title>
													<style>
														@media print {
															body { margin: 0; padding: 20px; }
															.no-print { display: none; }
														}
														body {
															display: flex;
															flex-direction: column;
															align-items: center;
															justify-content: center;
															min-height: 100vh;
															font-family: system-ui;
															background: #fff;
														}
														h1 { color: #1f2937; margin-bottom: 20px; }
														img { max-width: 400px; border: 4px solid #3b82f6; border-radius: 12px; }
														p { color: #6b7280; margin-top: 16px; }
														.print-btn {
															margin-top: 24px;
															padding: 12px 24px;
															background: #3b82f6;
															color: white;
															border: none;
															border-radius: 8px;
															cursor: pointer;
															font-size: 16px;
															font-weight: 600;
														}
														.print-btn:hover { background: #2563eb; }
													</style>
												</head>
												<body>
													<h1>${table.name}</h1>
													<img src="${qrDataUrl}" alt="QR Code" />
													<p>Scan để vào menu</p>
													<button class="print-btn no-print" onclick="window.print()">🖨️ In QR Code</button>
												</body>
												</html>
											`)
											printWindow.document.close()
											// Auto print after 500ms
											setTimeout(() => {
												printWindow.print()
											}, 500)
										} else {
											showError('Lỗi in QR', result.message)
										}
									}}
									className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600/20 border-2 border-indigo-600/30 text-indigo-400 rounded-lg hover:bg-indigo-600/40 hover:border-indigo-500 transition-all duration-200"
									title="In QR Code"
								>
									<span className="text-lg">🖨️</span>
									<span className="font-semibold">In QR Code</span>
								</button>

								{/* 2-4. Download QR with format selection (downloadTableQRCodeAPI) */}
								<div className="grid grid-cols-3 gap-2">
									<button
										onClick={async () => {
											const result = await downloadTableQRCodeAPI(table.id, 'png')
											if (!result.success) showError('Lỗi tải PNG', result.message)
										}}
										className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-lg hover:bg-blue-600/40 hover:border-blue-500 transition-all duration-200 text-xs"
										title="Tải QR PNG"
									>
										<span>📥</span>
										<span className="font-semibold">PNG</span>
									</button>
									<button
										onClick={async () => {
											const result = await downloadTableQRCodeAPI(table.id, 'pdf')
											if (!result.success) showError('Lỗi tải PDF', result.message)
										}}
										className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg hover:bg-red-600/40 hover:border-red-500 transition-all duration-200 text-xs"
										title="Tải QR PDF"
									>
										<span>📥</span>
										<span className="font-semibold">PDF</span>
									</button>
									<button
										onClick={async () => {
											const result = await downloadTableQRCodeAPI(table.id, 'svg')
											if (!result.success) showError('Lỗi tải SVG', result.message)
										}}
										className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-purple-600/20 border border-purple-600/30 text-purple-400 rounded-lg hover:bg-purple-600/40 hover:border-purple-500 transition-all duration-200 text-xs"
										title="Tải QR SVG"
									>
										<span>📥</span>
										<span className="font-semibold">SVG</span>
									</button>
								</div>

								{/* 5. Regenerate QR (regenerateTableQRAPI) */}
								<button
									onClick={async () => {
										if (
											window.confirm(
												`Bạn có chắc muốn tạo lại QR Code cho ${table.name}?\nQR cũ sẽ không còn hoạt động.`,
											)
										) {
											const result = await regenerateTableQRAPI(table.id)
											if (result.success) {
												showSuccess(
													'QR Code đã được tạo mới!',
													'QR cũ đã hết hạn và không còn hoạt động.',
												)
												onClose()
												window.location.reload()
											} else {
												showError('Lỗi tạo QR', result.message)
											}
										}
									}}
									className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600/20 border-2 border-yellow-600/30 text-yellow-400 rounded-lg hover:bg-yellow-600/40 hover:border-yellow-500 transition-all duration-200"
									title="Tạo lại QR Code"
								>
									<span className="text-lg">🔄</span>
									<span className="font-semibold">Tạo Lại QR</span>
								</button>
							</div>
						</div>
					</div>

					{/* Table Information Section - Right Side */}
					<div className="md:col-span-2">
						{/* Table Details Grid */}
						<div className="grid grid-cols-2 gap-4 mb-6">
							<div className="bg-black/30 rounded-lg p-4 border border-white/10">
								<p className="text-xs text-gray-400 mb-1">Tên Bàn</p>
								<p className="text-lg font-bold text-white">{table.name}</p>
							</div>
							<div className="bg-black/30 rounded-lg p-4 border border-white/10">
								<p className="text-xs text-gray-400 mb-1">Sức Chứa</p>
								<p className="text-lg font-bold text-white">{table.capacity} chỗ</p>
							</div>
							<div className="bg-black/30 rounded-lg p-4 border border-white/10">
								<p className="text-xs text-gray-400 mb-1">Vị Trí</p>
								<p className="text-lg font-bold text-white">{table.location}</p>
							</div>
							<div className="bg-black/30 rounded-lg p-4 border border-white/10">
								<p className="text-xs text-gray-400 mb-1">Trạng Thái</p>
								<p
									className={`text-lg font-bold ${
										table.status === 'Available'
											? 'text-green-500'
											: table.status === 'Occupied'
											? 'text-red-500'
											: 'text-yellow-500'
									}`}
								>
									{table.status}
								</p>
							</div>
						</div>

						{/* Description */}
						{table.description && (
							<div className="mb-6 bg-black/30 rounded-lg p-4 border border-white/10">
								<p className="text-xs text-gray-400 mb-2">MÔ TẢ BÀN</p>
								<p className="text-sm text-white leading-relaxed">{table.description}</p>
							</div>
						)}

						{/* Status Change Section */}
						<div className="bg-black/30 rounded-lg p-4 border border-white/10">
							<p className="text-sm font-semibold text-gray-300 mb-3">
								THAY ĐỔI TRẠNG THÁI
							</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								{statuses.map((status) => (
									<button
										key={status}
										onClick={() => onUpdateStatus(table.id, status)}
										disabled={table.status === status}
										className={getStatusButtonClass(status)}
									>
										{status === 'Available'
											? '✓ Sẵn sàng'
											: status === 'Occupied'
											? '● Đang sử dụng'
											: '🧹 Đang dọn dẹp'}
									</button>
								))}
							</div>
						</div>

						{/* Additional Info */}
						<div className="mt-6 grid grid-cols-2 gap-4 text-sm">
							<div className="text-gray-400">
								<p className="mb-1">Tầng:</p>
								<p className="text-white font-semibold">{table.floor}</p>
							</div>
							<div className="text-gray-400">
								<p className="mb-1">Ngày tạo:</p>
								<p className="text-white font-semibold">
									{new Date(table.createdAt).toLocaleDateString('vi-VN')}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Close Button */}
				<div className="flex justify-end mt-6 pt-4 border-t border-white/10">
					<button
						onClick={onClose}
						className="h-10 px-4 rounded-lg bg-black/40 backdrop-blur-md text-white text-sm font-bold hover:bg-black/60 transition-colors"
					>
						Đóng
					</button>
				</div>
			</div>
		</div>
	)

	// Render using Portal directly to body
	return ReactDOM.createPortal(<ModalContent />, document.body)
}

const RestaurantTableManagement = () => {
	const { showLoading, hideLoading } = useLoading()
	const { showAlert, showSuccess, showError, showWarning, showInfo } = useAlert()
	const [tables, setTables] = useState([])
	const [loading, setLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(0)
	const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
	const [selectedTable, setSelectedTable] = useState(null)
	const [draggingTable, setDraggingTable] = useState(null)
	const [dropTarget, setDropTarget] = useState(null)
	const [gridSize, setGridSize] = useState({ rows: 5, cols: 10 })
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)

	// Filter and Sort states
	const [filterStatus, setFilterStatus] = useState('All')
	const [filterLocation, setFilterLocation] = useState('All')
	const [sortBy, setSortBy] = useState('id')
	const [sortOrder, setSortOrder] = useState('asc')
	const [tableStats, setTableStats] = useState({
		Available: 0,
		Occupied: 0,
		Cleaning: 0,
	})

	const currentFloor = currentPage

	// ✅ Fetch tables from API when component mounts or filters change
	useEffect(() => {
		const fetchTables = async () => {
			showLoading('fetchTables')
			try {
				const result = await getTablesAPI(currentFloor, {
					status: filterStatus !== 'All' ? filterStatus : undefined,
					location: filterLocation !== 'All' ? filterLocation : undefined,
					sortBy: sortBy,
					sortOrder: sortOrder,
				})

				if (result.success) {
					// Update rawTablesData with real data from backend
					rawTablesData = result.tables.map((table) => ({
						...table,
						// Add frontend-only fields if not present
						floor: currentFloor, // Infer from current floor
						location: table.location || 'Trong nhà', // Default if missing
						qrCodeUrl: null, // Will be fetched from backend
					}))

					// Ensure location field exists in state tables
					setTables(
						result.tables.map((table) => ({
							...table,
							location: table.location || 'Trong nhà', // Default if missing
						})),
					)

					// ✅ Fetch real QR codes from backend for all tables
					console.log('🔄 Fetching QR codes for', result.tables.length, 'tables...')
					const qrPromises = result.tables.map(async (table) => {
						try {
							const qrResult = await getTableQRCodeAPI(table.id)
							console.log('📊 QR Response for table', table.id, ':', {
								success: qrResult.success,
								hasImage: !!qrResult.image,
								imageType: qrResult.image ? typeof qrResult.image : 'N/A',
								imageLength: qrResult.image ? qrResult.image.length : 0,
								imagePrefix: qrResult.image ? qrResult.image.substring(0, 50) : 'N/A',
								url: qrResult.url,
								tableName: qrResult.tableName,
								tokenVersion: qrResult.tokenVersion,
								fullResponse: qrResult,
							})
							if (qrResult.success && qrResult.image) {
								// Backend returns base64 without prefix, need to add data URL prefix for <img> tag
								const qrDataUrl = qrResult.image.startsWith('data:')
									? qrResult.image
									: `data:image/png;base64,${qrResult.image}`

								// Update both rawTablesData and tables state with real QR
								const tableIndex = rawTablesData.findIndex((t) => t.id === table.id)
								if (tableIndex !== -1) {
									rawTablesData[tableIndex].qrCodeUrl = qrDataUrl
								}
								return { id: table.id, qrCodeUrl: qrDataUrl }
							}
						} catch (error) {
							console.warn(`⚠️ Failed to fetch QR for table ${table.id}:`, error)
						}
						return null
					})

					// Wait for all QR codes to be fetched
					const qrResults = await Promise.all(qrPromises)

					// Update tables state with QR codes
					setTables((prevTables) =>
						prevTables.map((table) => {
							const qrData = qrResults.find((qr) => qr && qr.id === table.id)
							return {
								...table,
								qrCodeUrl: qrData ? qrData.qrCodeUrl : null,
							}
						}),
					)

					console.log('✅ All QR codes fetched successfully')

					// Update total floors
					if (result.totalFloors) {
						setTotalPages(result.totalFloors)
					}

					console.log('✅ Fetched tables from API:', result.tables.length, 'tables')
				} else {
					console.warn('⚠️ Failed to fetch tables from API, using mock data')
					// Fallback to mock data
					const mockTables = filterTablesByFloor(currentFloor)
					setTables(mockTables)
				}
			} catch (error) {
				console.error('❌ Error fetching tables:', error)
				// Fallback to mock data
				const mockTables = filterTablesByFloor(currentFloor)
				setTables(mockTables)
			} finally {
				hideLoading('fetchTables')
			}
		}

		fetchTables()
	}, [
		currentFloor,
		filterStatus,
		filterLocation,
		sortBy,
		sortOrder,
		showLoading,
		hideLoading,
	])

	// ✅ Fetch table stats from API
	useEffect(() => {
		const fetchStats = async () => {
			try {
				const result = await getTableStatsAPI()
				if (result.success && result.stats) {
					setTableStats(result.stats)
					console.log('✅ Fetched table stats from API:', result.stats)
				} else {
					// Fallback: Calculate stats from current tables
					const stats = rawTablesData.reduce(
						(acc, table) => {
							acc[table.status] = (acc[table.status] || 0) + 1
							return acc
						},
						{ Available: 0, Occupied: 0, Cleaning: 0 },
					)
					setTableStats(stats)
				}
			} catch (error) {
				console.error('❌ Error fetching stats:', error)
				// Calculate from current data
				const stats = rawTablesData.reduce(
					(acc, table) => {
						acc[table.status] = (acc[table.status] || 0) + 1
						return acc
					},
					{ Available: 0, Occupied: 0, Cleaning: 0 },
				)
				setTableStats(stats)
			}
		}

		fetchStats()
	}, [tables])

	const calculateGridSize = (tablesOnFloor) => {
		if (tablesOnFloor.length === 0) {
			return { rows: 5, cols: 10 }
		}

		const maxX = Math.max(...tablesOnFloor.map((t) => t.gridX))
		const maxY = Math.max(...tablesOnFloor.map((t) => t.gridY))

		return {
			cols: Math.min(Math.max(maxX + 1, 1), 10),
			rows: Math.max(maxY + 1, 1),
		}
	}

	const filterTablesByFloor = (floor) => {
		return rawTablesData.filter((table) => table.floor === floor)
	}

	const getNextTableId = (floor) => {
		const tablesOnFloor = rawTablesData.filter((table) => table.floor === floor)

		if (tablesOnFloor.length === 0) {
			return floor * 100 + 1
		}

		const maxId = Math.max(...tablesOnFloor.map((table) => table.id))
		return maxId + 1
	}

	const applyFiltersAndSort = useCallback(
		(data) => {
			let filtered = [...data]

			// Filter by status
			if (filterStatus !== 'All') {
				filtered = filtered.filter((t) => t.status === filterStatus)
			}

			// Filter by location
			if (filterLocation !== 'All') {
				filtered = filtered.filter((t) => t.location === filterLocation)
			}

			// Sort
			filtered.sort((a, b) => {
				let aValue, bValue

				switch (sortBy) {
					case 'id':
						aValue = a.id
						bValue = b.id
						break
					case 'capacity':
						aValue = a.capacity
						bValue = b.capacity
						break
					case 'createdAt':
						aValue = new Date(a.createdAt || 0)
						bValue = new Date(b.createdAt || 0)
						break
					default:
						aValue = a.id
						bValue = b.id
				}

				if (sortOrder === 'asc') {
					return aValue > bValue ? 1 : -1
				} else {
					return aValue < bValue ? 1 : -1
				}
			})

			return filtered
		},
		[filterStatus, filterLocation, sortBy, sortOrder],
	)

	const fetchTableStats = useCallback(async () => {
		const stats = {
			Available: rawTablesData.filter((t) => t.status === 'Available').length,
			Occupied: rawTablesData.filter((t) => t.status === 'Occupied').length,
			Cleaning: rawTablesData.filter((t) => t.status === 'Cleaning').length,
		}
		setTableStats(stats)
	}, [])

	const fetchTables = useCallback(
		async (page) => {
			console.log(`Fetching tables for Floor/Page: ${page}`)
			setLoading(true)

			setTimeout(() => {
				const floorData = filterTablesByFloor(page)
				const filteredData = applyFiltersAndSort(floorData)
				const floorsInUse = [...new Set(rawTablesData.map((t) => t.floor))]
				const totalFloors = floorsInUse.length > 0 ? Math.max(...floorsInUse) : 1

				setTables(filteredData)
				setTotalPages(totalFloors)

				const size = calculateGridSize(floorData)
				setGridSize(size)

				setLoading(false)
			}, 300)
		},
		[applyFiltersAndSort],
	)

	const handleTableClick = (table) => {
		// Find the latest table data with QR code from tables state
		const latestTable = tables.find((t) => t.id === table.id) || table
		setSelectedTable(latestTable)
		setIsStatusModalOpen(true)
	}

	// ✅ Sync selectedTable with latest table data when tables update
	useEffect(() => {
		if (selectedTable && tables.length > 0) {
			const updatedTable = tables.find((t) => t.id === selectedTable.id)
			if (updatedTable && updatedTable.qrCodeUrl !== selectedTable.qrCodeUrl) {
				setSelectedTable(updatedTable)
			}
		}
	}, [tables, selectedTable])

	const handleStatusUpdate = async (tableId, newStatus) => {
		console.log(`Updating table ${tableId} status to ${newStatus}`)

		showLoading('updateStatus')
		try {
			// ✅ Call API to update status
			const result = await updateTableStatusAPI(tableId, newStatus)

			if (result.success) {
				// Update local state
				setTables((prevTables) =>
					prevTables.map((table) =>
						table.id === tableId ? { ...table, status: newStatus } : table,
					),
				)

				const tableIndex = rawTablesData.findIndex((table) => table.id === tableId)
				if (tableIndex !== -1) {
					rawTablesData[tableIndex].status = newStatus
				}

				await fetchTableStats()
				console.log('✅ Table status updated successfully')
			} else {
				alert(`Failed to update status: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error updating table status:', error)
			alert('Network error. Please try again.')
		} finally {
			hideLoading('updateStatus')
			setIsStatusModalOpen(false)
			setSelectedTable(null)
		}
	}

	const handleDeleteTable = async (tableId) => {
		if (!window.confirm(`Are you sure you want to delete Table ${tableId}?`)) {
			return
		}

		console.log(`Deleting table ${tableId}`)

		showLoading('deleteTable')
		try {
			// ✅ Call API to delete table
			const result = await deleteTableAPI(tableId)

			if (result.success) {
				// Update local state
				setTables((prevTables) => prevTables.filter((table) => table.id !== tableId))
				rawTablesData = rawTablesData.filter((table) => table.id !== tableId)
				console.log('✅ Table deleted successfully')
			} else {
				alert(`Failed to delete table: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error deleting table:', error)
			alert('Network error. Please try again.')
		} finally {
			hideLoading('deleteTable')
		}
	}

	const handleDragStart = (table) => {
		setDraggingTable(table)
	}

	const handleDragOver = (gridX, gridY) => {
		setDropTarget({ gridX, gridY })
	}

	const handleDragEnd = () => {
		setDraggingTable(null)
		setDropTarget(null)
	}

	const handleDrop = async (newGridX, newGridY) => {
		if (!draggingTable) return

		console.log(`Moving table ${draggingTable.id} to position (${newGridX}, ${newGridY})`)

		const isOccupied = tables.some(
			(t) => t.id !== draggingTable.id && t.gridX === newGridX && t.gridY === newGridY,
		)

		if (isOccupied) {
			showWarning('Vị trí đã có bàn', 'Vui lòng chọn vị trí trống khác.')
			setDraggingTable(null)
			setDropTarget(null)
			return
		}

		const updatedTable = {
			...draggingTable,
			gridX: newGridX,
			gridY: newGridY,
		}

		// ✅ Call API to update table position
		try {
			const result = await updateTablePositionAPI(
				draggingTable.id,
				newGridX,
				newGridY,
				draggingTable.floorId,
			)

			if (result.success) {
				// Update local state
				setTables((prevTables) =>
					prevTables.map((table) =>
						table.id === draggingTable.id ? updatedTable : table,
					),
				)

				const tableIndex = rawTablesData.findIndex((t) => t.id === draggingTable.id)
				if (tableIndex !== -1) {
					rawTablesData[tableIndex].gridX = newGridX
					rawTablesData[tableIndex].gridY = newGridY
				}

				console.log('✅ Table position updated successfully')
			} else {
				showError('Cập nhật vị trí thất bại', result.message)
			}
		} catch (error) {
			console.error('❌ Error updating table position:', error)
			// Still update local state for better UX
			setTables((prevTables) =>
				prevTables.map((table) => (table.id === draggingTable.id ? updatedTable : table)),
			)
		}

		const needsExpansion = newGridX >= gridSize.cols || newGridY >= gridSize.rows

		if (needsExpansion) {
			setGridSize({
				cols: Math.min(Math.max(gridSize.cols, newGridX + 1), 10),
				rows: Math.max(gridSize.rows, newGridY + 1),
			})
			console.log('Grid expanded due to table placement outside boundary')
		}

		setDraggingTable(null)
		setDropTarget(null)
	}

	const handleAddRow = () => {
		console.log('Manually adding row to grid')
		const newRows = gridSize.rows + 1
		setGridSize({
			...gridSize,
			rows: newRows,
		})
	}

	const handleSaveTable = async (tableData, customId = null) => {
		const floorToAdd = currentPage

		// Find empty position
		let foundPosition = false
		let newGridX = 0
		let newGridY = 0

		for (let y = 0; y < gridSize.rows && !foundPosition; y++) {
			for (let x = 0; x < gridSize.cols && !foundPosition; x++) {
				const isOccupied = tables.some((t) => t.gridX === x && t.gridY === y)
				if (!isOccupied) {
					newGridX = x
					newGridY = y
					foundPosition = true
				}
			}
		}

		if (!foundPosition) {
			newGridX = 0
			newGridY = gridSize.rows
		}

		showLoading('createTable')
		try {
			// ✅ Call API to create table
			// TODO: Get real floorId from Floor API when floor management is implemented
			// For now, create tables without floorId (optional field)

			const newTablePayload = {
				name: tableData.name,
				capacity: tableData.capacity,
				status: 'Available', // ✅ IMPORTANT: Set default status
				gridX: newGridX,
				gridY: newGridY,
				// floorId: null, // Skip floorId for now - it's optional
			}

			console.log('📋 Creating table with payload:', newTablePayload)
			const result = await createTableAPI(newTablePayload)

			if (result.success) {
				// Backend returns the created table with UUID
				const newTableData = {
					...result.table,
					floor: floorToAdd,
					location: tableData.location || 'Trong nhà',
					qrCodeUrl:
						result.table.qrCodeUrl ||
						`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table-${result.table.id}`,
				}

				console.log('✅ Table created successfully:', newTableData)
				rawTablesData.push(newTableData)

				// Refresh tables from API
				setCurrentPage(floorToAdd)
				await fetchTables(floorToAdd)
				await fetchTableStats()
			} else {
				alert(`Failed to create table: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error creating table:', error)
			alert('Network error. Please try again.')
		} finally {
			hideLoading('createTable')
		}
	}

	const handleAddTable = () => {
		setIsAddModalOpen(true)
	}

	const handleAddFloor = async () => {
		const newFloorNumber = totalPages + 1
		setTotalPages(newFloorNumber)
		setCurrentPage(newFloorNumber)
		showSuccess(
			'Thêm tầng thành công',
			`Tầng ${newFloorNumber} đã được thêm vào hệ thống.`,
		)
		fetchTables(newFloorNumber)
	}

	const handleDeleteRow = () => {
		console.log('Manually deleting last row from grid')

		if (gridSize.rows <= 1) {
			showWarning('Không thể xóa hàng', 'Lưới phải có ít nhất 1 hàng.')
			return
		}

		const lastRowIndex = gridSize.rows - 1
		const tablesInLastRow = tables.filter((t) => t.gridY === lastRowIndex)

		if (tablesInLastRow.length > 0) {
			const tableNames = tablesInLastRow.map((t) => t.name).join(', ')
			showWarning(
				'Không thể xóa hàng',
				`Các bàn sau đang ở hàng này: ${tableNames}. Vui lòng di chuyển hoặc xóa chúng trước.`,
			)
			return
		}

		const newRows = gridSize.rows - 1
		setGridSize({
			...gridSize,
			rows: newRows,
		})
	}

	const handleAddColumn = () => {
		console.log('Manually adding column to grid')

		if (gridSize.cols >= 10) {
			showWarning('Không thể thêm cột', 'Lưới chỉ được phép tối đa 10 cột.')
			return
		}

		const newCols = gridSize.cols + 1
		setGridSize({
			...gridSize,
			cols: newCols,
		})
	}

	const handleDeleteColumn = () => {
		console.log('Manually deleting last column from grid')

		if (gridSize.cols <= 1) {
			showWarning('Không thể xóa cột', 'Lưới phải có ít nhất 1 cột.')
			return
		}

		const lastColIndex = gridSize.cols - 1
		const tablesInLastCol = tables.filter((t) => t.gridX === lastColIndex)

		if (tablesInLastCol.length > 0) {
			const tableNames = tablesInLastCol.map((t) => t.name).join(', ')
			showWarning(
				'Không thể xóa cột',
				`Các bàn sau đang ở cột này: ${tableNames}. Vui lòng di chuyển hoặc xóa chúng trước.`,
			)
			return
		}

		const newCols = gridSize.cols - 1
		setGridSize({
			...gridSize,
			cols: newCols,
		})
	}

	useEffect(() => {
		if (currentPage >= 1) {
			fetchTables(currentPage)
			fetchTableStats()
		}
	}, [
		currentPage,
		fetchTables,
		fetchTableStats,
		filterStatus,
		filterLocation,
		sortBy,
		sortOrder,
	])

	const renderGrid = () => {
		const grid = []

		for (let y = 0; y < gridSize.rows; y++) {
			for (let x = 0; x < gridSize.cols; x++) {
				const tableAtPosition = tables.find((t) => t.gridX === x && t.gridY === y)

				if (tableAtPosition) {
					grid.push(
						<TableCard
							key={tableAtPosition.id}
							table={tableAtPosition}
							onClick={handleTableClick}
							onDelete={handleDeleteTable}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							isDragging={draggingTable?.id === tableAtPosition.id}
						/>,
					)
				} else {
					grid.push(
						<EmptyGridCell
							key={`${x}-${y}`}
							gridX={x}
							gridY={y}
							onDrop={handleDrop}
							onDragOver={handleDragOver}
							isDropTarget={dropTarget?.gridX === x && dropTarget?.gridY === y}
						/>,
					)
				}
			}
		}

		return grid
	}

	const renderPagination = () => {
		const links = []
		for (let i = 1; i <= totalPages; i++) {
			links.push(
				<button
					key={i}
					onClick={() => setCurrentPage(i)}
					className={`inline-flex items-center justify-center rounded-lg w-10 h-10 text-base transition-colors border-none cursor-pointer ${
						i === currentPage
							? 'bg-[#137fec] text-white'
							: 'bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white'
					}`}
				>
					{i}
				</button>,
			)
		}
		return links
	}

	// Component cho nút chức năng header
	const HeaderButton = ({ icon, text, color, onClick, disabled, title }) => {
		const colorClasses = {
			blue: 'bg-blue-600 hover:bg-blue-700 border-blue-600/30',
			cyan: 'bg-cyan-600 hover:bg-cyan-700 border-cyan-600/30',
			teal: 'bg-teal-600 hover:bg-teal-700 border-teal-600/30',
			purple: 'bg-purple-600 hover:bg-purple-700 border-purple-600/30',
			green: 'bg-green-600 hover:bg-green-700 border-green-600/30',
			gray: 'bg-gray-600 hover:bg-gray-700 border-gray-600/30 text-gray-300',
		}

		const disabledClass = disabled
			? 'bg-gray-600/50 border-gray-600/20 text-gray-400 cursor-not-allowed'
			: ''

		return (
			<button
				onClick={onClick}
				disabled={disabled}
				title={title}
				className={`
					flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
					transition-all duration-200 font-medium min-w-[120px]
					shadow-lg hover:shadow-xl active:scale-[0.98]
					${disabled ? disabledClass : colorClasses[color]}
					border-2 backdrop-blur-sm
				`}
			>
				<span className="text-xl">{icon}</span>
				<span className="text-sm font-semibold truncate">{text}</span>
			</button>
		)
	}

	return (
		<>
			<AuthenticationWarning />

			<BasePageLayout>
				<div className="min-h-screen p-8 text-white">
					<div className="max-w-7xl mx-auto h-full flex flex-col">
						<header className="page-header mb-8">
							<div className="flex justify-between items-start mb-6">
								<div className="flex flex-col gap-2">
									<h1 className="text-white text-4xl font-black leading-tight tracking-tight">
										Table Management (Floor {currentFloor})
									</h1>
									<p className="text-gray-300 text-base">
										Manage your restaurant's dining tables - Drag to rearrange
									</p>
								</div>

								{/* QR Code Operations - Using Backend APIs (4, 5) */}
								<div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10">
									<h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">
										QR Code Operations (Floor {currentFloor})
									</h3>
									<div className="flex flex-wrap gap-3 justify-center">
										{/* API 4: batchDownloadQRCodesAPI - Combined PDF */}
										<HeaderButton
											icon="📄"
											text="Tải Combined PDF"
											color="red"
											onClick={async () => {
												showLoading('Đang tạo file PDF...')
												try {
													const tableIds = rawTablesData
														.filter((t) => t.floor === currentFloor)
														.map((t) => t.id)
													const result = await batchDownloadQRCodesAPI(
														tableIds,
														null,
														'combined-pdf',
													)
													hideLoading()
													if (!result.success) alert(`❌ Lỗi: ${result.message}`)
												} catch (error) {
													hideLoading()
													alert(`❌ Lỗi: ${error.message}`)
												}
											}}
											title="Tải tất cả QR vào 1 file PDF"
										/>

										{/* API 4: batchDownloadQRCodesAPI - ZIP PNG */}
										<HeaderButton
											icon="🗜️"
											text="Tải ZIP PNG"
											color="blue"
											onClick={async () => {
												showLoading('Đang tạo file ZIP...')
												try {
													const tableIds = rawTablesData
														.filter((t) => t.floor === currentFloor)
														.map((t) => t.id)
													const result = await batchDownloadQRCodesAPI(
														tableIds,
														null,
														'zip-png',
													)
													hideLoading()
													if (!result.success) alert(`❌ Lỗi: ${result.message}`)
												} catch (error) {
													hideLoading()
													alert(`❌ Lỗi: ${error.message}`)
												}
											}}
											title="Tải tất cả QR dạng PNG trong ZIP"
										/>

										{/* API 4: batchDownloadQRCodesAPI - ZIP PDF */}
										<HeaderButton
											icon="📦"
											text="Tải ZIP PDF"
											color="cyan"
											onClick={async () => {
												showLoading('Đang tạo file ZIP...')
												try {
													const tableIds = rawTablesData
														.filter((t) => t.floor === currentFloor)
														.map((t) => t.id)
													const result = await batchDownloadQRCodesAPI(
														tableIds,
														null,
														'zip-pdf',
													)
													hideLoading()
													if (!result.success) alert(`❌ Lỗi: ${result.message}`)
												} catch (error) {
													hideLoading()
													alert(`❌ Lỗi: ${error.message}`)
												}
											}}
											title="Tải tất cả QR dạng PDF trong ZIP"
										/>

										{/* API 5: bulkRegenerateQRCodesAPI */}
										<HeaderButton
											icon="🔄"
											text="Tạo lại tất cả QR"
											color="orange"
											onClick={async () => {
												const floorTables = rawTablesData.filter(
													(t) => t.floor === currentFloor,
												)
												if (
													window.confirm(
														`Bạn có chắc muốn tạo lại QR Code cho ${floorTables.length} bàn trên tầng ${currentFloor}?\nTất cả QR cũ sẽ không còn hoạt động.`,
													)
												) {
													showLoading('Đang tạo lại QR Code...')
													try {
														const tableIds = floorTables.map((t) => t.id)
														const result = await bulkRegenerateQRCodesAPI(tableIds, null)
														hideLoading()

														if (result.success) {
															showSuccess(
																'Tạo QR thành công',
																`Đã tạo mới ${result.regeneratedCount} QR Code!`,
															)
															window.location.reload()
														} else {
															showError('Lỗi tạo QR', result.message)
														}
													} catch (error) {
														hideLoading()
														showError('Lỗi', error.message)
													}
												}
											}}
											title="Tạo lại QR Code cho tất cả bàn trên tầng này"
										/>
									</div>
								</div>
							</div>
						</header>

						{/* Filter and Sort Controls */}
						<div className="mb-6 bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
							<div className="flex flex-wrap gap-6">
								{/* Filter by Status */}
								<div className="flex items-center gap-3">
									<label className="text-sm font-semibold text-gray-300">
										Lọc trạng thái:
									</label>
									<select
										value={filterStatus}
										onChange={(e) => setFilterStatus(e.target.value)}
										className="px-4 py-2 bg-black/30 border-2 border-white/10 rounded-lg text-white focus:outline-none focus:border-[#137fec] transition-colors"
									>
										<option value="All" className="bg-gray-900">
											Tất cả (
											{tableStats.Available + tableStats.Occupied + tableStats.Cleaning})
										</option>
										<option value="Available" className="bg-gray-900">
											Trống ({tableStats.Available})
										</option>
										<option value="Occupied" className="bg-gray-900">
											Đang sử dụng ({tableStats.Occupied})
										</option>
										<option value="Cleaning" className="bg-gray-900">
											Đang dọn dẹp ({tableStats.Cleaning})
										</option>
									</select>
								</div>

								{/* Filter by Location */}
								<div className="flex items-center gap-3">
									<label className="text-sm font-semibold text-gray-300">
										Lọc vị trí:
									</label>
									<select
										value={filterLocation}
										onChange={(e) => setFilterLocation(e.target.value)}
										className="px-4 py-2 bg-black/30 border-2 border-white/10 rounded-lg text-white focus:outline-none focus:border-[#137fec] transition-colors"
									>
										<option value="All" className="bg-gray-900">
											Tất cả
										</option>
										<option value="Trong nhà" className="bg-gray-900">
											Trong nhà
										</option>
										<option value="Ngoài trời" className="bg-gray-900">
											Ngoài trời
										</option>
										<option value="Phòng VIP" className="bg-gray-900">
											Phòng VIP
										</option>
										<option value="Khu gia đình" className="bg-gray-900">
											Khu gia đình
										</option>
										<option value="Quầy bar" className="bg-gray-900">
											Quầy bar
										</option>
									</select>
								</div>

								{/* Sort By */}
								<div className="flex items-center gap-3">
									<label className="text-sm font-semibold text-gray-300">
										Sắp xếp theo:
									</label>
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value)}
										className="px-4 py-2 bg-black/30 border-2 border-white/10 rounded-lg text-white focus:outline-none focus:border-[#137fec] transition-colors"
									>
										<option value="id" className="bg-gray-900">
											Số bàn
										</option>
										<option value="capacity" className="bg-gray-900">
											Sức chứa
										</option>
										<option value="createdAt" className="bg-gray-900">
											Ngày tạo
										</option>
									</select>
								</div>

								{/* Sort Order */}
								<div className="flex items-center gap-3">
									<label className="text-sm font-semibold text-gray-300">Thứ tự:</label>
									<select
										value={sortOrder}
										onChange={(e) => setSortOrder(e.target.value)}
										className="px-4 py-2 bg-black/30 border-2 border-white/10 rounded-lg text-white focus:outline-none focus:border-[#137fec] transition-colors"
									>
										<option value="asc" className="bg-gray-900">
											Tăng dần
										</option>
										<option value="desc" className="bg-gray-900">
											Giảm dần
										</option>
									</select>
								</div>

								{/* Reset Filters */}
								<button
									onClick={() => {
										setFilterStatus('All')
										setFilterLocation('All')
										setSortBy('id')
										setSortOrder('asc')
									}}
									className="px-4 py-2 bg-red-600/20 border-2 border-red-600/30 text-red-400 rounded-lg hover:bg-red-600/40 hover:border-red-500 transition-colors font-semibold"
								>
									🔄 Đặt lại
								</button>
							</div>
						</div>

						{/* Grid Controls */}
						<div className="mb-6 flex items-center gap-6 bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-gray-300">Row Controls:</span>
								<div className="flex gap-1">
									<button
										onClick={handleAddRow}
										className="w-8 h-8 flex items-center justify-center rounded bg-blue-600/20 backdrop-blur-md text-blue-400 hover:bg-blue-600/40 hover:text-blue-300 border border-blue-600/30 transition-colors text-lg"
										title="Add Row to Grid"
									>
										+
									</button>
									<button
										onClick={handleDeleteRow}
										disabled={gridSize.rows <= 1}
										className="w-8 h-8 flex items-center justify-center rounded bg-red-600/20 backdrop-blur-md text-red-400 hover:bg-red-600/40 hover:text-red-300 border border-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
										title="Delete Last Row"
									>
										−
									</button>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-gray-300">
									Column Controls:
								</span>
								<div className="flex gap-1">
									<button
										onClick={handleAddColumn}
										disabled={gridSize.cols >= 10}
										className="w-8 h-8 flex items-center justify-center rounded bg-blue-600/20 backdrop-blur-md text-blue-400 hover:bg-blue-600/40 hover:text-blue-300 border border-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
										title="Add Column to Grid (Max 10)"
									>
										+
									</button>
									<button
										onClick={handleDeleteColumn}
										disabled={gridSize.cols <= 1}
										className="w-8 h-8 flex items-center justify-center rounded bg-red-600/20 backdrop-blur-md text-red-400 hover:bg-red-600/40 hover:text-red-300 border border-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
										title="Delete Last Column"
									>
										−
									</button>
								</div>
							</div>

							<div className="ml-auto flex items-center gap-4">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-green-600/30 border border-green-600/50"></div>
									<span className="text-xs text-gray-400">Trống</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-red-600/30 border border-red-600/50"></div>
									<span className="text-xs text-gray-400">Đang sử dụng</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-yellow-600/30 border border-yellow-600/50"></div>
									<span className="text-xs text-gray-400">Đang dọn dẹp</span>
								</div>
								<div className="text-sm text-gray-400 ml-4">
									Total: {tables.length} tables
								</div>
							</div>
						</div>

						<div className="flex-1 mb-8">
							{tables.length > 0 || gridSize.rows > 0 ? (
								<div>
									<div
										className="grid gap-6"
										style={{
											gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
										}}
									>
										{renderGrid()}
									</div>
									<div className="mt-6 max-w-xs">
										<AddTableQuickCard onClick={handleAddTable} />
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-10">
									<p className="text-gray-300 text-center mb-4">
										No tables found on this floor.
									</p>
									<AddTableQuickCard onClick={handleAddTable} />
								</div>
							)}
						</div>

						{/* Floor Operations - Moved to bottom */}
						<div className="mt-6 bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10">
							<h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">
								Floor Operations
							</h3>
							<div className="flex flex-wrap gap-4 justify-center">
								<HeaderButton
									icon="➕"
									text="Add Floor"
									color="blue"
									onClick={handleAddFloor}
									title="Add New Floor"
								/>
							</div>
						</div>

						{/* Pagination moved to bottom */}
						<div className="mt-6 pt-6 border-t border-white/10">
							<div className="flex items-center justify-between">
								<div className="text-sm text-gray-400">
									Floor {currentFloor} of {totalPages}
								</div>

								{totalPages > 1 && (
									<nav className="flex items-center space-x-2">
										<button
											onClick={() => setCurrentPage(currentPage - 1)}
											disabled={currentPage === 1}
											className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											title="Previous Floor"
										>
											←
										</button>
										{renderPagination()}
										<button
											onClick={() => setCurrentPage(currentPage + 1)}
											disabled={currentPage === totalPages}
											className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											title="Next Floor"
										>
											→
										</button>
									</nav>
								)}
							</div>
						</div>
					</div>
				</div>
			</BasePageLayout>

			<TableStatusModal
				isOpen={isStatusModalOpen}
				onClose={() => {
					setIsStatusModalOpen(false)
					setSelectedTable(null)
				}}
				table={selectedTable}
				onUpdateStatus={handleStatusUpdate}
			/>

			<AddTableModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleSaveTable}
				existingTables={rawTablesData}
				floor={currentFloor}
			/>
		</>
	)
}

export default RestaurantTableManagement
