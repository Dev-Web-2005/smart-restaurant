import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'

const LOCATIONS = ['Trong nhà', 'Ngoài trời', 'Phòng VIP', 'Khu gia đình', 'Quầy bar']

// Helper function để debounce
const useDebounce = (value, delay) => {
	const [debouncedValue, setDebouncedValue] = useState(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

const AddTableModal = ({ isOpen, onClose, onSave, existingTables, floor }) => {
	const [formData, setFormData] = useState({
		name: '',
		capacity: '',
		location: 'Trong nhà',
		description: '',
	})
	const [errors, setErrors] = useState({})

	// Debounce giá trị để tránh validate quá nhiều
	const debouncedName = useDebounce(formData.name, 300)
	const debouncedCapacity = useDebounce(formData.capacity, 300)

	useEffect(() => {
		if (isOpen) {
			setFormData({
				name: '',
				capacity: '',
				location: 'Trong nhà',
				description: '',
			})
			setErrors({})
		}
	}, [isOpen])

	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape' && isOpen) onClose()
		}
		window.addEventListener('keydown', handleEscape)
		return () => window.removeEventListener('keydown', handleEscape)
	}, [isOpen, onClose])

	// Validate name với debounce
	useEffect(() => {
		if (debouncedName.trim() && existingTables.length > 0) {
			const isDuplicate = existingTables.some(
				(t) => t.name.toLowerCase() === debouncedName.trim().toLowerCase(),
			)

			if (isDuplicate) {
				setErrors((prev) => ({ ...prev, name: 'Tên bàn đã tồn tại' }))
			} else if (errors.name === 'Tên bàn đã tồn tại') {
				// Xóa lỗi nếu đã hết trùng
				setErrors((prev) => ({ ...prev, name: '' }))
			}
		}
	}, [debouncedName, existingTables])

	// Validate capacity với debounce
	useEffect(() => {
		if (debouncedCapacity.trim()) {
			const capacity = parseInt(debouncedCapacity)
			if (isNaN(capacity)) {
				setErrors((prev) => ({ ...prev, capacity: 'Sức chứa phải là số' }))
			} else if (capacity < 1 || capacity > 20) {
				setErrors((prev) => ({ ...prev, capacity: 'Sức chứa phải từ 1-20' }))
			} else if (errors.capacity && !errors.capacity.includes('bắt buộc')) {
				// Xóa lỗi nếu hợp lệ (trừ lỗi "bắt buộc")
				setErrors((prev) => ({ ...prev, capacity: '' }))
			}
		}
	}, [debouncedCapacity])

	const validateForm = () => {
		const newErrors = {}

		// Validate name (required)
		if (!formData.name.trim()) {
			newErrors.name = 'Tên bàn là bắt buộc'
		}

		// Validate capacity (required)
		const capacityStr = formData.capacity.trim()
		if (!capacityStr) {
			newErrors.capacity = 'Sức chứa là bắt buộc'
		}

		// Merge với errors hiện tại (đã được validate real-time)
		const finalErrors = { ...errors, ...newErrors }

		// Loại bỏ các lỗi rỗng
		Object.keys(finalErrors).forEach((key) => {
			if (!finalErrors[key]) delete finalErrors[key]
		})

		setErrors(finalErrors)
		return Object.keys(finalErrors).length === 0
	}

	const handleSubmit = (e) => {
		e.preventDefault()
		if (!validateForm()) return

		const capacity = parseInt(formData.capacity)
		const tableData = {
			name: formData.name.trim(),
			capacity: capacity,
			location: formData.location,
			description: formData.description.trim(),
			status: 'Available',
			floor: floor,
		}

		onSave(tableData, null)
		onClose()
	}

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	if (!isOpen) return null

	return ReactDOM.createPortal(
		<>
			<div
				className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
				<div
					className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 backdrop-blur-xl p-8 rounded-2xl w-full max-w-2xl mx-4 pointer-events-auto max-h-[90vh] overflow-y-auto"
					style={{
						boxShadow:
							'0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 60px rgba(19, 127, 236, 0.3)',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="sticky top-0 z-10 bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-4 mb-6 border-b border-white/10">
						<div className="flex items-center justify-between">
							<h3 className="text-2xl font-bold text-white">Tạo Bàn Mới</h3>
							<button
								onClick={onClose}
								className="text-gray-400 hover:text-white hover:bg-red-600/20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
							>
								✕
							</button>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<label className="text-sm font-semibold text-gray-300">
								Tên Bàn <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={formData.name}
								onChange={(e) => handleChange('name', e.target.value)}
								className="w-full px-4 py-3 bg-black/30 border-2 border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#137fec] transition-colors"
								placeholder='Ví dụ: "Bàn 1", "VIP 2"'
								autoFocus
							/>
							{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
						</div>

						<div className="space-y-2">
							<label className="text-sm font-semibold text-gray-300">
								Sức Chứa (Số chỗ ngồi) <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={formData.capacity}
								onChange={(e) => handleChange('capacity', e.target.value)}
								className="w-full px-4 py-3 bg-black/30 border-2 border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#137fec] transition-colors"
								placeholder="Nhập số chỗ ngồi (1-20)"
							/>
							{errors.capacity && (
								<p className="text-red-500 text-sm mt-1">{errors.capacity}</p>
							)}
						</div>

						<div className="space-y-2">
							<label className="text-sm font-semibold text-gray-300">
								Vị trí / Khu vực
							</label>
							<select
								value={formData.location}
								onChange={(e) => handleChange('location', e.target.value)}
								className="w-full px-4 py-3 bg-black/30 border-2 border-white/10 rounded-lg text-white focus:outline-none focus:border-[#137fec] transition-colors"
							>
								{LOCATIONS.map((loc) => (
									<option key={loc} value={loc} className="bg-gray-900">
										{loc}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-semibold text-gray-300">
								Mô tả (Tùy chọn)
							</label>
							<textarea
								value={formData.description}
								onChange={(e) => handleChange('description', e.target.value)}
								rows="3"
								className="w-full px-4 py-3 bg-black/30 border-2 border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#137fec] transition-colors resize-none"
								placeholder="Nhập mô tả cho bàn (tùy chọn)"
							/>
						</div>

						<div className="sticky bottom-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-6 mt-6 border-t border-white/10 flex gap-3 justify-end">
							<button
								type="button"
								onClick={onClose}
								className="px-6 py-3 rounded-lg bg-black/40 backdrop-blur-md text-white font-bold hover:bg-black/60 transition-colors"
							>
								Hủy
							</button>
							<button
								type="submit"
								className="px-6 py-3 rounded-lg bg-[#137fec] text-white font-bold hover:bg-blue-700 transition-colors"
							>
								Tạo Bàn
							</button>
						</div>
					</form>
				</div>
			</div>
		</>,
		document.body,
	)
}

export default AddTableModal
