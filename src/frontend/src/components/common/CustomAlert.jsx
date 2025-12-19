import React from 'react'

/**
 * CustomAlert Component
 * @param {string} title - Tiêu đề của thông báo
 * @param {string} description - Nội dung chi tiết (tùy chọn)
 * @param {'success' | 'info' | 'warning' | 'error'} type - Loại thông báo
 * @param {boolean} showIcon - Hiển thị icon mặc định hay không
 * @param {boolean} closable - Cho phép đóng thông báo hay không
 * @param {function} onClose - Callback khi đóng alert
 * @param {React.ReactNode} action - Các nút bấm hoặc hành động tùy chỉnh
 * @param {number} duration - Tự động đóng sau bao nhiêu ms (0 = không tự đóng)
 */
const CustomAlert = ({
	title,
	description,
	type = 'info',
	showIcon = true,
	closable = true,
	onClose,
	action,
	duration = 0,
}) => {
	const [visible, setVisible] = React.useState(true)

	React.useEffect(() => {
		if (duration > 0) {
			const timer = setTimeout(() => {
				handleClose()
			}, duration)
			return () => clearTimeout(timer)
		}
	}, [duration])

	const handleClose = () => {
		setVisible(false)
		if (onClose) {
			onClose()
		}
	}

	if (!visible) return null

	// Icon mapping
	const icons = {
		success: '✅',
		info: 'ℹ️',
		warning: '⚠️',
		error: '❌',
	}

	// Color mapping
	const colors = {
		success: {
			bg: 'bg-green-500/10',
			border: 'border-green-500/30',
			text: 'text-green-400',
			icon: 'text-green-500',
		},
		info: {
			bg: 'bg-blue-500/10',
			border: 'border-blue-500/30',
			text: 'text-blue-400',
			icon: 'text-blue-500',
		},
		warning: {
			bg: 'bg-yellow-500/10',
			border: 'border-yellow-500/30',
			text: 'text-yellow-400',
			icon: 'text-yellow-500',
		},
		error: {
			bg: 'bg-red-500/10',
			border: 'border-red-500/30',
			text: 'text-red-400',
			icon: 'text-red-500',
		},
	}

	const colorScheme = colors[type] || colors.info

	return (
		<div
			className={`relative flex items-start gap-3 p-4 rounded-lg border-2 ${colorScheme.bg} ${colorScheme.border} backdrop-blur-md shadow-lg mb-4 animate-fadeIn`}
			role="alert"
		>
			{/* Icon */}
			{showIcon && (
				<div className={`text-2xl ${colorScheme.icon} flex-shrink-0`}>{icons[type]}</div>
			)}

			{/* Content */}
			<div className="flex-1 min-w-0">
				{title && <div className={`font-semibold ${colorScheme.text} mb-1`}>{title}</div>}
				{description && (
					<div className="text-sm text-gray-300 leading-relaxed">{description}</div>
				)}
				{action && <div className="mt-3">{action}</div>}
			</div>

			{/* Close Button */}
			{closable && (
				<button
					onClick={handleClose}
					className="flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200 ml-2"
					aria-label="Close alert"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			)}
		</div>
	)
}

export default CustomAlert
