import React, { createContext, useContext, useState, useCallback } from 'react'
import CustomAlert from '../components/common/CustomAlert'
import CustomConfirm from '../components/common/CustomConfirm'

const AlertContext = createContext()

/**
 * AlertProvider - Cung cấp alert system cho toàn bộ ứng dụng
 */
export const AlertProvider = ({ children }) => {
	const [alerts, setAlerts] = useState([])
	const [confirmDialog, setConfirmDialog] = useState(null)

	/**
	 * Hiển thị alert mới
	 * @param {string} title - Tiêu đề
	 * @param {string} description - Mô tả chi tiết
	 * @param {'success' | 'error' | 'warning' | 'info'} type - Loại alert
	 * @param {number} duration - Thời gian tự đóng (ms), 0 = không tự đóng
	 */
	const showAlert = useCallback((title, description, type = 'info', duration = 5000) => {
		const id = Date.now() + Math.random() // Unique ID
		setAlerts((prev) => [...prev, { id, title, description, type, duration }])
		return id
	}, [])

	/**
	 * Hiển thị confirm dialog với CustomConfirm component
	 * @param {Object|string} options - Cấu hình confirm dialog hoặc title (string)
	 * @param {string} options.title - Tiêu đề
	 * @param {string} options.message - Nội dung
	 * @param {'info' | 'warning' | 'danger' | 'success'} options.type - Loại confirm
	 * @param {string} options.confirmText - Text nút xác nhận
	 * @param {string} options.cancelText - Text nút hủy
	 * @param {boolean} options.showIcon - Hiển thị icon
	 * @param {string} message - Nội dung (nếu options là string)
	 * @returns {Promise<boolean>} - true nếu user chọn Confirm, false nếu Cancel
	 */
	const showConfirm = useCallback((options, message) => {
		// Support both old signature (title, message) and new object-based signature
		let config
		if (typeof options === 'string') {
			config = {
				title: options,
				message: message || '',
				type: 'info',
				confirmText: 'Confirm',
				cancelText: 'Cancel',
				showIcon: true,
			}
		} else {
			config = {
				type: 'info',
				confirmText: 'Confirm',
				cancelText: 'Cancel',
				showIcon: true,
				...options,
			}
		}

		return new Promise((resolve) => {
			setConfirmDialog({
				...config,
				onConfirm: () => {
					setConfirmDialog(null)
					resolve(true)
				},
				onCancel: () => {
					setConfirmDialog(null)
					resolve(false)
				},
			})
		})
	}, [])

	/**
	 * Hiển thị alert thành công
	 */
	const showSuccess = useCallback(
		(title, description, duration = 3000) => {
			return showAlert(title, description, 'success', duration)
		},
		[showAlert],
	)

	/**
	 * Hiển thị alert lỗi
	 */
	const showError = useCallback(
		(title, description, duration = 5000) => {
			return showAlert(title, description, 'error', duration)
		},
		[showAlert],
	)

	/**
	 * Hiển thị alert cảnh báo
	 */
	const showWarning = useCallback(
		(title, description, duration = 4000) => {
			return showAlert(title, description, 'warning', duration)
		},
		[showAlert],
	)

	/**
	 * Hiển thị alert thông tin
	 */
	const showInfo = useCallback(
		(title, description, duration = 5000) => {
			return showAlert(title, description, 'info', duration)
		},
		[showAlert],
	)

	/**
	 * Xóa alert theo ID
	 */
	const removeAlert = useCallback((id) => {
		setAlerts((prev) => prev.filter((alert) => alert.id !== id))
	}, [])

	/**
	 * Xóa tất cả alerts
	 */
	const clearAllAlerts = useCallback(() => {
		setAlerts([])
	}, [])

	const value = {
		showAlert,
		showSuccess,
		showError,
		showWarning,
		showInfo,
		showConfirm,
		removeAlert,
		clearAllAlerts,
		alerts,
	}

	return (
		<AlertContext.Provider value={value}>
			{children}

			{/* Alert Container - Fixed position */}
			<div className="fixed top-4 right-4 z-[100000] max-w-md w-full space-y-2 pointer-events-none">
				<div className="space-y-2 pointer-events-auto">
					{alerts.map((alert) => (
						<CustomAlert
							key={alert.id}
							title={alert.title}
							description={alert.description}
							type={alert.type}
							showIcon={true}
							closable={true}
							onClose={() => removeAlert(alert.id)}
							duration={alert.duration}
						/>
					))}
				</div>
			</div>

			{/* Confirm Dialog - Using CustomConfirm */}
			{confirmDialog && (
				<CustomConfirm
					isOpen={true}
					title={confirmDialog.title}
					message={confirmDialog.message}
					type={confirmDialog.type}
					confirmText={confirmDialog.confirmText}
					cancelText={confirmDialog.cancelText}
					showIcon={confirmDialog.showIcon}
					onConfirm={confirmDialog.onConfirm}
					onCancel={confirmDialog.onCancel}
				/>
			)}
		</AlertContext.Provider>
	)
}

/**
 * Hook để sử dụng alert system
 * @returns {Object} Alert functions
 */
export const useAlert = () => {
	const context = useContext(AlertContext)
	if (!context) {
		throw new Error('useAlert must be used within AlertProvider')
	}
	return context
}

export default AlertContext
