import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import {
	getTablesAPI,
	createTableAPI,
	deleteTableAPI,
	updateTableStatusAPI,
	updateTablePositionAPI,
	updateTableAPI,
	getTableStatsAPI,
	getTableQRCodeAPI,
	regenerateTableQRAPI,
	bulkRegenerateQRCodesAPI,
	downloadTableQRCodeAPI,
	batchDownloadQRCodesAPI,
	validateQRScanAPI,
} from '../../../services/api/tableAPI'
import {
	getFloorsAPI,
	createFloorAPI,
	deleteFloorAPI,
} from '../../../services/api/floorAPI'
import AddTableModal from './AddTableModal'
import AddFloorModal from './AddFloorModal'
import { useLoading } from '../../../contexts/LoadingContext'
import { useAlert } from '../../../contexts/AlertContext'
import { useUser } from '../../../contexts/UserContext'
import { InlineLoader, SkeletonLoader } from '../../../components/common/LoadingSpinner'
import AuthenticationWarning from '../../../components/common/AuthenticationWarning'

// rawTablesData will be populated from API
let rawTablesData = []

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

				{/* Ngày tạo - Giảm kích thước */}
				<p
					className="text-white/75 leading-tight text-center overflow-hidden text-ellipsis whitespace-nowrap w-full transition-all duration-300"
					style={{
						fontSize: 'clamp(5px, min(1.5vw, 1.5vh), 11px)',
						marginTop: 'clamp(1px, 1%, 4px)',
						fontWeight: '500',
						transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
					}}
				>
					{table.createdAt ? new Date(table.createdAt).toLocaleDateString('vi-VN') : ''}
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
const TableStatusModal = ({
	isOpen,
	onClose,
	table,
	onUpdateStatus,
	onUpdateInfo,
	showConfirm,
	showSuccess,
	showError,
	showLoading,
	hideLoading,
}) => {
	const modalRef = React.useRef(null)
	const nameInputRef = React.useRef(null)
	const capacityInputRef = React.useRef(null)
	const [isVisible, setIsVisible] = useState(false)
	const [isEditMode, setIsEditMode] = useState(false)
	const [editedName, setEditedName] = useState('')
	const [editedCapacity, setEditedCapacity] = useState('')
	const [isSaving, setIsSaving] = useState(false)

	// Initialize edit values when table changes
	useEffect(() => {
		if (table) {
			setEditedName(table.name || '')
			setEditedCapacity(table.capacity?.toString() || '')
		}
	}, [table])

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
					<div className="flex items-center gap-2">
						{!isEditMode && (
							<button
								onClick={() => setIsEditMode(true)}
								className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
								title="Chỉnh sửa thông tin bàn"
							>
								<span className="material-symbols-outlined">edit</span>
							</button>
						)}
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white hover:bg-red-600/20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
						>
							✕
						</button>
					</div>
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
											showLoading('Đang tải PNG...')
											try {
												console.log('📥 Downloading PNG for table:', table.id, table.name)
												// Try backend API first
												const result = await downloadTableQRCodeAPI(table.id, 'png')
												hideLoading()
												if (!result.success) {
													console.error('❌ Backend download failed:', result.message)
													// Fallback: Download from base64 if backend fails
													console.warn('⚠️ Using fallback: downloading from base64 cache')
													if (table.qrCodeUrl) {
														const link = document.createElement('a')
														link.href = table.qrCodeUrl
														link.download = `${table.name}_QR.png`
														document.body.appendChild(link)
														link.click()
														document.body.removeChild(link)
														showSuccess('✅ Đã tải PNG từ cache')
													} else {
														showError('❌ Lỗi tải PNG', result.message)
													}
												} else {
													showSuccess('✅ Đã tải PNG thành công')
												}
											} catch (error) {
												hideLoading()
												console.error('❌ Download PNG error:', error)
												showError('❌ Lỗi tải PNG', error.message || 'Lỗi không xác định')
											}
										}}
										className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-blue-600/20 border border-blue-600/30 text-blue-400 rounded-lg hover:bg-blue-600/40 hover:border-blue-500 transition-all duration-200 text-xs"
										title="Tải QR PNG"
									>
										<span>📥</span>
										<span className="font-semibold">PNG</span>
									</button>
									<button
										onClick={async () => {
											showLoading('Đang tải PDF...')
											try {
												console.log('📥 Downloading PDF for table:', table.id, table.name)
												// Try backend API first
												const result = await downloadTableQRCodeAPI(table.id, 'pdf')
												hideLoading()
												if (!result.success) {
													console.error('❌ Backend download failed:', result.message)
													showError(
														'❌ Lỗi tải PDF',
														result.message ||
															'Backend chưa hỗ trợ tải PDF. Vui lòng sử dụng In QR Code hoặc tải PNG.',
													)
												} else {
													showSuccess('✅ Đã tải PDF thành công')
												}
											} catch (error) {
												hideLoading()
												console.error('❌ Download PDF error:', error)
												showError('❌ Lỗi tải PDF', error.message || 'Lỗi không xác định')
											}
										}}
										className="flex flex-col items-center justify-center gap-1 px-2 py-2 bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg hover:bg-red-600/40 hover:border-red-500 transition-all duration-200 text-xs"
										title="Tải QR PDF"
									>
										<span>📥</span>
										<span className="font-semibold">PDF</span>
									</button>
									<button
										onClick={async () => {
											showLoading('Đang tải SVG...')
											try {
												console.log('📥 Downloading SVG for table:', table.id, table.name)
												// Try backend API first
												const result = await downloadTableQRCodeAPI(table.id, 'svg')
												hideLoading()
												if (!result.success) {
													console.error('❌ Backend download failed:', result.message)
													showError(
														'❌ Lỗi tải SVG',
														result.message ||
															'Backend chưa hỗ trợ tải SVG. Vui lòng sử dụng PNG.',
													)
												} else {
													showSuccess('✅ Đã tải SVG thành công')
												}
											} catch (error) {
												hideLoading()
												console.error('❌ Download SVG error:', error)
												showError('❌ Lỗi tải SVG', error.message || 'Lỗi không xác định')
											}
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
										const confirmed = await showConfirm(
											'Tạo lại QR Code',
											`Bạn có chắc muốn tạo lại QR Code cho ${table.name}?\nQR cũ sẽ không còn hoạt động.`,
										)
										if (confirmed) {
											const result = await regenerateTableQRAPI(table.id)
											if (result.success) {
												showSuccess(
													'QR Code đã được tạo mới!',
													'QR cũ đã hết hạn và không còn hoạt động.',
												)
												onClose()
												// Trigger refetch instead of full page reload
												setRefreshTrigger((prev) => prev + 1)
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
							{/* Tên Bàn - Editable */}
							<div className="bg-black/30 rounded-lg p-4 border border-white/10">
								<p className="text-xs text-gray-400 mb-1">Tên Bàn</p>
								{isEditMode ? (
									<input
										ref={nameInputRef}
										type="text"
										value={editedName}
										onChange={(e) => {
											setEditedName(e.target.value)
											setTimeout(() => nameInputRef.current?.focus(), 0)
										}}
										className="w-full bg-white/10 text-white text-lg font-bold rounded px-2 py-1 border border-white/20 focus:outline-none focus:border-blue-500"
										placeholder="Nhập tên bàn"
										maxLength={50}
									/>
								) : (
									<p className="text-lg font-bold text-white">{table.name}</p>
								)}
							</div>
							{/* Sức Chứa - Editable */}
							<div className="bg-black/30 rounded-lg p-4 border border-white/10">
								<p className="text-xs text-gray-400 mb-1">Sức Chứa</p>
								{isEditMode ? (
									<input
										ref={capacityInputRef}
										type="number"
										value={editedCapacity}
										onChange={(e) => {
											setEditedCapacity(e.target.value)
											setTimeout(() => capacityInputRef.current?.focus(), 0)
										}}
										className="w-full bg-white/10 text-white text-lg font-bold rounded px-2 py-1 border border-white/20 focus:outline-none focus:border-blue-500"
										placeholder="Số chỗ"
										min="1"
										max="20"
									/>
								) : (
									<p className="text-lg font-bold text-white">{table.capacity} chỗ</p>
								)}
							</div>
							<div className="bg-black/30 rounded-lg p-4 border border-white/10">
								<p className="text-xs text-gray-400 mb-1">Ngày Tạo</p>
								<p className="text-lg font-bold text-white">
									{table.createdAt
										? new Date(table.createdAt).toLocaleDateString('vi-VN', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
											})
										: 'N/A'}
								</p>
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

						{/* Payment Button - Only show when table is Occupied */}
						{table.status === 'Occupied' && (
							<div className="mt-4 bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-lg p-4 border-2 border-green-500/50">
								<div className="flex items-center justify-between mb-3">
									<div>
										<p className="text-sm font-semibold text-green-400 mb-1">
											THANH TOÁN BÀN
										</p>
										<p className="text-xs text-gray-400">Xử lý thanh toán và trả bàn</p>
									</div>
									<span className="material-symbols-outlined text-3xl text-green-400">
										payments
									</span>
								</div>
								<button
									onClick={async () => {
										const confirmed = await showConfirm(
											'Xác nhận thanh toán',
											`Bạn có chắc chắn muốn thanh toán cho ${table.name}? Bàn sẽ được chuyển sang trạng thái "Đang dọn dẹp".`,
										)
										if (confirmed) {
											showLoading('Đang xử lý thanh toán...')
											// TODO: Call payment API
											// await axios.post(`/api/tables/${table.id}/checkout`)

											// Simulate API call
											setTimeout(async () => {
												await onUpdateStatus(table.id, 'Cleaning')
												hideLoading()
												showSuccess(
													'Thanh toán thành công',
													'Bàn đã được chuyển sang trạng thái dọn dẹp',
												)
											}, 1500)
										}
									}}
									className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-base font-bold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-green-500/50"
								>
									<span className="material-symbols-outlined">paid</span>
									<span>Thanh Toán</span>
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Close Button */}
				<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
					{isEditMode ? (
						<>
							<button
								onClick={() => {
									setIsEditMode(false)
									setEditedName(table.name)
									setEditedCapacity(table.capacity?.toString() || '')
								}}
								disabled={isSaving}
								className="h-10 px-4 rounded-lg bg-gray-600/40 backdrop-blur-md text-white text-sm font-bold hover:bg-gray-600/60 transition-colors disabled:opacity-50"
							>
								Hủy
							</button>
							<button
								onClick={async () => {
									// Validation
									if (!editedName.trim()) {
										showWarning('Lỗi nhập liệu', 'Tên bàn không được để trống')
										return
									}
									const capacity = parseInt(editedCapacity)
									if (!capacity || capacity < 1 || capacity > 20) {
										showWarning('Lỗi nhập liệu', 'Sức chứa phải từ 1 đến 20 chỗ')
										return
									}

									setIsSaving(true)
									const result = await onUpdateInfo(table.id, {
										name: editedName.trim(),
										capacity: capacity,
									})
									setIsSaving(false)

									if (result) {
										setIsEditMode(false)
									}
								}}
								disabled={isSaving}
								className="h-10 px-4 rounded-lg bg-blue-600 backdrop-blur-md text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
							>
								{isSaving ? (
									<>
										<svg
											className="animate-spin h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										<span>Đang lưu...</span>
									</>
								) : (
									'Lưu thay đổi'
								)}
							</button>
						</>
					) : (
						<button
							onClick={onClose}
							className="h-10 px-4 rounded-lg bg-black/40 backdrop-blur-md text-white text-sm font-bold hover:bg-black/60 transition-colors"
						>
							Đóng
						</button>
					)}
				</div>
			</div>
		</div>
	)

	// Render using Portal directly to body
	return ReactDOM.createPortal(<ModalContent />, document.body)
}

const RestaurantTableManagement = () => {
	const { showLoading, hideLoading } = useLoading()
	const { showAlert, showSuccess, showError, showWarning, showInfo, showConfirm } =
		useAlert()
	const { user, loading: authLoading } = useUser()
	const [tables, setTables] = useState([])
	const [floors, setFloors] = useState([])
	const [currentFloorId, setCurrentFloorId] = useState(null)
	const [loading, setLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(0)
	const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
	const [selectedTable, setSelectedTable] = useState(null)
	const [draggingTable, setDraggingTable] = useState(null)
	const [dropTarget, setDropTarget] = useState(null)
	const [gridSize, setGridSize] = useState({ rows: 4, cols: 4 })
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false)

	// Filter and Sort states
	const [filterStatus, setFilterStatus] = useState('All')
	const [filterLocation, setFilterLocation] = useState('All')
	const [sortBy, setSortBy] = useState('id')
	const [sortOrder, setSortOrder] = useState('asc')
	const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false)
	const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
	const [refreshTrigger, setRefreshTrigger] = useState(0)
	const [tableStats, setTableStats] = useState({
		Available: 0,
		Occupied: 0,
		Cleaning: 0,
	})
	// 🚀 QR Code cache to prevent re-fetching
	const [qrCodeCache, setQrCodeCache] = useState(new Map())

	const currentFloor = currentPage

	// 🚀 Lazy load QR code for a specific table (with caching)
	const fetchTableQRCode = async (tableId) => {
		// Check cache first
		if (qrCodeCache.has(tableId)) {
			console.log('✅ QR code found in cache for table:', tableId)
			return qrCodeCache.get(tableId)
		}

		try {
			const qrResult = await getTableQRCodeAPI(tableId)
			if (qrResult.success && qrResult.image) {
				const qrDataUrl = qrResult.image.startsWith('data:')
					? qrResult.image
					: `data:image/png;base64,${qrResult.image}`

				// Cache the QR code
				setQrCodeCache((prev) => new Map(prev).set(tableId, qrDataUrl))

				// Update rawTablesData
				const tableIndex = rawTablesData.findIndex((t) => t.id === tableId)
				if (tableIndex !== -1) {
					rawTablesData[tableIndex].qrCodeUrl = qrDataUrl
				}

				// Update tables state
				setTables((prev) =>
					prev.map((t) => (t.id === tableId ? { ...t, qrCodeUrl: qrDataUrl } : t)),
				)

				return qrDataUrl
			}
		} catch (error) {
			console.warn(`⚠️ Failed to fetch QR for table ${tableId}:`, error)
		}
		return null
	}

	// ✅ Fetch floors from API when component mounts
	useEffect(() => {
		// ⏳ Wait for authentication to complete before fetching data
		if (authLoading) {
			console.log('⏳ Waiting for authentication to complete...')
			return
		}

		// ✅ Check if user is authenticated and token exists
		if (!user || !window.accessToken) {
			console.log('⚠️ No user or token found, skipping floor fetch')
			return
		}

		console.log('✅ Authentication complete, fetching floors...')

		const fetchFloors = async () => {
			try {
				const floorsData = await getFloorsAPI()

				// Ensure floorsData is an array
				const floorsArray = Array.isArray(floorsData) ? floorsData : []
				setFloors(floorsArray)

				if (floorsArray.length > 0) {
					// Sort by floorNumber and get smallest
					const sortedFloors = [...floorsArray].sort(
						(a, b) => a.floorNumber - b.floorNumber,
					)
					const firstFloor = sortedFloors[0]

					setCurrentPage(firstFloor.floorNumber)
					setCurrentFloorId(firstFloor.id)
					setTotalPages(floorsArray.length)
				} else {
					// No floors exist - show empty state
					setTotalPages(0)
					setCurrentFloorId(null)
				}
			} catch (error) {
				console.error('❌ Failed to fetch floors:', error)
				console.error('❌ Error details:', error.response?.data)
				console.error('❌ Error status:', error.response?.status)
				setFloors([])
				setCurrentFloorId(null)
				showError(`Không thể tải danh sách tầng: ${error.message}`)
			}
		}
		fetchFloors()
	}, [authLoading, user])

	// ✅ Fetch tables from API when floor changes or filters change
	useEffect(() => {
		// Don't fetch if no floor is selected
		if (!currentFloorId) {
			return
		}

		const fetchTables = async () => {
			showLoading('fetchTables')
			try {
				const floorId = currentFloorId
				const currentFloorData = floors.find((f) => f.id === currentFloorId)

				// ✅ Backend ListTablesDto expects: floorId (UUID), status, isActive
				// ⚠️ Backend does NOT support: location, sortBy, sortOrder, floor (number)
				const apiParams = {
					floorId: floorId, // ✅ Required: Filter by floorId UUID
					status: filterStatus !== 'All' ? filterStatus : undefined,
					// Note: location, sortBy, sortOrder are ignored by backend
					location: filterLocation !== 'All' ? filterLocation : undefined,
					sortBy: sortBy,
					sortOrder: sortOrder,
				}

				const result = await getTablesAPI(currentFloor, apiParams)

				if (result.success) {
					// Update rawTablesData with real data from backend
					rawTablesData = result.tables.map((table) => ({
						...table,
						// Add frontend-only fields if not present
						floor: currentFloor, // Infer from current floor
						location: table.location || 'Trong nhà', // Default if missing
						qrCodeUrl: null, // Will be lazy-loaded when modal opens
					}))

					// Ensure location field exists in state tables
					setTables(
						result.tables.map((table) => ({
							...table,
							location: table.location || 'Trong nhà', // Default if missing
							qrCodeUrl: null, // Lazy load QR codes to prevent rate limiting
						})),
					)

					// 🚀 OPTIMIZATION: Remove automatic QR fetching to prevent rate limiting
					// QR codes will be fetched on-demand when user opens table modal
					// This prevents 429 Too Many Requests errors from backend

					// Update total floors
					if (result.totalFloors) {
						setTotalPages(result.totalFloors)
					}

					// ✅ Calculate and update grid size based on tables (enforce minimum 4x4)
					const newGridSize = calculateGridSize(rawTablesData)
					setGridSize(newGridSize)
				} else {
					console.warn('⚠️ Failed to fetch tables from API, using mock data')
					// Fallback to mock data
					const mockTables = filterTablesByFloor(currentFloor)
					setTables(mockTables)

					// Update grid size for mock data
					const newGridSize = calculateGridSize(mockTables)
					setGridSize(newGridSize)
				}
			} catch (error) {
				console.error('❌ Error fetching tables:', error)
				// Fallback to mock data
				const mockTables = filterTablesByFloor(currentFloor)
				setTables(mockTables)

				// Update grid size for mock data
				const newGridSize = calculateGridSize(mockTables)
				setGridSize(newGridSize)
			} finally {
				hideLoading('fetchTables')
			}
		}

		fetchTables()
	}, [
		currentFloorId,
		filterStatus,
		filterLocation,
		sortBy,
		sortOrder,
		showLoading,
		hideLoading,
		floors, // ✅ Add floors to dependencies to refetch when floors change
		refreshTrigger, // ✅ Trigger refetch when this changes
	])

	// ✅ Fetch table stats from API
	useEffect(() => {
		const fetchStats = async () => {
			try {
				const result = await getTableStatsAPI()
				if (result.success && result.stats) {
					setTableStats(result.stats)
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
		// If no tables, return minimum 4x4
		if (!tablesOnFloor || tablesOnFloor.length === 0) {
			return { rows: 4, cols: 4 }
		}

		// Calculate based on table positions, but enforce minimum 4x4
		const maxX = Math.max(...tablesOnFloor.map((t) => t.gridX || 0))
		const maxY = Math.max(...tablesOnFloor.map((t) => t.gridY || 0))

		// Always use minimum 4x4, expand only if tables need more space
		return {
			cols: Math.max(maxX + 1, 4),
			rows: Math.max(maxY + 1, 4),
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

			// ⚠️ Status filter is already applied by backend, no need to filter again

			// Filter by location (backend doesn't support this)
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

	const handleTableClick = async (table) => {
		// Find the latest table data from tables state
		const latestTable = tables.find((t) => t.id === table.id) || table
		setSelectedTable(latestTable)
		setIsStatusModalOpen(true)

		// 🚀 Lazy load QR code if not already loaded
		if (!latestTable.qrCodeUrl) {
			console.log('🔄 Fetching QR code for table:', latestTable.id)
			const qrCodeUrl = await fetchTableQRCode(latestTable.id)
			if (qrCodeUrl) {
				// Update selected table with QR code
				setSelectedTable((prev) => (prev ? { ...prev, qrCodeUrl } : prev))
			}
		}
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
			} else {
				showError('Cập nhật thất bại', `Không thể cập nhật trạng thái: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error updating table status:', error)
			showError('Lỗi kết nối', 'Lỗi mạng. Vui lòng thử lại.')
		} finally {
			hideLoading('updateStatus')
			setIsStatusModalOpen(false)
			setSelectedTable(null)
		}
	}

	const handleUpdateTableInfo = async (tableId, updateData) => {
		showLoading('updateTable')
		try {
			// ✅ Call API to update table info (name, capacity)
			const result = await updateTableAPI(tableId, updateData)

			if (result.success) {
				showSuccess('Cập nhật thành công', `Thông tin bàn đã được cập nhật!`)

				// Update local state
				setTables((prevTables) =>
					prevTables.map((table) =>
						table.id === tableId ? { ...table, ...updateData } : table,
					),
				)

				const tableIndex = rawTablesData.findIndex((table) => table.id === tableId)
				if (tableIndex !== -1) {
					Object.assign(rawTablesData[tableIndex], updateData)
				}

				// Update selectedTable to reflect changes immediately
				if (selectedTable && selectedTable.id === tableId) {
					setSelectedTable({ ...selectedTable, ...updateData })
				}

				return true
			} else {
				showError('Cập nhật thất bại', result.message)
				return false
			}
		} catch (error) {
			console.error('❌ Error updating table info:', error)
			showError('Lỗi', error?.message || 'Không thể cập nhật thông tin bàn')
			return false
		} finally {
			hideLoading('updateTable')
		}
	}

	const handleDeleteTable = async (tableId) => {
		const confirmed = await showConfirm(
			'Xác nhận xóa bàn',
			`Bạn có chắc chắn muốn xóa bàn này?\nHành động này không thể hoàn tác.`,
		)
		if (!confirmed) {
			return
		}

		showLoading('deleteTable')
		try {
			// ✅ Call API to delete table
			const result = await deleteTableAPI(tableId)

			if (result.success) {
				// Update local state
				setTables((prevTables) => prevTables.filter((table) => table.id !== tableId))
				rawTablesData = rawTablesData.filter((table) => table.id !== tableId)
			} else {
				showError('Xóa thất bại', `Không thể xóa bàn: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error deleting table:', error)
			showError('Lỗi kết nối', 'Lỗi mạng. Vui lòng thử lại.')
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
		}

		setDraggingTable(null)
		setDropTarget(null)
	}

	const handleAddRow = () => {
		const newRows = gridSize.rows + 1
		setGridSize({
			...gridSize,
			rows: newRows,
		})
	}

	const handleSaveTable = async (tableData, customId = null) => {
		const floorToAdd = currentPage

		// ✅ Validate floorId before creating table
		const floorIdToUse = tableData.floorId || currentFloorId
		if (!floorIdToUse) {
			showError('Lỗi', 'Vui lòng chọn tầng trước khi tạo bàn')
			return
		}

		// ✅ Verify floor exists in floors array
		const floorExists = floors.find((f) => f.id === floorIdToUse)
		if (!floorExists) {
			showWarning('Đang đồng bộ dữ liệu', 'Vui lòng đợi một chút rồi thử lại')
			console.log('⚠️ Floor not found in state:', {
				floorIdToUse,
				currentFloorId,
				floorsInState: floors.map((f) => ({ id: f.id, name: f.name })),
			})
			// Force refetch floors
			try {
				const floorsData = await getFloorsAPI()
				const floorsArray = Array.isArray(floorsData) ? floorsData : []
				setFloors(floorsArray)
				// Also try to find and set the correct floor
				const foundFloor = floorsArray.find((f) => f.id === floorIdToUse)
				if (foundFloor) {
					setCurrentFloorId(foundFloor.id)
					setCurrentPage(foundFloor.floorNumber)
				}
			} catch (error) {
				console.error('Error refetching floors:', error)
			}
			return
		}

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
			const newTablePayload = {
				name: tableData.name,
				capacity: tableData.capacity,
				status: 'Available',
				gridX: newGridX,
				gridY: newGridY,
				floorId: tableData.floorId || currentFloorId, // ✅ Use floorId from tableData or fallback to currentFloorId
			}

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

				rawTablesData.push(newTableData)

				// ✅ FIX: Trigger API refetch instead of using local fetchTables
				// The useEffect with currentFloorId dependency will handle the actual API call
				setRefreshTrigger((prev) => prev + 1)
				showSuccess('Tạo bàn thành công!')
			} else {
				showError('Tạo bàn thất bại', `Không thể tạo bàn: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Error creating table:', error)
			showError('Lỗi kết nối', 'Lỗi mạng. Vui lòng thử lại.')
		} finally {
			hideLoading('createTable')
		}
	}

	const handleAddTable = () => {
		setIsAddModalOpen(true)
	}

	const handleAddFloor = () => {
		setIsAddFloorModalOpen(true)
	}

	const handleCreateFloor = async (floorData) => {
		showLoading('createFloor')
		try {
			const result = await createFloorAPI(floorData)

			if (result.success) {
				showSuccess('Tạo tầng mới thành công!')

				// Re-fetch floors to update count
				const floorsData = await getFloorsAPI()
				const floorsArray = Array.isArray(floorsData) ? floorsData : []

				// ✅ FIX: Get the new floor from the fetched data to ensure consistency
				const newFloorFromAPI = floorsArray.find((f) => f.id === result.floor.id)

				// ✅ Update state in correct order
				// 1. Update floors first (so the new floor exists in state)
				setFloors(floorsArray)
				setTotalPages(floorsArray.length)

				// 2. Clear tables for the new floor (it's empty)
				setTables([])
				rawTablesData = []

				// 3. Switch to the newly created floor using data from API
				const newFloorNumber = newFloorFromAPI?.floorNumber || result.floor.floorNumber
				const newFloorId = newFloorFromAPI?.id || result.floor.id

				setCurrentPage(newFloorNumber)
				setCurrentFloorId(newFloorId)

				console.log('✅ Floor created and state updated:', {
					newFloorId,
					newFloorNumber,
					totalFloors: floorsArray.length,
					floorsInState: floorsArray.map((f) => ({ id: f.id, name: f.name })),
				})

				setIsAddFloorModalOpen(false)

				// ✅ FIX: Delay refresh trigger to ensure state updates are processed
				setTimeout(() => {
					setRefreshTrigger((prev) => prev + 1)
				}, 50)
			} else {
				showError('Không thể tạo tầng mới')
			}
		} catch (error) {
			console.error('❌ Error creating floor:', error)
			showError(error.message || 'Lỗi khi tạo tầng mới')
		} finally {
			hideLoading('createFloor')
		}
	}

	const handleDeleteFloor = async () => {
		if (!currentFloorId) {
			showWarning('Không có tầng nào để xóa')
			return
		}

		const currentFloorData = floors.find((f) => f.id === currentFloorId)
		const floorName = currentFloorData?.name || `Tầng ${currentPage}`

		const confirmed = await showConfirm(
			`Xóa tầng "${floorName}"`,
			`Bạn có chắc chắn muốn XÓA tầng này?\n\nLưu ý:\n- Tất cả bàn ăn trên tầng này sẽ KHÔNG bị xóa\n- Các bàn sẽ không còn liên kết với tầng này`,
		)
		if (!confirmed) {
			return
		}

		showLoading('deleteFloor')
		try {
			// ⚠️ Backend chưa implement /permanent endpoint, dùng DELETE thông thường
			const result = await deleteFloorAPI(currentFloorId)

			if (result.success) {
				showSuccess(`Đã xóa tầng "${floorName}" thành công`)

				// Re-fetch floors
				const floorsData = await getFloorsAPI()
				const floorsArray = Array.isArray(floorsData) ? floorsData : []
				setFloors(floorsArray)

				if (floorsArray.length > 0) {
					// Switch to first floor
					const sortedFloors = [...floorsArray].sort(
						(a, b) => a.floorNumber - b.floorNumber,
					)
					const firstFloor = sortedFloors[0]
					setCurrentPage(firstFloor.floorNumber)
					setCurrentFloorId(firstFloor.id)
					setTotalPages(floorsArray.length)
				} else {
					// No floors left
					setCurrentFloorId(null)
					setTotalPages(0)
					setTables([])
				}
			} else {
				showError('Không thể xóa tầng')
			}
		} catch (error) {
			console.error('❌ Error deleting floor:', error)
			showError(error.message || 'Lỗi khi xóa tầng')
		} finally {
			hideLoading('deleteFloor')
		}
	}

	const handleDeleteRow = () => {
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
		const sortedFloors = [...floors].sort((a, b) => a.floorNumber - b.floorNumber)

		for (let i = 0; i < sortedFloors.length; i++) {
			const floor = sortedFloors[i]
			links.push(
				<button
					key={floor.id}
					onClick={() => {
						setCurrentPage(floor.floorNumber)
						setCurrentFloorId(floor.id)
					}}
					className={`inline-flex items-center justify-center rounded-lg w-10 h-10 text-base transition-colors border-none cursor-pointer ${
						floor.id === currentFloorId
							? 'bg-[#137fec] text-white'
							: 'bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white'
					}`}
					title={floor.name}
				>
					{floor.floorNumber}
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
										Table Management
									</h1>
									<p className="text-gray-300 text-base">
										Manage your restaurant's dining tables - Drag to rearrange
									</p>
								</div>
							</div>
						</header>

						{/* Filter and Sort Controls */}
						<div className="mb-6 bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 overflow-visible relative z-50">
							<div className="flex flex-wrap gap-6">
								{/* Filter by Status - Custom Dropdown */}
								<div className="flex items-center gap-3">
									<label className="text-sm font-semibold text-gray-300">
										Lọc trạng thái:
									</label>
									<div className="relative">
										<button
											onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
											className="px-4 py-2.5 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-black/40 min-w-[140px] text-left flex items-center justify-between gap-3"
										>
											<span>{filterStatus === 'All' ? 'Tất cả' : 'Trống'}</span>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="12"
												height="12"
												viewBox="0 0 12 12"
												className={`transition-transform duration-200 ${
													filterDropdownOpen ? 'rotate-180' : ''
												}`}
											>
												<path fill="white" d="M6 9L1 4h10z" />
											</svg>
										</button>
										{filterDropdownOpen && (
											<div className="absolute top-full left-0 mt-2 min-w-full bg-black/90 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-2xl z-[1000]">
												<button
													onClick={() => {
														setFilterStatus('All')
														setFilterDropdownOpen(false)
													}}
													className={`w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors ${
														filterStatus === 'All' ? 'bg-white/5' : ''
													}`}
												>
													Tất cả
												</button>
												<button
													onClick={() => {
														setFilterStatus('AVAILABLE')
														setFilterDropdownOpen(false)
													}}
													className={`w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors ${
														filterStatus === 'AVAILABLE' ? 'bg-white/5' : ''
													}`}
												>
													Trống
												</button>
											</div>
										)}
									</div>
								</div>

								{/* Download Dropdown */}
								<div className="relative z-[10000]">
									<button
										onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
										className="px-4 py-2 bg-blue-600/20 border-2 border-blue-600/30 text-blue-400 rounded-lg hover:bg-blue-600/40 hover:border-blue-500 transition-colors font-semibold flex items-center gap-2"
									>
										📥 Tải QR Code
										<span className="text-xs">{downloadDropdownOpen ? '▲' : '▼'}</span>
									</button>

									{downloadDropdownOpen && (
										<div className="absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-md border-2 border-white/20 rounded-lg shadow-xl z-[99999] min-w-[200px]">
											<button
												onClick={async () => {
													setDownloadDropdownOpen(false)
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
														if (!result.success) showError('Lỗi tải file', result.message)
													} catch (error) {
														hideLoading()
														showError('Lỗi', error.message)
													}
												}}
												className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-b border-white/10"
											>
												📄 Tải Combined PDF
											</button>
											<button
												onClick={async () => {
													setDownloadDropdownOpen(false)
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
														if (!result.success) showError('Lỗi tải file', result.message)
													} catch (error) {
														hideLoading()
														showError('Lỗi', error.message)
													}
												}}
												className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-2 border-b border-white/10"
											>
												🗜️ Tải ZIP PNG
											</button>
											<button
												onClick={async () => {
													setDownloadDropdownOpen(false)
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
														if (!result.success) showError('Lỗi tải file', result.message)
													} catch (error) {
														hideLoading()
														showError('Lỗi', error.message)
													}
												}}
												className="w-full px-4 py-3 text-left text-base text-white hover:bg-white/10 transition-colors flex items-center gap-2"
											>
												📦 Tải ZIP PDF
											</button>
										</div>
									)}
								</div>

								{/* Regenerate All QR Button */}
								<button
									onClick={async () => {
										const floorTables = rawTablesData.filter(
											(t) => t.floor === currentFloor,
										)
										const confirmed = await showConfirm(
											'Xác nhận tạo lại tất cả QR Code',
											`Bạn có chắc muốn tạo lại QR Code cho ${floorTables.length} bàn trên tầng ${currentFloor}?\nTất cả QR cũ sẽ không còn hoạt động.`,
										)
										if (confirmed) {
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
													// Trigger refetch instead of full page reload
													setRefreshTrigger((prev) => prev + 1)
												} else {
													showError('Lỗi tạo QR', result.message)
												}
											} catch (error) {
												hideLoading()
												showError('Lỗi', error.message)
											}
										}
									}}
									className="px-4 py-2 bg-orange-600/20 border-2 border-orange-600/30 text-orange-400 rounded-lg hover:bg-orange-600/40 hover:border-orange-500 transition-colors font-semibold"
								>
									🔄 Tạo lại tất cả QR
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
							{floors.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 bg-black/20 rounded-2xl border-2 border-dashed border-gray-600">
									<div className="text-6xl mb-4">🏢</div>
									<h3 className="text-2xl font-bold text-gray-300 mb-2">
										Chưa có tầng nào
									</h3>
									<p className="text-gray-400 mb-6 text-center max-w-md">
										Hãy tạo tầng đầu tiên để bắt đầu quản lý bàn ăn của nhà hàng
									</p>
									<button
										onClick={handleAddFloor}
										className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-500/50 hover:scale-105"
									>
										<span className="text-xl mr-2">➕</span>
										Tạo Tầng Đầu Tiên
									</button>
								</div>
							) : tables.length > 0 || gridSize.rows > 0 ? (
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

						{/* Pagination section */}
						{floors.length > 0 && (
							<div className="mt-6 pt-6 border-t border-white/10">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="text-sm text-gray-400">
											{floors.find((f) => f.id === currentFloorId)?.name ||
												`Tầng ${currentPage}`}{' '}
											({currentPage}/{totalPages})
										</div>
										<button
											onClick={handleAddFloor}
											className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/50 flex items-center gap-2"
											title="Thêm tầng mới"
										>
											<span>🏢</span>
											<span>Thêm Tầng</span>
										</button>
										<button
											onClick={handleDeleteFloor}
											className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg"
											title="Xóa tầng hiện tại"
										>
											🗑️ Xóa Tầng
										</button>
									</div>

									{floors.length > 0 && (
										<nav className="flex items-center space-x-2">
											<button
												onClick={() => {
													const sortedFloors = [...floors].sort(
														(a, b) => a.floorNumber - b.floorNumber,
													)
													const currentIndex = sortedFloors.findIndex(
														(f) => f.id === currentFloorId,
													)
													if (currentIndex > 0) {
														const prevFloor = sortedFloors[currentIndex - 1]
														setCurrentPage(prevFloor.floorNumber)
														setCurrentFloorId(prevFloor.id)
													}
												}}
												disabled={floors.findIndex((f) => f.id === currentFloorId) === 0}
												className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												title="Previous Floor"
											>
												←
											</button>
											{renderPagination()}
											<button
												onClick={() => {
													const sortedFloors = [...floors].sort(
														(a, b) => a.floorNumber - b.floorNumber,
													)
													const currentIndex = sortedFloors.findIndex(
														(f) => f.id === currentFloorId,
													)
													if (currentIndex < sortedFloors.length - 1) {
														const nextFloor = sortedFloors[currentIndex + 1]
														setCurrentPage(nextFloor.floorNumber)
														setCurrentFloorId(nextFloor.id)
													}
												}}
												disabled={
													floors.findIndex((f) => f.id === currentFloorId) ===
													floors.length - 1
												}
												className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md text-gray-300 hover:bg-[#137fec] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												title="Next Floor"
											>
												→
											</button>
										</nav>
									)}
								</div>
							</div>
						)}
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
				onUpdateInfo={handleUpdateTableInfo}
				floorId={currentFloorId}
				showConfirm={showConfirm}
				showSuccess={showSuccess}
				showError={showError}
				showLoading={showLoading}
				hideLoading={hideLoading}
			/>

			<AddTableModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleSaveTable}
				currentFloorId={currentFloorId}
				nextTableId={getNextTableId(currentPage)}
				existingTables={tables}
				floorId={currentFloorId}
				existingFloorNumbers={floors.map((f) => f.floorNumber)}
			/>

			<AddFloorModal
				isOpen={isAddFloorModalOpen}
				onClose={() => setIsAddFloorModalOpen(false)}
				onConfirm={handleCreateFloor}
				existingFloorNumbers={floors.map((f) => f.floorNumber)}
			/>
		</>
	)
}

export default RestaurantTableManagement
