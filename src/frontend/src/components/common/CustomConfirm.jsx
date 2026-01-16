import React from 'react'
import ReactDOM from 'react-dom'

/**
 * CustomConfirm Component - Modal Dialog for Confirmation
 * @param {boolean} isOpen - Hiển thị modal hay không
 * @param {string} title - Tiêu đề của confirm dialog
 * @param {string} message - Nội dung thông báo
 * @param {'info' | 'warning' | 'danger' | 'success'} type - Loại confirm (ảnh hưởng màu sắc)
 * @param {string} confirmText - Text của nút xác nhận (mặc định: "Confirm")
 * @param {string} cancelText - Text của nút hủy (mặc định: "Cancel")
 * @param {function} onConfirm - Callback khi người dùng confirm
 * @param {function} onCancel - Callback khi người dùng cancel
 * @param {boolean} showIcon - Hiển thị icon hay không (mặc định: true)
 */
const CustomConfirm = ({
	isOpen,
	title,
	message,
	type = 'info',
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onConfirm,
	onCancel,
	showIcon = true,
}) => {
	if (!isOpen) return null

	// Icon và màu sắc theo type
	const configs = {
		info: {
			icon: 'info',
			iconColor: 'text-blue-500',
			iconBg: 'bg-blue-500/20',
			confirmBg: 'bg-blue-600 hover:bg-blue-700',
			borderColor: 'border-blue-500/30',
		},
		warning: {
			icon: 'warning',
			iconColor: 'text-yellow-500',
			iconBg: 'bg-yellow-500/20',
			confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
			borderColor: 'border-yellow-500/30',
		},
		danger: {
			icon: 'error',
			iconColor: 'text-red-500',
			iconBg: 'bg-red-500/20',
			confirmBg: 'bg-red-600 hover:bg-red-700',
			borderColor: 'border-red-500/30',
		},
		success: {
			icon: 'check_circle',
			iconColor: 'text-green-500',
			iconBg: 'bg-green-500/20',
			confirmBg: 'bg-green-600 hover:bg-green-700',
			borderColor: 'border-green-500/30',
		},
	}

	const config = configs[type] || configs.info

	const handleConfirm = () => {
		if (onConfirm) onConfirm()
	}

	const handleCancel = () => {
		if (onCancel) onCancel()
	}

	return ReactDOM.createPortal(
		<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div
				className="relative backdrop-blur-xl bg-[#1A202C]/95 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-white/20"
				style={{ animation: 'fadeIn 0.2s ease-out' }}
			>
				{/* Icon */}
				{showIcon && (
					<div className="flex justify-center pt-6 pb-4">
						<div
							className={`w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center`}
						>
							<span className={`material-symbols-outlined text-4xl ${config.iconColor}`}>
								{config.icon}
							</span>
						</div>
					</div>
				)}

				{/* Content */}
				<div className="px-6 pb-6">
					{title && (
						<h3 className="text-xl font-bold text-white text-center mb-3">{title}</h3>
					)}
					{message && (
						<p className="text-[#9dabb9] text-center leading-relaxed">{message}</p>
					)}
				</div>

				{/* Actions */}
				<div className="flex gap-3 px-6 pb-6">
					<button
						onClick={handleCancel}
						className="flex-1 px-4 py-3 rounded-lg bg-[#2D3748] text-white font-semibold hover:bg-[#4A5568] transition-colors"
					>
						{cancelText}
					</button>
					<button
						onClick={handleConfirm}
						className={`flex-1 px-4 py-3 rounded-lg text-white font-semibold transition-colors ${config.confirmBg}`}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}

export default CustomConfirm
