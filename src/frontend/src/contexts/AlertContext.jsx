import React, { createContext, useContext, useState, useCallback } from 'react'
import CustomAlert from '../components/common/CustomAlert'

const AlertContext = createContext()

/**
 * AlertProvider - Cung cấp alert system cho toàn bộ ứng dụng
 */
export const AlertProvider = ({ children }) => {
	const [alerts, setAlerts] = useState([])

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
