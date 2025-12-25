import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import AddDishModal from './AddDishModal'

// Mock user context
const useUser = () => ({ user: { name: 'Admin' }, loading: false })

// --- Dữ liệu Mock ---
const mockDishesData = {
	'noodle-dishes': [
		{
			id: 1,
			name: 'Spicy Miso Ramen',
			description:
				'A rich and flavorful ramen with a spicy miso broth, tender chashu pork, and a soft-boiled egg.',
			price: 15.5,
			image:
				'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=500&q=80',
			status: 'READY',
			preparationTime: 15,
			cookingTime: 15,
			spicyLevel: 3,
			isChefRecommendation: true,
			modifiers: [
				{
					id: 1,
					name: 'Size',
					type: 'SINGLE', // SINGLE or MULTIPLE
					required: true,
					minSelection: 1,
					maxSelection: 1,
					displayOrder: 1,
					options: [
						{ id: 1, name: 'Small', priceAdjustment: -2, isActive: true },
						{ id: 2, name: 'Medium', priceAdjustment: 0, isActive: true },
						{ id: 3, name: 'Large', priceAdjustment: 3, isActive: true },
					],
				},
				{
					id: 2,
					name: 'Add-ons',
					type: 'MULTIPLE',
					required: false,
					minSelection: 0,
					maxSelection: 5,
					displayOrder: 2,
					options: [
						{ id: 4, name: 'Extra Egg', priceAdjustment: 2, isActive: true },
						{ id: 5, name: 'Extra Pork', priceAdjustment: 4, isActive: true },
						{ id: 6, name: 'Extra Noodles', priceAdjustment: 2.5, isActive: true },
					],
				},
			],
		},
		{
			id: 2,
			name: 'Classic Pad Thai',
			description:
				'Wok-fried rice noodles with shrimp, tofu, peanuts, bean sprouts, and a tangy tamarind sauce.',
			price: 14.0,
			image:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCylxfP50ETWvYyVwTx3qbbPj27wYtyyW5GQ&s',
			status: 'READY',
			preparationTime: 12,
			cookingTime: 12,
			spicyLevel: 2,
			isChefRecommendation: false,
			modifiers: [],
		},
		{
			id: 3,
			name: 'Vietnamese Pho',
			description: 'Traditional Vietnamese beef noodle soup with herbs and lime.',
			price: 13.75,
			image:
				'https://iamafoodblog.b-cdn.net/wp-content/uploads/2017/11/authentic-instant-pot-pho-recipe-1959w.jpg',
			status: 'NOT_READY',
			preparationTime: 20,
			cookingTime: 20,
			spicyLevel: 1,
			isChefRecommendation: true,
			modifiers: [],
		},
		{
			id: 4,
			name: 'Udon Noodles',
			description: 'Thick wheat noodles in a savory broth with tempura.',
			price: 12.5,
			image:
				'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?auto=format&fit=crop&w=500&q=80',
			status: 'READY',
			preparationTime: 10,
			cookingTime: 10,
			spicyLevel: 0,
			isChefRecommendation: false,
			modifiers: [],
		},
	],
	soups: [],
	salads: [],
}

const formatCategoryName = (slug) => {
	if (!slug) return 'Dishes'
	return slug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

// 🆕 MODAL QUẢN LÝ MODIFIERS
const ModifiersModal = ({ isOpen, dish, onClose, onSave }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)
	const [modifiers, setModifiers] = useState([])
	const [editingModifier, setEditingModifier] = useState(null)
	const [isAddingNew, setIsAddingNew] = useState(false)

	useEffect(() => {
		if (dish?.modifiers) {
			setModifiers(JSON.parse(JSON.stringify(dish.modifiers)))
		}
	}, [dish])

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => setIsVisible(true))
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
			setEditingModifier(null)
			setIsAddingNew(false)
		}
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	if (!isOpen || !dish) return null

	const handleAddModifier = () => {
		const newModifier = {
			id: Date.now(),
			name: '',
			type: 'SINGLE',
			required: false,
			minSelection: 0,
			maxSelection: 1,
			displayOrder: modifiers.length + 1,
			options: [],
		}
		setEditingModifier(newModifier)
		setIsAddingNew(true)
	}

	const handleSaveModifier = (modifier) => {
		if (!modifier.name.trim()) {
			alert('Please enter modifier name')
			return
		}

		if (isAddingNew) {
			setModifiers([...modifiers, modifier])
		} else {
			setModifiers(modifiers.map((m) => (m.id === modifier.id ? modifier : m)))
		}
		setEditingModifier(null)
		setIsAddingNew(false)
	}

	const handleDeleteModifier = (modifierId) => {
		if (confirm('Are you sure you want to delete this modifier group?')) {
			setModifiers(modifiers.filter((m) => m.id !== modifierId))
		}
	}

	const handleAddOption = (modifierId) => {
		const modifier = modifiers.find((m) => m.id === modifierId)
		const newOption = {
			id: Date.now(),
			name: '',
			priceAdjustment: 0,
			isActive: true,
		}
		const updatedModifier = {
			...modifier,
			options: [...modifier.options, newOption],
		}
		setModifiers(modifiers.map((m) => (m.id === modifierId ? updatedModifier : m)))
	}

	const handleUpdateOption = (modifierId, optionId, field, value) => {
		setModifiers(
			modifiers.map((m) => {
				if (m.id === modifierId) {
					return {
						...m,
						options: m.options.map((opt) =>
							opt.id === optionId ? { ...opt, [field]: value } : opt,
						),
					}
				}
				return m
			}),
		)
	}

	const handleDeleteOption = (modifierId, optionId) => {
		setModifiers(
			modifiers.map((m) => {
				if (m.id === modifierId) {
					return {
						...m,
						options: m.options.filter((opt) => opt.id !== optionId),
					}
				}
				return m
			}),
		)
	}

	const handleSaveAll = async () => {
		try {
			await new Promise((resolve) => setTimeout(resolve, 500))
			onSave({ ...dish, modifiers })
			onClose()
		} catch (error) {
			alert('Failed to save modifiers')
		}
	}

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative bg-[#1A202C] rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<div>
						<h2 className="text-2xl font-bold text-white m-0">Manage Modifiers</h2>
						<p className="text-sm text-[#9dabb9] mt-1">{dish.name}</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#2D3748] transition-colors"
					>
						<span className="material-symbols-outlined">close</span>
					</button>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
					{editingModifier ? (
						<ModifierEditor
							modifier={editingModifier}
							onSave={handleSaveModifier}
							onCancel={() => {
								setEditingModifier(null)
								setIsAddingNew(false)
							}}
						/>
					) : (
						<>
							{modifiers.length === 0 ? (
								<div className="text-center py-12">
									<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4">
										tune
									</span>
									<p className="text-[#9dabb9] mb-4">No modifiers added yet</p>
									<button
										onClick={handleAddModifier}
										className="px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0d6ecc] font-semibold"
									>
										Add First Modifier
									</button>
								</div>
							) : (
								<div className="space-y-4">
									{modifiers.map((modifier, index) => (
										<div
											key={modifier.id}
											className="bg-[#2D3748] rounded-lg p-4 border border-white/10"
										>
											<div className="flex items-start justify-between mb-3">
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<h3 className="text-lg font-bold text-white m-0">
															{modifier.name}
														</h3>
														<span
															className={`text-xs px-2 py-1 rounded ${
																modifier.type === 'SINGLE'
																	? 'bg-blue-500/20 text-blue-400'
																	: 'bg-purple-500/20 text-purple-400'
															}`}
														>
															{modifier.type === 'SINGLE'
																? 'Single Choice'
																: 'Multiple Choice'}
														</span>
														{modifier.required && (
															<span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
																Required
															</span>
														)}
													</div>
													<p className="text-sm text-[#9dabb9] m-0">
														{modifier.type === 'SINGLE'
															? `Select exactly ${modifier.maxSelection}`
															: `Select ${modifier.minSelection}-${modifier.maxSelection} options`}
													</p>
												</div>
												<div className="flex gap-2">
													<button
														onClick={() => setEditingModifier(modifier)}
														className="p-2 text-[#9dabb9] hover:text-white hover:bg-[#1A202C] rounded transition-colors"
													>
														<span className="material-symbols-outlined text-lg">
															edit
														</span>
													</button>
													<button
														onClick={() => handleDeleteModifier(modifier.id)}
														className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
													>
														<span className="material-symbols-outlined text-lg">
															delete
														</span>
													</button>
												</div>
											</div>

											{/* Options List */}
											<div className="space-y-2 ml-4">
												{modifier.options.map((option) => (
													<div
														key={option.id}
														className="flex items-center justify-between p-2 bg-[#1A202C] rounded"
													>
														<div className="flex items-center gap-3">
															<span className="text-white">{option.name}</span>
															{option.priceAdjustment !== 0 && (
																<span
																	className={`text-sm font-semibold ${
																		option.priceAdjustment > 0
																			? 'text-green-400'
																			: 'text-red-400'
																	}`}
																>
																	{option.priceAdjustment > 0 ? '+' : ''}$
																	{option.priceAdjustment.toFixed(2)}
																</span>
															)}
														</div>
														<span
															className={`text-xs px-2 py-1 rounded ${
																option.isActive
																	? 'bg-green-500/20 text-green-400'
																	: 'bg-gray-500/20 text-gray-400'
															}`}
														>
															{option.isActive ? 'Active' : 'Inactive'}
														</span>
													</div>
												))}
												{modifier.options.length === 0 && (
													<p className="text-sm text-[#9dabb9] italic">
														No options added
													</p>
												)}
											</div>
										</div>
									))}

									<button
										onClick={handleAddModifier}
										className="w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-[#9dabb9] hover:text-white hover:border-[#137fec] transition-colors flex items-center justify-center gap-2"
									>
										<span className="material-symbols-outlined">add</span>
										Add Modifier Group
									</button>
								</div>
							)}
						</>
					)}
				</div>

				{/* Footer */}
				{!editingModifier && (
					<div className="flex justify-end gap-3 p-6 border-t border-white/10">
						<button
							onClick={onClose}
							className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleSaveAll}
							className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
						>
							Save All Changes
						</button>
					</div>
				)}
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// 🆕 MODIFIER EDITOR COMPONENT
const ModifierEditor = ({ modifier, onSave, onCancel }) => {
	const [formData, setFormData] = useState(modifier)

	const handleChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const handleAddOption = () => {
		const newOption = {
			id: Date.now(),
			name: '',
			priceAdjustment: 0,
			isActive: true,
		}
		setFormData((prev) => ({
			...prev,
			options: [...prev.options, newOption],
		}))
	}

	const handleUpdateOption = (optionId, field, value) => {
		setFormData((prev) => ({
			...prev,
			options: prev.options.map((opt) =>
				opt.id === optionId ? { ...opt, [field]: value } : opt,
			),
		}))
	}

	const handleDeleteOption = (optionId) => {
		setFormData((prev) => ({
			...prev,
			options: prev.options.filter((opt) => opt.id !== optionId),
		}))
	}

	return (
		<div className="space-y-4">
			<div className="bg-[#2D3748] rounded-lg p-4 border border-white/10">
				<h3 className="text-lg font-bold text-white mb-4">Modifier Group Details</h3>

				<div className="space-y-4">
					<div>
						<label className="block text-[#9dabb9] text-sm mb-2">Group Name *</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => handleChange('name', e.target.value)}
							className="w-full px-4 py-2 bg-[#1A202C] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
							placeholder="e.g., Size, Toppings, Extras"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-[#9dabb9] text-sm mb-2">
								Selection Type *
							</label>
							<select
								value={formData.type}
								onChange={(e) => {
									const type = e.target.value
									handleChange('type', type)
									if (type === 'SINGLE') {
										handleChange('minSelection', 1)
										handleChange('maxSelection', 1)
									}
								}}
								className="w-full px-4 py-2 bg-[#1A202C] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
							>
								<option value="SINGLE">Single Choice</option>
								<option value="MULTIPLE">Multiple Choice</option>
							</select>
						</div>

						<div>
							<label className="block text-[#9dabb9] text-sm mb-2">Required</label>
							<label className="flex items-center gap-2 px-4 py-2 bg-[#1A202C] rounded-lg border border-white/10 cursor-pointer">
								<input
									type="checkbox"
									checked={formData.required}
									onChange={(e) => handleChange('required', e.target.checked)}
									className="w-4 h-4"
								/>
								<span className="text-white">Customer must select</span>
							</label>
						</div>
					</div>

					{formData.type === 'MULTIPLE' && (
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[#9dabb9] text-sm mb-2">Min Selection</label>
								<input
									type="number"
									min="0"
									value={formData.minSelection}
									onChange={(e) => handleChange('minSelection', parseInt(e.target.value))}
									className="w-full px-4 py-2 bg-[#1A202C] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
								/>
							</div>
							<div>
								<label className="block text-[#9dabb9] text-sm mb-2">Max Selection</label>
								<input
									type="number"
									min="1"
									value={formData.maxSelection}
									onChange={(e) => handleChange('maxSelection', parseInt(e.target.value))}
									className="w-full px-4 py-2 bg-[#1A202C] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Options Section */}
			<div className="bg-[#2D3748] rounded-lg p-4 border border-white/10">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-white m-0">Options</h3>
					<button
						onClick={handleAddOption}
						className="px-3 py-1.5 bg-[#137fec] text-white rounded text-sm hover:bg-[#0d6ecc] flex items-center gap-1"
					>
						<span className="material-symbols-outlined text-sm">add</span>
						Add Option
					</button>
				</div>

				<div className="space-y-2">
					{formData.options.map((option, index) => (
						<div
							key={option.id}
							className="flex items-center gap-2 p-3 bg-[#1A202C] rounded-lg"
						>
							<span className="text-[#9dabb9] text-sm w-6">{index + 1}.</span>
							<input
								type="text"
								value={option.name}
								onChange={(e) => handleUpdateOption(option.id, 'name', e.target.value)}
								className="flex-1 px-3 py-2 bg-[#2D3748] text-white rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec] text-sm"
								placeholder="Option name"
							/>
							<div className="flex items-center gap-1">
								<span className="text-[#9dabb9] text-sm">$</span>
								<input
									type="number"
									step="0.01"
									value={option.priceAdjustment}
									onChange={(e) =>
										handleUpdateOption(
											option.id,
											'priceAdjustment',
											parseFloat(e.target.value),
										)
									}
									className="w-20 px-2 py-2 bg-[#2D3748] text-white rounded border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec] text-sm"
								/>
							</div>
							<label className="flex items-center gap-1 cursor-pointer">
								<input
									type="checkbox"
									checked={option.isActive}
									onChange={(e) =>
										handleUpdateOption(option.id, 'isActive', e.target.checked)
									}
									className="w-4 h-4"
								/>
								<span className="text-[#9dabb9] text-xs">Active</span>
							</label>
							<button
								onClick={() => handleDeleteOption(option.id)}
								className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
							>
								<span className="material-symbols-outlined text-lg">delete</span>
							</button>
						</div>
					))}
					{formData.options.length === 0 && (
						<p className="text-center text-[#9dabb9] py-4 text-sm italic">
							No options added. Click "Add Option" to create one.
						</p>
					)}
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-end gap-3">
				<button
					onClick={onCancel}
					className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] transition-colors"
				>
					Cancel
				</button>
				<button
					onClick={() => onSave(formData)}
					className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
				>
					Save Modifier
				</button>
			</div>
		</div>
	)
}

// Modal Xác nhận Xóa
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onClose }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			requestAnimationFrame(() => setIsVisible(true))
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
		}
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	if (!isOpen) return null

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative bg-black/80 backdrop-blur-md rounded-lg shadow-2xl p-6 w-full max-w-sm mx-4 border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				<h3 className="text-2xl font-bold text-red-500 mb-4">{title}</h3>
				<p className="text-[#9dabb9] mb-6">{message}</p>
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-lg bg-[#2D3748] text-white transition-colors hover:bg-[#4A5568]"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold transition-colors hover:bg-red-700"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// DishDetailsModal (đã cập nhật với Modifiers)
const DishDetailsModal = ({ isOpen, dish, onClose, onSave, onToggleStatus }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)
	const [activeTab, setActiveTab] = useState('view')
	const [editFormData, setEditFormData] = useState(null)
	const [isSaving, setIsSaving] = useState(false)
	const [isModifiersModalOpen, setIsModifiersModalOpen] = useState(false)

	useEffect(() => {
		if (dish) {
			setEditFormData({
				name: dish.name || '',
				description: dish.description || '',
				price: dish.price || 0,
				image: dish.image || '',
				preparationTime: dish.preparationTime || 0,
			})
		}
	}, [dish])

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			setActiveTab('view')
			requestAnimationFrame(() => setIsVisible(true))
		} else {
			document.body.style.overflow = 'auto'
			setIsVisible(false)
		}
		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [isOpen])

	if (!isOpen || !dish) return null

	const handleInputChange = (e) => {
		const { name, value } = e.target
		setEditFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSave = async () => {
		if (
			!editFormData.name.trim() ||
			!editFormData.description.trim() ||
			editFormData.price <= 0
		) {
			alert('Please fill in all required fields correctly')
			return
		}

		setIsSaving(true)
		try {
			await new Promise((resolve) => setTimeout(resolve, 500))
			onSave({ ...dish, ...editFormData })
			setActiveTab('view')
		} catch (error) {
			alert('Failed to save dish. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	const isActive = dish.status === 'ACTIVE'

	const calculateTotalPrice = (basePrice, selectedModifiers) => {
		let total = basePrice
		selectedModifiers.forEach((mod) => {
			mod.selectedOptions.forEach((opt) => {
				total += opt.priceAdjustment
			})
		})
		return total
	}

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative bg-[#1A202C] rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<div className="flex items-center gap-3">
						<h2 className="text-2xl font-bold text-white m-0">{dish.name}</h2>
						<span
							className={`px-3 py-1 rounded-full text-xs font-bold ${
								isActive
									? 'bg-green-500/20 text-green-400'
									: 'bg-gray-500/20 text-gray-400'
							}`}
						>
							{dish.status}
						</span>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#2D3748] transition-colors"
					>
						<span className="material-symbols-outlined">close</span>
					</button>
				</div>

				<div className="flex border-b border-white/10">
					<button
						onClick={() => setActiveTab('view')}
						className={`flex-1 px-6 py-3 font-semibold transition-colors ${
							activeTab === 'view'
								? 'text-[#137fec] border-b-2 border-[#137fec]'
								: 'text-[#9dabb9] hover:text-white'
						}`}
					>
						View Details
					</button>
					<button
						onClick={() => setActiveTab('edit')}
						className={`flex-1 px-6 py-3 font-semibold transition-colors ${
							activeTab === 'edit'
								? 'text-[#137fec] border-b-2 border-[#137fec]'
								: 'text-[#9dabb9] hover:text-white'
						}`}
					>
						Edit Dish
					</button>
				</div>

				<div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
					{activeTab === 'view' ? (
						<div className="space-y-6">
							<div className="w-full h-64 rounded-lg overflow-hidden">
								<img
									src={dish.image}
									alt={dish.name}
									className="w-full h-full object-cover"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-[#9dabb9] text-sm mb-1">Price</p>
									<p className="text-white text-2xl font-bold">
										${dish.price.toFixed(2)}
									</p>
								</div>
								{dish.preparationTime && (
									<div>
										<p className="text-[#9dabb9] text-sm mb-1">Preparation Time</p>
										<p className="text-white text-lg">{dish.preparationTime} mins</p>
									</div>
								)}
							</div>

							<div>
								<p className="text-[#9dabb9] text-sm mb-2">Description</p>
								<p className="text-white leading-relaxed">{dish.description}</p>
							</div>

							{/* 🆕 HIỂN THỊ MODIFIERS */}
							{dish.modifiers && dish.modifiers.length > 0 && (
								<div>
									<div className="flex items-center justify-between mb-3">
										<p className="text-[#9dabb9] text-sm m-0">Customization Options</p>
										<button
											onClick={() => setIsModifiersModalOpen(true)}
											className="text-sm text-[#137fec] hover:text-[#0d6ecc] flex items-center gap-1"
										>
											<span className="material-symbols-outlined text-sm">edit</span>
											Manage
										</button>
									</div>
									<div className="space-y-3">
										{dish.modifiers.map((modifier) => (
											<div key={modifier.id} className="bg-[#2D3748] rounded-lg p-3">
												<div className="flex items-center gap-2 mb-2">
													<h4 className="text-white font-semibold m-0">
														{modifier.name}
													</h4>
													<span
														className={`text-xs px-2 py-0.5 rounded ${
															modifier.type === 'SINGLE'
																? 'bg-blue-500/20 text-blue-400'
																: 'bg-purple-500/20 text-purple-400'
														}`}
													>
														{modifier.type === 'SINGLE' ? 'Single' : 'Multiple'}
													</span>
													{modifier.required && (
														<span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
															Required
														</span>
													)}
												</div>
												<div className="flex flex-wrap gap-2">
													{modifier.options.map((option) => (
														<div
															key={option.id}
															className={`px-2 py-1 rounded text-xs ${
																option.isActive
																	? 'bg-[#1A202C] text-white'
																	: 'bg-gray-500/20 text-gray-400'
															}`}
														>
															{option.name}
															{option.priceAdjustment !== 0 && (
																<span className="ml-1 font-semibold text-green-400">
																	+${option.priceAdjustment.toFixed(2)}
																</span>
															)}
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="flex gap-3 pt-4 border-t border-white/10">
								<button
									onClick={() => setIsModifiersModalOpen(true)}
									className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors bg-[#137fec]/20 text-[#137fec] hover:bg-[#137fec]/30"
								>
									<span className="material-symbols-outlined">tune</span>
									{dish.modifiers?.length > 0 ? 'Manage Modifiers' : 'Add Modifiers'}
								</button>
								<button
									onClick={() => onToggleStatus(dish)}
									className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
										isActive
											? 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
											: 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
									}`}
								>
									<span className="material-symbols-outlined">
										{isActive ? 'toggle_off' : 'toggle_on'}
									</span>
									{isActive ? 'Deactivate' : 'Activate'}
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div>
								<label className="block text-[#9dabb9] text-sm mb-2">Dish Name *</label>
								<input
									type="text"
									name="name"
									value={editFormData?.name || ''}
									onChange={handleInputChange}
									autoFocus
									className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
									placeholder="Enter dish name"
								/>
							</div>

							<div>
								<label className="block text-[#9dabb9] text-sm mb-2">Description *</label>
								<textarea
									name="description"
									value={editFormData?.description || ''}
									onChange={handleInputChange}
									rows={4}
									className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec] resize-none"
									placeholder="Enter dish description"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-[#9dabb9] text-sm mb-2">Price ($) *</label>
									<input
										type="number"
										name="price"
										value={editFormData?.price || 0}
										onChange={handleInputChange}
										step="0.01"
										min="0.01"
										className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
									/>
								</div>

								<div>
									<label className="block text-[#9dabb9] text-sm mb-2">
										Prep Time (mins)
									</label>
									<input
										type="number"
										name="preparationTime"
										value={editFormData?.preparationTime || 0}
										onChange={handleInputChange}
										min="0"
										className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
									/>
								</div>
							</div>

							<div>
								<label className="block text-[#9dabb9] text-sm mb-2">Image URL</label>
								<input
									type="url"
									name="image"
									value={editFormData?.image || ''}
									onChange={handleInputChange}
									className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#137fec]"
									placeholder="https://example.com/image.jpg"
								/>
							</div>

							<div className="flex justify-end gap-3 pt-4 border-t border-white/10">
								<button
									onClick={() => setActiveTab('view')}
									className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleSave}
									disabled={isSaving}
									className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSaving ? (
										<>
											<span className="material-symbols-outlined animate-spin">
												refresh
											</span>
											Saving...
										</>
									) : (
										<>
											<span className="material-symbols-outlined">check</span>
											Save Changes
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 🆕 NESTED MODIFIERS MODAL */}
			<ModifiersModal
				isOpen={isModifiersModalOpen}
				dish={dish}
				onClose={() => setIsModifiersModalOpen(false)}
				onSave={(updatedDish) => {
					onSave(updatedDish)
					setIsModifiersModalOpen(false)
				}}
			/>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// DishCard Component
const DishCard = ({ dish, onDelete, onClick, viewMode = 'grid' }) => {
	const [isHovering, setIsHovering] = useState(false)

	const handleDeleteClick = (e) => {
		e.stopPropagation()
		onDelete(dish)
	}

	const getStatusBadge = (status) => {
		switch (status) {
			case 'READY':
				return (
					<span className="text-green-400 text-sm font-bold bg-green-500/20 px-2 py-1 rounded-full">
						Ready
					</span>
				)
			case 'NOT_READY':
				return (
					<span className="text-yellow-400 text-sm font-bold bg-yellow-500/20 px-2 py-1 rounded-full">
						Not Ready
					</span>
				)
			default:
				return null
		}
	}

	if (viewMode === 'list') {
		return (
			<div
				onClick={() => onClick(dish)}
				className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 hover:shadow-2xl hover:bg-black/50 transition-all cursor-pointer group"
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
					<img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-xl font-bold text-white truncate">{dish.name}</h3>
						{dish.isChefRecommendation && (
							<span
								className="material-symbols-outlined text-yellow-400"
								title="Chef's Recommendation"
							>
								star
							</span>
						)}
						{getStatusBadge(dish.status)}
						{dish.modifiers?.length > 0 && (
							<span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#137fec]/20 text-[#137fec]">
								<span className="material-symbols-outlined text-sm">tune</span>
								{dish.modifiers.length}
							</span>
						)}
					</div>
					<p className="text-sm text-[#9dabb9] line-clamp-2">{dish.description}</p>
					<div className="flex items-center gap-4 mt-2 text-xs text-[#9dabb9]">
						{dish.cookingTime && (
							<span className="flex items-center gap-1">
								<span className="material-symbols-outlined text-sm">schedule</span>
								{dish.cookingTime} mins
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-4">
					<p className="text-2xl font-black text-[#137fec]">
						${(dish.price || 0).toFixed(2)}
					</p>
					{isHovering && (
						<button
							onClick={handleDeleteClick}
							title={`Delete ${dish.name}`}
							className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600/90 text-white transition-all hover:bg-red-700 active:scale-[0.98] border-none cursor-pointer p-0"
						>
							<span className="material-symbols-outlined text-base">close</span>
						</button>
					)}
				</div>
			</div>
		)
	}

	const isActive = dish.status === 'READY'

	return (
		<div className="flex flex-col items-center">
			<div
				onClick={() => onClick(dish)}
				className="relative w-full aspect-square overflow-hidden rounded-xl bg-black/40 backdrop-blur-md transition-all group hover:shadow-2xl hover:scale-[1.02] border border-white/10 cursor-pointer"
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<div
					className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
					style={{ backgroundImage: `url('${dish.image}')` }}
				>
					<div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
					{!isActive && (
						<div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center">
							{getStatusBadge(dish.status)}
						</div>
					)}
					{dish.modifiers?.length > 0 && isActive && (
						<div className="absolute top-3 left-3 z-10 bg-[#137fec]/90 text-white px-2 py-1 rounded-full flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">tune</span>
							<span className="text-xs font-bold">{dish.modifiers.length}</span>
						</div>
					)}
				</div>
				<div className="absolute inset-0 z-10 flex flex-col justify-end p-4">
					<div className="p-3 bg-black/50 rounded-lg backdrop-blur-sm transition-colors duration-300 group-hover:bg-black/70">
						<h3 className="text-xl font-bold text-white m-0 leading-tight">
							{dish.name}
						</h3>
						<p className="text-xs text-[#E2E8F0] mt-1 line-clamp-2 m-0">
							{dish.description}
						</p>
					</div>
				</div>

				{isHovering && (
					<button
						onClick={handleDeleteClick}
						title={`Delete ${dish.name}`}
						className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-red-600/90 text-white transition-all hover:bg-red-700 active:scale-[0.98] border-none cursor-pointer p-0"
					>
						<span className="material-symbols-outlined text-base">close</span>
					</button>
				)}
			</div>

			<div className="mt-3 text-center">
				<p className="text-3xl font-black text-[#137fec] mt-1 m-0">
					${(dish.price || 0).toFixed(2)}
				</p>
			</div>
		</div>
	)
}

const AddDishCard = ({ onClick }) => (
	<button
		onClick={onClick}
		className="flex flex-col items-center justify-center w-full aspect-square bg-black/30 backdrop-blur-md rounded-xl border-2 border-dashed border-white/20 h-full p-6 text-center transition-all duration-200 hover:bg-black/50 hover:border-blue-400 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
	>
		<span className="material-symbols-outlined text-7xl text-[#137fec] opacity-90 mb-2">
			add_circle
		</span>
		<h3 className="text-lg font-bold text-white">Add New Dish</h3>
	</button>
)

// Edit Category Modal
const EditCategoryModal = ({ isOpen, onClose, onSave, categoryData }) => {
	const modalRef = useRef(null)
	const [formData, setFormData] = useState({
		name: '',
		image: '',
	})
	const [previewImage, setPreviewImage] = useState(null)
	const [loading, setLoading] = useState(false)
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		if (categoryData) {
			setFormData({
				name: categoryData.name || '',
				image: categoryData.image || '',
			})
			setPreviewImage(categoryData.image || null)
		}
	}, [categoryData])

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

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleFileChange = (e) => {
		const file = e.target.files[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				setPreviewImage(reader.result)
				setFormData((prev) => ({ ...prev, image: reader.result }))
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)

		console.log('Updating category:', formData)

		setTimeout(() => {
			if (onSave) {
				onSave(formData)
			}
			setLoading(false)
			onClose()
		}, 1000)
	}

	if (!isOpen) return null

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative w-full max-w-2xl mx-4 bg-[#1A202C] p-8 rounded-xl shadow-2xl border border-white/10 transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
				style={{
					maxHeight: '90vh',
					overflowY: 'auto',
				}}
			>
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-[#9dabb9] hover:text-white transition-colors z-10"
				>
					<span className="material-symbols-outlined text-2xl">close</span>
				</button>

				<div className="mb-8">
					<h2 className="text-2xl font-bold text-white m-0">Edit Category</h2>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<label htmlFor="name" className="block text-sm font-medium text-gray-300">
							Category Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							value={formData.name}
							onChange={handleChange}
							placeholder="e.g., Appetizers, Main Courses"
							required
							autoFocus
							className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
						/>
					</div>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-300">
							Category Image
						</label>
						<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
							<div className="shrink-0">
								<div
									className="w-32 h-32 bg-[#2D3748] rounded-lg flex items-center justify-center border-2 border-dashed border-[#4b5563] overflow-hidden bg-cover bg-center"
									style={
										previewImage
											? {
													backgroundImage: `url(${previewImage})`,
													border: 'none',
											  }
											: {}
									}
								>
									{!previewImage && (
										<span className="material-symbols-outlined text-gray-500 text-5xl">
											image
										</span>
									)}
								</div>
							</div>

							<div className="flex-1 space-y-3">
								<label
									htmlFor="file-upload"
									className="cursor-pointer inline-flex items-center justify-center rounded-lg h-10 px-4 bg-[#137fec] text-white text-sm font-bold tracking-[0.015em] hover:bg-[#137fec]/90 transition-colors"
								>
									<span>Upload New Image</span>
									<input
										id="file-upload"
										name="file-upload"
										type="file"
										className="sr-only"
										accept="image/*"
										onChange={handleFileChange}
									/>
								</label>
								<p className="text-xs text-[#9dabb9]">Or paste image URL below</p>
								<input
									type="url"
									id="image"
									name="image"
									value={formData.image}
									onChange={(e) => {
										handleChange(e)
										setPreviewImage(e.target.value)
									}}
									placeholder="https://example.com/image.jpg"
									className="w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 outline-none transition-colors focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] placeholder-gray-400 text-sm"
								/>
							</div>
						</div>
					</div>

					<div className="flex justify-end items-center gap-4 pt-4 border-t border-[#374151]">
						<button
							type="button"
							onClick={onClose}
							className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-transparent text-gray-300 text-sm font-bold hover:bg-[#4b5563] transition-colors"
							disabled={loading}
						>
							<span className="truncate">Cancel</span>
						</button>
						<button
							type="submit"
							className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-[#137fec] text-white text-sm font-bold hover:bg-[#137fec]/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
							disabled={loading || !formData.name.trim()}
						>
							{loading ? (
								<span className="truncate">Saving...</span>
							) : (
								<span className="truncate">Save Changes</span>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

const CategoryDishes = ({ categorySlug = 'noodle-dishes' }) => {
	const navigate = useNavigate()
	const { user, loading: contextLoading } = useUser()
	const [dishes, setDishes] = useState([])
	const [categoryName, setCategoryName] = useState('')
	const [loading, setLoading] = useState(true)
	const [dishToDelete, setDishToDelete] = useState(null)
	const [selectedDish, setSelectedDish] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [sortBy, setSortBy] = useState('default')
	const [viewMode, setViewMode] = useState('grid')
	const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false)
	const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
	const [categoryImage, setCategoryImage] = useState('')

	const fetchDishes = async (slug) => {
		setLoading(true)
		setTimeout(() => {
			const data = JSON.parse(JSON.stringify(mockDishesData[slug] || []))
			setDishes(data)
			setCategoryName(formatCategoryName(slug))
			setLoading(false)
		}, 500)
	}

	useEffect(() => {
		fetchDishes(categorySlug)
	}, [categorySlug])

	const handleUpdateDish = (updatedDish) => {
		setDishes((prev) => prev.map((d) => (d.id === updatedDish.id ? updatedDish : d)))
		setSelectedDish(updatedDish)
	}

	const handleToggleDishStatus = async (dish) => {
		const newStatus = dish.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
		try {
			await new Promise((resolve) => setTimeout(resolve, 300))
			setDishes((prev) =>
				prev.map((d) => (d.id === dish.id ? { ...d, status: newStatus } : d)),
			)
			if (selectedDish?.id === dish.id) {
				setSelectedDish({ ...dish, status: newStatus })
			}
		} catch (error) {
			alert(`Failed to update dish status`)
		}
	}

	const executeDeleteDish = async () => {
		if (!dishToDelete) return
		setDishToDelete(null)
		const prevDishes = dishes
		setDishes(prevDishes.filter((dish) => dish.id !== dishToDelete.id))
	}

	const handleSaveNewDish = (newDish) => {
		setDishes((prev) => [...prev, { ...newDish, status: 'READY', modifiers: [] }])
		setIsAddDishModalOpen(false)
	}

	const handleEditCategory = () => {
		setIsEditCategoryModalOpen(true)
	}

	const handleSaveCategory = (updatedCategory) => {
		if (updatedCategory.name.trim()) {
			setCategoryName(updatedCategory.name.trim())
		}
		if (updatedCategory.image) {
			setCategoryImage(updatedCategory.image)
		}
		setIsEditCategoryModalOpen(false)
		console.log('Category updated:', updatedCategory)
		// TODO: Call API to update category
	}

	const filteredDishes = React.useMemo(() => {
		let result = [...dishes]
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			result = result.filter(
				(dish) =>
					dish.name.toLowerCase().includes(query) ||
					dish.description.toLowerCase().includes(query),
			)
		}
		if (statusFilter !== 'ALL') {
			result = result.filter((dish) => dish.status === statusFilter)
		}
		switch (sortBy) {
			case 'name_asc':
				result.sort((a, b) => a.name.localeCompare(b.name))
				break
			case 'price_asc':
				result.sort((a, b) => a.price - b.price)
				break
			case 'price_desc':
				result.sort((a, b) => b.price - a.price)
				break
		}
		return result
	}, [dishes, searchQuery, statusFilter, sortBy])

	if (contextLoading || loading) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
				<p className="text-white">Loading...</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-transparent p-8">
			<div className="max-w-7xl mx-auto">
				<header className="mb-8 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h1 className="text-white text-4xl font-black mb-0">{categoryName}</h1>
						<button
							onClick={handleEditCategory}
							className="p-2 text-[#9dabb9] hover:text-white transition-colors"
							title="Edit category"
						>
							<span className="material-symbols-outlined">edit</span>
						</button>
					</div>
					<button
						onClick={() => navigate('/menu')}
						className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
						title="Back to categories"
					>
						<span className="material-symbols-outlined">close</span>
						<span>Close</span>
					</button>
				</header>

				<div className="mb-6 p-4 bg-black/30 backdrop-blur-md rounded-xl border border-white/20">
					<div className="flex gap-4">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search dishes..."
							className="flex-1 px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-[#9dabb9] focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] transition-all"
						/>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all"
						>
							<option value="ALL">All Status</option>
							<option value="READY">Ready</option>
							<option value="NOT_READY">Not Ready</option>
						</select>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all"
						>
							<option value="default">Default Sort</option>
							<option value="name_asc">Name A-Z</option>
							<option value="price_asc">Price Low-High</option>
							<option value="price_desc">Price High-Low</option>
						</select>
						<button
							onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
							className="px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0d6ecc] transition-colors"
						>
							<span className="material-symbols-outlined">
								{viewMode === 'grid' ? 'view_list' : 'grid_view'}
							</span>
						</button>
					</div>
				</div>

				<div
					className={`grid gap-6 ${
						viewMode === 'grid'
							? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
							: 'grid-cols-1'
					}`}
				>
					{filteredDishes.map((dish) => (
						<DishCard
							key={dish.id}
							dish={dish}
							onDelete={(d) => setDishToDelete(d)}
							onClick={(d) => setSelectedDish(d)}
							viewMode={viewMode}
						/>
					))}
					<AddDishCard onClick={() => setIsAddDishModalOpen(true)} />
				</div>
			</div>

			<DishDetailsModal
				isOpen={!!selectedDish}
				dish={selectedDish}
				onClose={() => setSelectedDish(null)}
				onSave={handleUpdateDish}
				onToggleStatus={handleToggleDishStatus}
			/>

			<ConfirmationModal
				isOpen={!!dishToDelete}
				title="Confirm Dish Deletion"
				message={dishToDelete ? `Delete "${dishToDelete.name}"?` : ''}
				onConfirm={executeDeleteDish}
				onClose={() => setDishToDelete(null)}
			/>

			<AddDishModal
				isOpen={isAddDishModalOpen}
				onClose={() => setIsAddDishModalOpen(false)}
				onSave={handleSaveNewDish}
				categorySlug={categorySlug}
				categoryName={categoryName}
			/>

			<EditCategoryModal
				isOpen={isEditCategoryModalOpen}
				onClose={() => setIsEditCategoryModalOpen(false)}
				onSave={handleSaveCategory}
				categoryData={{ name: categoryName, image: categoryImage }}
			/>

			<link
				href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
				rel="stylesheet"
			/>
		</div>
	)
}

export default CategoryDishes
