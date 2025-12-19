// src/pages/user/table/AddFloorModal.jsx
import React, { useState } from 'react'
import { useAlert } from '../../../contexts/AlertContext'

const AddFloorModal = ({ isOpen, onClose, onConfirm, existingFloorNumbers = [] }) => {
	const { showWarning } = useAlert()
	const [formData, setFormData] = useState({
		name: '',
		floorNumber: '',
		gridWidth: 4,
		gridHeight: 4,
		description: '',
	})

	const handleChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleSubmit = () => {
		// Validation
		if (!formData.name.trim()) {
			showWarning('Lỗi nhập liệu', 'Vui lòng nhập tên tầng')
			return
		}

		if (!formData.floorNumber || formData.floorNumber < 0) {
			showWarning('Lỗi nhập liệu', 'Vui lòng nhập số tầng hợp lệ (>= 0)')
			return
		}

		// Check if floor number already exists
		if (existingFloorNumbers.includes(parseInt(formData.floorNumber))) {
			showWarning('Lỗi trùng lặp', 'Số tầng này đã tồn tại. Vui lòng chọn số khác.')
			return
		}

		if (formData.gridWidth < 4 || formData.gridHeight < 4) {
			showWarning('Lỗi kích thước', 'Kích thước lưới phải ít nhất 4x4')
			return
		}

		// Submit data
		onConfirm({
			name: formData.name.trim(),
			floorNumber: parseInt(formData.floorNumber),
			gridWidth: parseInt(formData.gridWidth),
			gridHeight: parseInt(formData.gridHeight),
			description: formData.description.trim(),
		})

		// Reset form
		setFormData({
			name: '',
			floorNumber: '',
			gridWidth: 4,
			gridHeight: 4,
			description: '',
		})
	}

	const handleCancel = () => {
		// Reset form
		setFormData({
			name: '',
			floorNumber: '',
			gridWidth: 4,
			gridHeight: 4,
			description: '',
		})
		onClose()
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm">
			<div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-white/20">
				{/* Header */}
				<div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-t-2xl border-b border-white/20">
					<h2 className="text-2xl font-bold text-white">Thêm Tầng Mới</h2>
				</div>

				{/* Body */}
				<div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
					{/* Floor Name */}
					<div>
						<label className="block text-sm font-semibold text-gray-300 mb-2">
							Tên Tầng <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => handleChange('name', e.target.value)}
							placeholder="VD: Tầng 1, Tầng trệt, Tầng VIP..."
							className="w-full px-4 py-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
							maxLength={50}
						/>
					</div>

					{/* Floor Number */}
					<div>
						<label className="block text-sm font-semibold text-gray-300 mb-2">
							Số Tầng <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							value={formData.floorNumber}
							onChange={(e) => handleChange('floorNumber', e.target.value)}
							placeholder="VD: 1, 2, 3..."
							min="0"
							className="w-full px-4 py-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						/>
						<p className="text-xs text-gray-400 mt-1">
							Số tầng dùng để sắp xếp (có thể khác tên tầng)
						</p>
					</div>

					{/* Grid Dimensions */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-semibold text-gray-300 mb-2">
								Số Cột (Rộng)
							</label>
							<input
								type="number"
								value={formData.gridWidth}
								onChange={(e) => handleChange('gridWidth', e.target.value)}
								min="4"
								max="20"
								className="w-full px-4 py-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-300 mb-2">
								Số Hàng (Cao)
							</label>
							<input
								type="number"
								value={formData.gridHeight}
								onChange={(e) => handleChange('gridHeight', e.target.value)}
								min="4"
								max="20"
								className="w-full px-4 py-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
							/>
						</div>
					</div>

					{/* Description */}
					<div>
						<label className="block text-sm font-semibold text-gray-300 mb-2">
							Mô Tả (Tùy chọn)
						</label>
						<textarea
							value={formData.description}
							onChange={(e) => handleChange('description', e.target.value)}
							placeholder="Mô tả về tầng này..."
							rows={3}
							className="w-full px-4 py-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-black/20 backdrop-blur-md rounded-b-2xl flex justify-end gap-3 border-t border-white/20">
					<button
						onClick={handleCancel}
						className="px-6 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20"
					>
						Hủy
					</button>
					<button
						onClick={handleSubmit}
						className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/50"
					>
						Thêm Tầng
					</button>
				</div>
			</div>
		</div>
	)
}

export default AddFloorModal
