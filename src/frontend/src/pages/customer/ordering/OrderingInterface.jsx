import React, { useState, useMemo, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { getPublicMenuAPI } from '../../../services/api/publicMenuAPI'

// --- CONSTANTS & DATA MOCK (Fallback) ---
const mockCategories = [
	{
		id: 1,
		name: 'Soups',
		image: 'https://images3.alphacoders.com/108/1088128.jpg',
		route: 'soups',
		status: 'ACTIVE',
	},
	{
		id: 4,
		name: 'Noodle Dishes',
		image:
			'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=500&q=80',
		route: 'noodle-dishes',
		status: 'ACTIVE',
	},
	{
		id: 7,
		name: 'Vegetarian',
		image:
			'https://media.istockphoto.com/id/1416818056/photo/colourful-vegan-bowl-with-quinoa-and-sweet-potato.jpg?s=612x612&w=0&k=20&c=t1I58CqucV6bLRaa4iDy7PIVjnV8D9eWDjEsX9X-87k=',
		route: 'vegetarian',
		status: 'ACTIVE',
	},
]

const mockDishesData = {
	soups: [
		{
			id: 'D4',
			name: 'Tomato Soup',
			description: 'Creamy classic tomato soup.',
			price: 8.0,
			imageUrl:
				'https://images.unsplash.com/photo-1547592166-23acbe3a624b?auto=format&fit=crop&w=500&q=80',
			available: true,
			published: true,
			modifiers: [],
		},
		{
			id: 'D5',
			name: 'Chicken Noodle Soup',
			description: 'Hearty chicken soup with vegetables.',
			price: 9.5,
			imageUrl:
				'https://images.unsplash.com/photo-1588566565463-180a5b2090d2?auto=format&fit=crop&w=500&q=80',
			available: true,
			published: true,
			modifiers: [
				{
					id: '7',
					groupName: 'Spice Level',
					label: 'Mild',
					priceDelta: 0,
					type: 'single',
				},
				{
					id: '8',
					groupName: 'Spice Level',
					label: 'Spicy',
					priceDelta: 0,
					type: 'single',
				},
			],
		},
		{
			id: 'D6',
			name: 'Miso Soup',
			description: 'Traditional Japanese soup.',
			price: 6.0,
			imageUrl:
				'https://images.unsplash.com/photo-1606844724698-d4a8f3c2a1e7?auto=format&fit=crop&w=500&q=80',
			available: false,
			published: true,
			modifiers: [],
		},
	],
	'noodle-dishes': [
		{
			id: 1,
			name: 'Spicy Miso Ramen',
			description: 'Ramen with a spicy miso broth, tender chashu pork.',
			price: 15.5,
			imageUrl:
				'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=500&q=80',
			available: true,
			published: true,
			modifiers: [
				{
					id: '1',
					groupName: 'Size',
					label: 'Small',
					priceDelta: -2,
					type: 'single',
				},
				{
					id: '2',
					groupName: 'Size',
					label: 'Medium',
					priceDelta: 0,
					type: 'single',
				},
				{
					id: '3',
					groupName: 'Size',
					label: 'Large',
					priceDelta: 3,
					type: 'single',
				},
				{
					id: '4',
					groupName: 'Add-ons',
					label: 'Extra Egg',
					priceDelta: 2,
					type: 'multiple',
				},
				{
					id: '5',
					groupName: 'Add-ons',
					label: 'Extra Pork',
					priceDelta: 4,
					type: 'multiple',
				},
				{
					id: '6',
					groupName: 'Add-ons',
					label: 'Extra Noodles',
					priceDelta: 2.5,
					type: 'multiple',
				},
			],
		},
		{
			id: 2,
			name: 'Classic Pad Thai',
			description: 'Wok-fried rice noodles with shrimp and peanuts.',
			price: 14.0,
			imageUrl:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCylxfP50ETWvYyVwTx3qbbPj27wYtyyW5GQ&s',
			available: true,
			published: true,
			modifiers: [],
		},
		{
			id: 3,
			name: 'Beef Pho',
			description: 'Vietnamese beef noodle soup with herbs.',
			price: 13.5,
			imageUrl:
				'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=500&q=80',
			available: true,
			published: true,
			modifiers: [
				{
					id: '9',
					groupName: 'Meat Choice',
					label: 'Rare Beef',
					priceDelta: 0,
					type: 'single',
				},
				{
					id: '10',
					groupName: 'Meat Choice',
					label: 'Well Done',
					priceDelta: 0,
					type: 'single',
				},
				{
					id: '11',
					groupName: 'Meat Choice',
					label: 'Brisket',
					priceDelta: 1.5,
					type: 'single',
				},
			],
		},
		{
			id: 4,
			name: 'Dan Dan Noodles',
			description: 'Spicy Sichuan noodles with minced pork.',
			price: 12.0,
			imageUrl:
				'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80',
			available: false,
			published: true,
			modifiers: [],
		},
	],
	vegetarian: [
		{
			id: 'V1',
			name: 'Buddha Bowl',
			description: 'Colorful vegan bowl with quinoa and sweet potato.',
			price: 12.0,
			imageUrl:
				'https://media.istockphoto.com/id/1416818056/photo/colourful-vegan-bowl-with-quinoa-and-sweet-potato.jpg?s=612x612&w=0&k=20&c=t1I58CqucV6bLRaa4iDy7PIVjnV8D9eWDjEsX9X-87k=',
			available: false,
			published: true,
			modifiers: [],
		},
		{
			id: 'V2',
			name: 'Veggie Burger',
			description: 'Plant-based burger with avocado and fries.',
			price: 11.5,
			imageUrl:
				'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=500&q=80',
			available: true,
			published: true,
			modifiers: [
				{
					id: '12',
					groupName: 'Extras',
					label: 'Cheese',
					priceDelta: 1,
					type: 'multiple',
				},
				{
					id: '13',
					groupName: 'Extras',
					label: 'Bacon',
					priceDelta: 2,
					type: 'multiple',
				},
			],
		},
		{
			id: 'V3',
			name: 'Greek Salad',
			description: 'Fresh salad with feta and olives.',
			price: 9.0,
			imageUrl:
				'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=500&q=80',
			available: true,
			published: true,
			modifiers: [],
		},
	],
}

const formatCategoryName = (slug) => {
	if (!slug) return 'Dishes'
	return slug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

// =========================================================
// 🚨 MODAL: Dish Details Modal (Enhanced with full info display)
// =========================================================
const DishDetailsModal = ({ dish, onClose, onAddToCart }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)
	const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

	// Handle API data structure for modifiers
	const modifierGroups = useMemo(() => {
		if (!dish) return []

		// Backend returns modifierGroups array directly
		if (Array.isArray(dish.modifierGroups)) {
			return dish.modifierGroups.map((group) => ({
				id: group.id,
				name: group.name,
				isRequired: group.isRequired || false,
				minSelections: group.minSelections || 0,
				maxSelections: group.maxSelections || 1,
				displayOrder: group.displayOrder || 0,
				options: Array.isArray(group.options)
					? group.options.map((opt) => ({
							id: opt.id,
							label: opt.label,
							priceDelta: opt.priceDelta || 0,
							displayOrder: opt.displayOrder || 0,
					  }))
					: [],
			}))
		}

		// Fallback for mock/legacy data structure
		if (!dish.modifiers || dish.modifiers.length === 0) return []

		// Group modifiers by groupName
		const groupsMap = new Map()
		dish.modifiers.forEach((mod) => {
			if (!groupsMap.has(mod.groupName)) {
				groupsMap.set(mod.groupName, {
					name: mod.groupName,
					type: mod.type || 'single',
					options: [],
				})
			}
			groupsMap.get(mod.groupName).options.push(mod)
		})
		return Array.from(groupsMap.values())
	}, [dish])

	const [selectedModifiers, setSelectedModifiers] = useState([])
	const [quantity, setQuantity] = useState(1)
	const [specialNotes, setSpecialNotes] = useState('')

	// Handle modal open animation and body overflow
	useEffect(() => {
		if (dish) {
			setIsVisible(true)
			document.body.style.overflow = 'hidden'
			return () => {
				document.body.style.overflow = ''
			}
		}
	}, [dish])

	if (!dish) return null

	// Prepare photos array (from backend or fallback)
	const photos = useMemo(() => {
		if (dish.photos && dish.photos.length > 0) {
			// Sort by primary first, then displayOrder
			return [...dish.photos].sort((a, b) => {
				if (a.isPrimary && !b.isPrimary) return -1
				if (!a.isPrimary && b.isPrimary) return 1
				return (a.displayOrder || 0) - (b.displayOrder || 0)
			})
		}
		// Fallback to single imageUrl
		if (dish.imageUrl) {
			return [{ id: 'main', url: dish.imageUrl, isPrimary: true, displayOrder: 0 }]
		}
		return []
	}, [dish])

	const handleOptionSelect = (modifierId, groupName, type) => {
		setSelectedModifiers((prev) => {
			if (type === 'single') {
				return [
					...prev.filter((m) => m.groupName !== groupName),
					{ modifierId, groupName },
				]
			} else {
				const exists = prev.find((m) => m.modifierId === modifierId)
				if (exists) {
					return prev.filter((m) => m.modifierId !== modifierId)
				}
				return [...prev, { modifierId, groupName }]
			}
		})
	}

	const calculateTotalPrice = () => {
		let total = dish.price

		selectedModifiers.forEach((selected) => {
			// Check in grouped modifiers (backend)
			for (const group of modifierGroups) {
				const option = group.options.find((opt) => opt.id === selected.modifierId)
				if (option) {
					total += option.priceDelta
					break
				}
			}

			// Check in flat modifiers (legacy/mock)
			if (dish.modifiers) {
				const modifier = dish.modifiers.find((m) => m.id === selected.modifierId)
				if (modifier) {
					total += modifier.priceDelta
				}
			}
		})

		return total * quantity
	}

	const handleAddToCart = () => {
		const selectedModifierDetails = []

		selectedModifiers.forEach((selected) => {
			// Try to find in grouped modifiers (backend)
			for (const group of modifierGroups) {
				const option = group.options.find((opt) => opt.id === selected.modifierId)
				if (option) {
					selectedModifierDetails.push({
						id: option.id,
						label: option.label,
						priceDelta: option.priceDelta,
						groupName: selected.groupName,
					})
					return
				}
			}

			// Fallback to flat modifiers (legacy)
			if (dish.modifiers) {
				const modifier = dish.modifiers.find((m) => m.id === selected.modifierId)
				if (modifier) {
					selectedModifierDetails.push({
						id: modifier.id,
						label: modifier.label,
						priceDelta: modifier.priceDelta,
						groupName: selected.groupName,
					})
				}
			}
		})

		onAddToCart({
			...dish,
			quantity,
			selectedModifiers: selectedModifierDetails,
			specialNotes,
			totalPrice: calculateTotalPrice(),
		})

		onClose()
	}

	if (!isVisible) return null

	return ReactDOM.createPortal(
		<div
			className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 overflow-y-auto p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div
				ref={modalRef}
				className="relative bg-gradient-to-br from-[#1A202C] to-[#2D3748] rounded-2xl shadow-2xl w-full max-w-5xl mx-auto border border-white/20 transition-all duration-300 transform scale-100 opacity-100 my-8"
				style={{ maxHeight: 'calc(100vh - 4rem)' }}
			>
				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all duration-200 border border-white/20 hover:scale-110"
				>
					<span className="material-symbols-outlined text-2xl">close</span>
				</button>

				<div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
					{/* Photo Gallery Section */}
					{photos.length > 0 && (
						<div className="relative">
							{/* Main Photo */}
							<div className="relative w-full h-96 overflow-hidden rounded-t-2xl bg-gradient-to-br from-gray-800 to-gray-900">
								<img
									src={photos[selectedPhotoIndex]?.url}
									alt={dish.name}
									className="w-full h-full object-cover"
									onError={(e) => {
										e.target.src =
											'https://via.placeholder.com/800x400?text=No+Image+Available'
									}}
								/>
								{/* Gradient Overlay */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

								{/* Status Badge */}
								{dish.isChefRecommended && (
									<div className="absolute top-4 left-4 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-full shadow-lg flex items-center gap-2">
										<span className="material-symbols-outlined">star</span>
										<span>Chef's Recommend</span>
									</div>
								)}

								{/* Prep Time Badge */}
								{dish.prepTimeMinutes && (
									<div className="absolute top-4 right-20 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-full shadow-lg flex items-center gap-2 border border-white/20">
										<span className="material-symbols-outlined">schedule</span>
										<span className="font-semibold">{dish.prepTimeMinutes} phút</span>
									</div>
								)}

								{/* Dish Name Overlay */}
								<div className="absolute bottom-0 left-0 right-0 p-6 text-white">
									<h2 className="text-4xl font-bold mb-2 drop-shadow-lg">{dish.name}</h2>
									<div className="flex items-center gap-4">
										<span className="text-3xl font-bold text-green-400">
											${dish.price.toFixed(2)}
										</span>
										{dish.currency && dish.currency !== 'USD' && (
											<span className="text-lg text-gray-300">({dish.currency})</span>
										)}
									</div>
								</div>
							</div>

							{/* Thumbnail Gallery */}
							{photos.length > 1 && (
								<div className="flex gap-2 p-4 overflow-x-auto bg-black/30 backdrop-blur-md">
									{photos.map((photo, index) => (
										<button
											key={photo.id}
											onClick={() => setSelectedPhotoIndex(index)}
											className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
												index === selectedPhotoIndex
													? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/50'
													: 'border-white/20 hover:border-white/50'
											}`}
										>
											<img
												src={photo.url}
												alt={`${dish.name} ${index + 1}`}
												className="w-full h-full object-cover"
											/>
										</button>
									))}
								</div>
							)}
						</div>
					)}

					{/* Content Section */}
					<div className="p-6 space-y-6">
						{/* Description */}
						{dish.description && (
							<div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10">
								<h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
									<span className="material-symbols-outlined text-blue-400">
										restaurant_menu
									</span>
									Mô tả món ăn
								</h3>
								<p className="text-gray-300 leading-relaxed text-base">
									{dish.description}
								</p>
							</div>
						)}

						{/* Modifiers */}
						{modifierGroups.length > 0 && (
							<div className="space-y-4">
								<h3 className="text-xl font-bold text-white flex items-center gap-2">
									<span className="material-symbols-outlined text-blue-400">tune</span>
									Tùy chỉnh món ăn
								</h3>
								{modifierGroups.map((group) => {
									const groupType = group.maxSelections === 1 ? 'single' : 'multiple'
									return (
										<div
											key={group.id}
											className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10"
										>
											<div className="flex items-center justify-between mb-4">
												<h4 className="text-lg font-semibold text-white flex items-center gap-2">
													{group.name}
													{group.isRequired && (
														<span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
															Bắt buộc
														</span>
													)}
												</h4>
												<span className="text-sm text-gray-400">
													{groupType === 'single'
														? 'Chọn 1'
														: `Chọn tối đa ${group.maxSelections}`}
												</span>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												{group.options.map((option) => {
													const isSelected = selectedModifiers.some(
														(m) => m.modifierId === option.id,
													)
													return (
														<button
															key={option.id}
															onClick={() =>
																handleOptionSelect(option.id, group.name, groupType)
															}
															className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
																isSelected
																	? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30'
																	: 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
															}`}
														>
															<div className="flex items-center gap-3">
																<div
																	className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
																		isSelected
																			? 'border-blue-500 bg-blue-500'
																			: 'border-white/30'
																	}`}
																>
																	{isSelected && (
																		<span className="text-white text-xs">✓</span>
																	)}
																</div>
																<span className="text-white font-medium">
																	{option.label}
																</span>
															</div>
															{option.priceDelta !== 0 && (
																<span
																	className={`font-bold ${
																		option.priceDelta > 0
																			? 'text-green-400'
																			: 'text-red-400'
																	}`}
																>
																	{option.priceDelta > 0 ? '+' : ''}$
																	{option.priceDelta.toFixed(2)}
																</span>
															)}
														</button>
													)
												})}
											</div>
										</div>
									)
								})}
							</div>
						)}

						{/* Special Instructions */}
						<div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10">
							<label className="text-white font-semibold text-base mb-3 block flex items-center gap-2">
								<span className="material-symbols-outlined text-blue-400">edit_note</span>
								Ghi chú đặc biệt (Không bắt buộc)
							</label>
							<textarea
								value={specialNotes}
								onChange={(e) => setSpecialNotes(e.target.value)}
								placeholder="VD: Không hành, thêm ớt..."
								className="w-full px-4 py-3 rounded-lg bg-[#2D3748] text-white border border-white/10 focus:border-blue-500 focus:outline-none resize-none placeholder-gray-500"
								rows="3"
							/>
						</div>

						{/* Quantity Control */}
						<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-xl p-5 border border-white/20">
							<div className="flex items-center justify-between">
								<span className="text-white font-semibold text-lg flex items-center gap-2">
									<span className="material-symbols-outlined text-blue-400">
										shopping_cart
									</span>
									Số lượng
								</span>
								<div className="flex items-center gap-4">
									<button
										onClick={() => setQuantity(Math.max(1, quantity - 1))}
										className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/20 transition-all duration-200 font-bold text-xl border border-white/20 hover:scale-110"
									>
										−
									</button>
									<span className="text-white font-bold text-2xl w-16 text-center">
										{quantity}
									</span>
									<button
										onClick={() => setQuantity(quantity + 1)}
										className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 font-bold text-xl shadow-lg hover:shadow-blue-500/50 hover:scale-110"
									>
										+
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Footer: Add to Cart */}
					<div className="sticky bottom-0 p-6 border-t border-white/10 bg-gradient-to-r from-[#1A202C] to-[#2D3748] backdrop-blur-xl">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="text-gray-400 text-sm mb-1">Tổng cộng</p>
								<p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
									${calculateTotalPrice().toFixed(2)}
								</p>
							</div>
							<button
								onClick={handleAddToCart}
								className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-3 text-lg"
							>
								<span className="material-symbols-outlined text-2xl">
									add_shopping_cart
								</span>
								Thêm vào giỏ
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	)
}

// =========================================================
// 🚨 MODAL: Legacy Dish Customization Modal (Keep for backward compatibility)
// =========================================================
const DishCustomizationModal = ({ dish, onClose, onAddToCart }) => {
	const modalRef = useRef(null)
	const [isVisible, setIsVisible] = useState(false)

	// Handle API data structure for modifiers
	const modifierGroups = useMemo(() => {
		// Support both old and new API structures
		if (dish?.modifierGroups && Array.isArray(dish.modifierGroups)) {
			// New API structure from backend
			console.log('🔧 Processing modifier groups:', dish.modifierGroups)
			return dish.modifierGroups
				.filter((group) => group.options && group.options.length > 0)
				.map((group) => {
					const groupType = group.maxSelections === 1 ? 'single' : 'multiple'
					return {
						name: group.name,
						type: groupType,
						required: group.isRequired || false,
						minSelection: group.minSelections || 0,
						maxSelection: group.maxSelections || 10,
						options: (group.options || []).map((opt) => ({
							id: opt.id,
							label: opt.label,
							priceDelta: opt.priceDelta || 0,
							groupName: group.name,
							type: groupType,
						})),
					}
				})
		} else if (dish?.modifiers && Array.isArray(dish.modifiers)) {
			// Old mock structure
			const groups = {}
			dish.modifiers.forEach((mod) => {
				if (!groups[mod.groupName]) {
					groups[mod.groupName] = {
						name: mod.groupName,
						type: mod.type,
						options: [],
					}
				}
				groups[mod.groupName].options.push(mod)
			})
			return Object.values(groups)
		}
		return []
	}, [dish])

	const [selectedModifiers, setSelectedModifiers] = useState([]) // Array of modifier IDs
	const [quantity, setQuantity] = useState(1)
	const [specialNotes, setSpecialNotes] = useState('')

	// Handle modal open animation and body overflow
	useEffect(() => {
		document.body.style.overflow = 'hidden'
		requestAnimationFrame(() => setIsVisible(true))

		return () => {
			document.body.style.overflow = 'auto'
		}
	}, [])

	if (!dish) return null

	const handleOptionSelect = (modifierId, groupName, type) => {
		setSelectedModifiers((prev) => {
			if (type === 'single') {
				// Remove all other selections from same group, add this one
				const filteredPrev = prev.filter((id) => {
					// Find modifier in modifierGroups
					if (dish.modifierGroups) {
						for (const group of dish.modifierGroups) {
							const option = group.options?.find((opt) => opt.id === id)
							if (option && group.name !== groupName) {
								return true
							}
							if (option && group.name === groupName) {
								return false
							}
						}
					}
					// Fallback to old structure
					if (dish.modifiers) {
						const mod = dish.modifiers.find((m) => m.id === id)
						return mod && mod.groupName !== groupName
					}
					return false
				})
				return [...filteredPrev, modifierId]
			} else {
				// Multiple selection - toggle
				const index = prev.indexOf(modifierId)
				if (index === -1) {
					return [...prev, modifierId]
				} else {
					return prev.filter((id) => id !== modifierId)
				}
			}
		})
	}

	const calculateTotalPrice = () => {
		let total = dish.price * quantity

		// Handle both old and new API modifier structures
		selectedModifiers.forEach((modId) => {
			let modifier = null

			// Try finding in modifierGroups (new API)
			if (dish.modifierGroups) {
				for (const group of dish.modifierGroups) {
					const option = group.options?.find((opt) => opt.id === modId)
					if (option) {
						modifier = {
							priceDelta: option.priceDelta || 0,
						}
						break
					}
				}
			}

			// Fallback to old structure
			if (!modifier && dish.modifiers) {
				const mod = dish.modifiers.find((m) => m.id === modId)
				if (mod) {
					modifier = mod
				}
			}

			if (modifier) {
				total += modifier.priceDelta * quantity
			}
		})

		return total
	}

	const handleAddToCart = () => {
		// Get selected modifier details - handle both API structures
		const modifierDetails = selectedModifiers
			.map((modId) => {
				// Try new API structure first
				if (dish.modifierGroups) {
					for (const group of dish.modifierGroups) {
						const option = group.options?.find((opt) => opt.id === modId)
						if (option) {
							return {
								id: option.id,
								groupName: group.name,
								label: option.name,
								priceDelta: option.priceAdjustment || 0,
							}
						}
					}
				}

				// Fallback to old structure
				if (dish.modifiers) {
					const mod = dish.modifiers.find((m) => m.id === modId)
					if (mod) {
						return {
							id: mod.id,
							groupName: mod.groupName,
							label: mod.label,
							priceDelta: mod.priceDelta,
						}
					}
				}
				return null
			})
			.filter(Boolean)

		// Handle image URL from API
		const imageUrl = dish.photos?.[0]?.url || dish.imageUrl || dish.image

		const cartItem = {
			id: dish.id,
			name: dish.name,
			price: dish.price,
			qty: quantity,
			imageUrl: imageUrl,
			description: dish.description,
			modifiers: modifierDetails,
			specialNotes,
			totalPrice: calculateTotalPrice(),
		}

		onAddToCart(cartItem)
		onClose()
	}

	if (!isVisible) return null

	return ReactDOM.createPortal(
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all duration-300`}
		>
			<div
				ref={modalRef}
				className={`relative bg-[#1A202C] rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden border border-white/10 transition-all duration-300 transform scale-100 opacity-100`}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<div>
						<h2 className="text-2xl font-bold text-white m-0">{dish.name}</h2>
						<p className="text-[#9dabb9] text-sm mt-1">${dish.price.toFixed(2)}</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-[#2D3748] transition-colors"
					>
						<span className="material-symbols-outlined">close</span>
					</button>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)] space-y-6">
					{/* Dish Image & Info */}
					<div className="flex gap-4">
						<div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
							<img
								src={dish.imageUrl}
								alt={dish.name}
								className="w-full h-full object-cover"
							/>
						</div>
						<div className="flex-1">
							<p className="text-white leading-relaxed text-sm">{dish.description}</p>
						</div>
					</div>

					{/* Modifiers */}
					{modifierGroups.length > 0 && (
						<div className="space-y-4">
							<h3 className="text-lg font-bold text-white">Customize Your Order</h3>
							{modifierGroups.map((group) => {
								return (
									<div key={group.name} className="bg-[#2D3748] rounded-lg p-4">
										<div className="flex items-center gap-2 mb-3">
											<h4 className="text-white font-semibold m-0">{group.name}</h4>
											<span className="text-xs text-[#9dabb9]">
												({group.type === 'single' ? 'Choose 1' : 'Choose multiple'})
											</span>
										</div>

										<div className="grid grid-cols-2 gap-2">
											{group.options.map((option) => {
												const isSelected = selectedModifiers.includes(option.id)
												return (
													<button
														key={option.id}
														onClick={() =>
															handleOptionSelect(option.id, group.name, group.type)
														}
														className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
															isSelected
																? 'bg-[#137fec] text-white'
																: 'bg-[#1A202C] text-white hover:bg-[#4A5568]'
														}`}
													>
														<span>{option.label}</span>
														{option.priceDelta !== 0 && (
															<span className="ml-1 text-xs text-green-400">
																{option.priceDelta > 0 ? '+' : ''}$
																{option.priceDelta.toFixed(2)}
															</span>
														)}
													</button>
												)
											})}
										</div>
									</div>
								)
							})}
						</div>
					)}

					{/* Special Notes */}
					<div>
						<label className="text-white font-semibold text-sm mb-2 block">
							Special Instructions (Optional)
						</label>
						<textarea
							value={specialNotes}
							onChange={(e) => setSpecialNotes(e.target.value)}
							placeholder="E.g., No onions, extra spicy..."
							className="w-full px-3 py-2 rounded-lg bg-[#2D3748] text-white border border-white/10 focus:border-[#137fec] focus:outline-none resize-none"
							rows="3"
						/>
					</div>

					{/* Quantity Selector */}
					<div className="flex items-center justify-between bg-[#2D3748] rounded-lg p-4">
						<span className="text-white font-semibold">Quantity</span>
						<div className="flex items-center gap-3">
							<button
								onClick={() => setQuantity(Math.max(1, quantity - 1))}
								className="w-10 h-10 flex items-center justify-center bg-[#1A202C] text-white rounded-full hover:bg-[#4A5568] transition-colors"
							>
								−
							</button>
							<span className="text-white font-bold text-lg w-12 text-center">
								{quantity}
							</span>
							<button
								onClick={() => setQuantity(quantity + 1)}
								className="w-10 h-10 flex items-center justify-center bg-[#137fec] text-white rounded-full hover:bg-blue-600 transition-colors"
							>
								+
							</button>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-white/10 flex items-center justify-between bg-[#2D3748]">
					<div>
						<p className="text-[#9dabb9] text-xs">Total Price</p>
						<p className="text-2xl font-bold text-[#4ade80]">
							${calculateTotalPrice().toFixed(2)}
						</p>
					</div>
					<button
						onClick={handleAddToCart}
						className="px-6 py-3 bg-[#137fec] text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
					>
						Add to Cart
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}

// =========================================================
// 🚨 COMPONENT: CustomerCategoryCard
// =========================================================
const CustomerCategoryCard = ({ category, onClick }) => {
	// Handle category data from public API
	// Backend returns items array, calculate itemCount from it
	const itemCount = category.items?.length || 0
	// Use first item's image as category cover, or fallback to placeholder
	const firstItemImage =
		category.items?.[0]?.imageUrl || category.items?.[0]?.photos?.[0]?.url
	const imageUrl =
		category.coverPhoto?.url ||
		category.image ||
		firstItemImage ||
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23374151" width="400" height="400"/%3E%3Ctext fill="%239CA3AF" font-family="system-ui" font-size="20" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
	// Backend already filters active categories
	const isActive = category.status === 'ACTIVE' || true

	return (
		<div
			onClick={() => onClick(category)}
			className="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/10"
		>
			<div className="aspect-square relative">
				<img
					src={imageUrl}
					alt={category.name}
					className="w-full h-full object-cover"
					onError={(e) => {
						// Use a simple gray placeholder instead of external URL
						e.target.style.display = 'none'
						e.target.nextElementSibling.style.background = '#374151'
					}}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
				{!isActive && (
					<div className="absolute inset-0 bg-black/60 flex items-center justify-center">
						<span className="text-gray-400 text-sm font-bold bg-black/70 px-3 py-1 rounded-full">
							UNAVAILABLE
						</span>
					</div>
				)}
				<div className="absolute bottom-0 left-0 right-0 p-6">
					<h3 className="text-2xl font-bold text-white">{category.name}</h3>
					{category.description && (
						<p className="text-sm text-gray-300 mt-1 line-clamp-2">
							{category.description}
						</p>
					)}
					<div className="mt-2 flex items-center gap-2">
						<span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
							{itemCount} {itemCount === 1 ? 'item' : 'items'}
						</span>
						{isActive && (
							<span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">
								AVAILABLE
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

// =========================================================
// 🚨 COMPONENT: DishCard (Updated with full info)
// =========================================================
const DishCard = ({ dish, onViewDetails }) => {
	// Handle API data structure
	const imageUrl =
		dish.photos?.[0]?.url ||
		dish.imageUrl ||
		dish.image ||
		'https://via.placeholder.com/400?text=No+Image'
	const isAvailable = dish.status === 'AVAILABLE' || dish.available === true
	const hasModifiers = dish.modifierGroups && dish.modifierGroups.length > 0
	const isChefRecommended = dish.isChefRecommended || dish.isChefRecommendation

	return (
		<div className="group relative overflow-hidden rounded-xl bg-[#1A202C] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/10 flex flex-col h-full">
			{/* Image Section */}
			<div className="aspect-video relative overflow-hidden flex-shrink-0">
				<img
					src={imageUrl}
					alt={dish.name}
					className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
					onError={(e) => {
						e.target.src = 'https://via.placeholder.com/400?text=No+Image'
					}}
				/>

				{/* Badges */}
				<div className="absolute top-3 right-3 flex flex-col gap-2">
					{isChefRecommended && (
						<span className="px-2 py-1 bg-yellow-500/90 text-white text-xs font-bold rounded-full flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">star</span>
							Chef's Choice
						</span>
					)}
					{!isAvailable && (
						<span className="px-2 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">
							Not Available
						</span>
					)}
				</div>
			</div>

			{/* Content Section */}
			<div className="p-4 flex flex-col flex-grow">
				<div className="flex items-start justify-between mb-2">
					<h3 className="text-lg font-bold text-white flex-1">{dish.name}</h3>
					<span className="text-xl font-bold text-[#4ade80] ml-2">
						${typeof dish.price === 'number' ? dish.price.toFixed(2) : dish.price}
					</span>
				</div>

				{dish.description && (
					<p className="text-sm text-[#9dabb9] mb-3 line-clamp-2">{dish.description}</p>
				)}

				{/* Meta Info */}
				<div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-[#9dabb9]">
					{hasModifiers && (
						<span className="flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">tune</span>
							Customizable
						</span>
					)}
					{dish.preparationTime && (
						<span className="flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">schedule</span>
							{dish.preparationTime} min
						</span>
					)}
					{dish.spicyLevel > 0 && (
						<span className="flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">
								local_fire_department
							</span>
							{'🌶️'.repeat(dish.spicyLevel)}
						</span>
					)}
				</div>

				{/* Spacer to push button to bottom */}
				<div className="flex-grow"></div>

				{/* Action Button */}
				<button
					onClick={() => onViewDetails(dish)}
					disabled={!isAvailable}
					className={`w-full py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 mt-3 ${
						isAvailable
							? 'bg-[#137fec] text-white hover:bg-blue-600'
							: 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
					}`}
				>
					{isAvailable ? (
						<>
							<span className="material-symbols-outlined text-sm">add_shopping_cart</span>
							{hasModifiers ? 'Customize & Add' : 'Add to Cart'}
						</>
					) : (
						<span>Not Available</span>
					)}
				</button>
			</div>
		</div>
	)
}

// =========================================================
// 🚨 COMPONENT: DishListItem (Horizontal Layout)
// =========================================================
const DishListItem = ({ dish, onViewDetails }) => {
	// Handle API data structure
	const imageUrl =
		dish.photos?.[0]?.url ||
		dish.imageUrl ||
		dish.image ||
		'https://via.placeholder.com/400?text=No+Image'
	const isAvailable = dish.status === 'AVAILABLE' || dish.available === true
	const hasModifiers = dish.modifierGroups && dish.modifierGroups.length > 0
	const isChefRecommended = dish.isChefRecommended || dish.isChefRecommendation

	return (
		<div className="group relative overflow-hidden rounded-xl bg-[#1A202C] shadow-lg transition-all duration-300 hover:shadow-2xl border border-white/10 flex items-center gap-4 p-4">
			{/* Image Section */}
			<div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 relative">
				<img
					src={imageUrl}
					alt={dish.name}
					className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
					onError={(e) => {
						e.target.src = 'https://via.placeholder.com/400?text=No+Image'
					}}
				/>

				{/* Availability/Chef Badge */}
				{!isAvailable && (
					<div className="absolute inset-0 bg-black/60 flex items-center justify-center">
						<span className="px-2 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">
							Not Available
						</span>
					</div>
				)}
				{isChefRecommended && isAvailable && (
					<div className="absolute top-2 right-2">
						<span className="material-symbols-outlined text-yellow-400 text-xl">
							star
						</span>
					</div>
				)}
			</div>

			{/* Info Section */}
			<div className="flex-grow min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<h3 className="text-lg font-bold text-white">{dish.name}</h3>
					{isChefRecommended && (
						<span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded">
							Chef's Choice
						</span>
					)}
				</div>
				{dish.description && (
					<p className="text-sm text-[#9dabb9] line-clamp-2 mb-2">{dish.description}</p>
				)}

				{/* Meta Info */}
				<div className="flex flex-wrap items-center gap-3 text-xs text-[#9dabb9]">
					{hasModifiers && (
						<span className="flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">tune</span>
							Customizable
						</span>
					)}
					{dish.preparationTime && (
						<span className="flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">schedule</span>
							{dish.preparationTime} min
						</span>
					)}
					{dish.spicyLevel > 0 && (
						<span className="flex items-center gap-1">
							{'🌶️'.repeat(dish.spicyLevel)}
						</span>
					)}
				</div>
			</div>

			{/* Price Section - Fixed Width */}
			<div className="w-24 flex-shrink-0 text-right">
				<span className="text-xl font-bold text-[#4ade80] whitespace-nowrap">
					${typeof dish.price === 'number' ? dish.price.toFixed(2) : dish.price}
				</span>
			</div>

			{/* Action Button - Fixed Width */}
			<button
				onClick={() => onViewDetails(dish)}
				disabled={!isAvailable}
				className={`w-48 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 ${
					isAvailable
						? 'bg-[#137fec] text-white hover:bg-blue-600'
						: 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
				}`}
			>
				{isAvailable ? (
					<>
						<span className="material-symbols-outlined text-sm">add_shopping_cart</span>
						Add to Cart
					</>
				) : (
					<span>Not Available</span>
				)}
			</button>
		</div>
	)
}

// =========================================================
// 🚨 MODAL THANH TOÁN VÀ ĐẶT MÓN (CART MODAL)
// =========================================================
const CartModal = ({ isOpen, onClose, cartItems, onClearCart, onUpdateCart }) => {
	const [step, setStep] = useState('CART')
	const [paymentLoading, setPaymentLoading] = useState(false)
	const [qrCodeUrl, setQrCodeUrl] = useState(null)
	const [isOrderPlaced, setIsOrderPlaced] = useState(false)

	// Tính tổng tiền (Updated to use totalPrice from cart items)
	const total = useMemo(
		() =>
			cartItems.reduce(
				(acc, item) => acc + (item.totalPrice || item.price * item.qty),
				0,
			),
		[cartItems],
	)

	// Đóng modal và reset trạng thái (Nếu clearCart = true, component cha sẽ xóa giỏ hàng)
	const handleClose = (shouldClearCart = false) => {
		setStep('CART')
		setQrCodeUrl(null)
		setIsOrderPlaced(false)
		setPaymentLoading(false)
		onClose(shouldClearCart)
	}

	// Hàm gọi API lấy QR Code
	const handleCheckout = async () => {
		if (cartItems.length === 0) return
		setStep('PAYMENT')
		setPaymentLoading(true)

		// Comment: BẮT ĐẦU: Logic gọi API GET QR Code thanh toán
		console.log('Fetching QR code for payment...')

		// try {
		//     // API endpoint: GET /api/customer/payment/qr?amount=XX
		//     const qrRes = await axios.get(`/api/customer/payment/qr?amount=${total.toFixed(2)}`);
		//     setQrCodeUrl(qrRes.data.qrImageUrl);
		//     setStep('QR');
		// } catch (error) {
		//     alert("Failed to fetch QR code.");
		//     handleClose();
		// } finally {
		//     setPaymentLoading(false);
		// }

		// Giả lập
		setTimeout(() => {
			setQrCodeUrl(
				'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_many_purposes.svg',
			)
			setStep('QR')
			setPaymentLoading(false)
		}, 1500)
		// Comment: KẾT THÚC: Logic gọi API GET QR Code thanh toán
	}

	// Hàm gọi API Đặt món (Sau khi QR hiện ra)
	const handlePlaceOrder = async () => {
		setIsOrderPlaced(true)
		setPaymentLoading(true)

		// Comment: BẮT ĐẦU: Logic gọi API POST đặt món (Chỉ gọi sau khi QR hiện)
		// const orderPayload = {
		//   tableId: "T101", // Giả định ID bàn
		//   customerNotes: "Order paid via QR code.",
		//   items: cartItems.map((item) => ({
		//     dishId: item.id,
		//     quantity: item.qty,
		//     name: item.name,
		//     price: item.price,
		//     notes: item.notes || "",
		//   })),
		// };

		// try {
		//     // API endpoint: POST /api/customer/order/place
		//     await axios.post('/api/customer/order/place', orderPayload);
		// } catch (error) {
		//     alert('Failed to place order.');
		// } finally {
		//     setPaymentLoading(false);
		//     onClearCart(); // Xóa giỏ hàng trong component cha
		//     handleClose();
		// }

		// Giả lập
		setTimeout(() => {
			alert('Order placed successfully! (Simulated)')
			setPaymentLoading(false)
			onClearCart() // Báo hiệu component cha clear cart
			handleClose()
		}, 2000)
		// Comment: KẾT THÚC: Logic gọi API POST đặt món
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm font-['Work_Sans',_sans-serif]">
			<div className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-[#1A202C] p-8 shadow-2xl transition-all">
				<h3 className="text-2xl font-bold text-white mb-6">
					{step === 'CART' ? 'Your Order' : 'Order Confirmation'}
				</h3>

				{/* 1. CART VIEW */}
				{step === 'CART' && (
					<div className="space-y-3 max-h-96 overflow-y-auto pr-2">
						{cartItems.length === 0 ? (
							<p className="text-[#9dabb9] text-center py-10">Your cart is empty.</p>
						) : (
							cartItems.map((item, index) => (
								<div key={index} className="bg-[#2D3748] p-4 rounded-lg">
									<div className="flex items-start gap-3">
										{/* Dish Info */}
										<div className="flex-1">
											<div className="flex justify-between items-start mb-2">
												<p className="text-white font-semibold">{item.name}</p>
												<button
													onClick={() => {
														const newCart = cartItems.filter((_, i) => i !== index)
														onUpdateCart?.(newCart)
													}}
													className="text-red-400 hover:text-red-300 transition-colors"
												>
													<span className="material-symbols-outlined text-sm">
														delete
													</span>
												</button>
											</div>

											{/* Quantity Controls and Price */}
											<div className="flex justify-between items-center mb-2">
												<div className="flex items-center gap-2">
													<button
														onClick={() => {
															if (item.qty > 1) {
																const newQty = item.qty - 1
																// Recalculate totalPrice based on base price + modifiers
																const modifierTotal =
																	item.modifiers?.reduce(
																		(sum, mod) => sum + (mod.priceDelta || 0),
																		0,
																	) || 0
																const newTotalPrice =
																	(item.price + modifierTotal) * newQty
																const newCart = [...cartItems]
																newCart[index] = {
																	...item,
																	qty: newQty,
																	totalPrice: newTotalPrice,
																}
																onUpdateCart?.(newCart)
															}
														}}
														className="w-7 h-7 flex items-center justify-center bg-[#1A202C] text-white rounded hover:bg-[#4A5568] transition-colors"
													>
														−
													</button>
													<span className="text-white font-bold w-8 text-center">
														{item.qty}
													</span>
													<button
														onClick={() => {
															const newQty = item.qty + 1
															// Recalculate totalPrice based on base price + modifiers
															const modifierTotal =
																item.modifiers?.reduce(
																	(sum, mod) => sum + (mod.priceDelta || 0),
																	0,
																) || 0
															const newTotalPrice = (item.price + modifierTotal) * newQty
															const newCart = [...cartItems]
															newCart[index] = {
																...item,
																qty: newQty,
																totalPrice: newTotalPrice,
															}
															onUpdateCart?.(newCart)
														}}
														className="w-7 h-7 flex items-center justify-center bg-[#137fec] text-white rounded hover:bg-blue-600 transition-colors"
													>
														+
													</button>
												</div>
												<span className="text-[#4ade80] font-bold text-lg">
													${(item.totalPrice || item.price * item.qty).toFixed(2)}
												</span>
											</div>

											{/* Modifiers */}
											{item.modifiers && item.modifiers.length > 0 && (
												<div className="space-y-1 mt-2">
													{item.modifiers.map((mod, modIndex) => (
														<div key={modIndex} className="text-xs text-[#9dabb9]">
															<span className="font-medium">{mod.groupName}:</span>{' '}
															<span>
																{mod.label}
																{mod.priceDelta !== 0 && (
																	<span className="text-green-400">
																		{' '}
																		({mod.priceDelta > 0 ? '+' : ''}$
																		{mod.priceDelta.toFixed(2)})
																	</span>
																)}
															</span>
														</div>
													))}
												</div>
											)}

											{/* Special Notes */}
											{item.specialNotes && (
												<div className="mt-2 text-xs text-yellow-400 italic">
													Note: {item.specialNotes}
												</div>
											)}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				)}

				{/* 2. PAYMENT/QR VIEW */}
				{(step === 'PAYMENT' || step === 'QR') && (
					<div className="flex flex-col items-center justify-center py-10 space-y-4">
						{paymentLoading && <p className="text-white">Fetching QR Code...</p>}
						{qrCodeUrl && (
							<>
								<img
									src={qrCodeUrl}
									alt="Payment QR Code"
									className="w-56 h-56 border-4 border-white rounded-lg"
								/>
								<p className="text-lg font-semibold text-white mt-4">
									Scan the code to finalize payment
								</p>
							</>
						)}
					</div>
				)}

				{/* Footer and Actions */}
				<div className="mt-6 pt-4 border-t border-[#2D3748] flex justify-between items-center">
					<p className="text-xl font-bold text-white">
						Total:{' '}
						<span className="text-3xl font-black text-[#4ade80]">
							${total.toFixed(2)}
						</span>
					</p>

					<div className="flex gap-3">
						<button
							onClick={() => handleClose(false)}
							className="h-10 px-4 rounded-lg bg-[#2D3748] text-white text-sm font-bold hover:bg-[#4A5568]"
						>
							Cancel
						</button>

						{step === 'CART' && (
							<button
								onClick={handleCheckout}
								disabled={cartItems.length === 0}
								className="h-10 px-4 rounded-lg bg-[#137fec] text-white text-sm font-bold hover:bg-[#137fec]/90 disabled:opacity-50"
							>
								Checkout
							</button>
						)}

						{step === 'QR' && (
							<button
								onClick={handlePlaceOrder}
								disabled={isOrderPlaced || paymentLoading}
								className="h-10 px-4 rounded-lg bg-[#4ade80] text-black text-sm font-bold hover:bg-green-500 disabled:opacity-50"
							>
								{isOrderPlaced ? 'Order Placed' : 'Place Order'}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

// ----------------------------------------------------
// 🚨 COMPONENT 4: Main Interface (Controller)
// ----------------------------------------------------
const OrderManagementInterface = () => {
	// Get tenantId and tableId from URL params
	const { tenantId, tableId } = useParams()

	// State management
	const [categories, setCategories] = useState([])
	const [dishes, setDishes] = useState([])
	const [selectedCategory, setSelectedCategory] = useState(null)
	const [cartItems, setCartItems] = useState([]) // { id, name, price, qty, totalPrice, modifiers, specialNotes, image }
	const [isCartOpen, setIsCartOpen] = useState(false)
	const [view, setView] = useState('CATEGORIES') // CATEGORIES | DISHES
	const [layoutView, setLayoutView] = useState('grid') // grid | list

	// Loading states
	const [loading, setLoading] = useState(true)
	const [loadingDishes, setLoadingDishes] = useState(false)
	const [error, setError] = useState(null)

	// --- Search, Filter, Sort States ---
	const [categorySearch, setCategorySearch] = useState('')
	const [dishSearch, setDishSearch] = useState('')
	const [availableFilter, setAvailableFilter] = useState('all') // 'all' | 'available'
	const [sortBy, setSortBy] = useState('none') // 'none' | 'price-asc' | 'price-desc' | 'name'

	// Pagination for dishes
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalItems, setTotalItems] = useState(0)
	const itemsPerPage = 20

	// --- State for Customization Modal ---
	const [selectedDish, setSelectedDish] = useState(null)
	const [isCustomizationOpen, setIsCustomizationOpen] = useState(false)

	// Fetch categories when component mounts
	useEffect(() => {
		if (!tenantId) {
			console.error('❌ Missing tenantId in URL')
			setError('Invalid URL: Missing restaurant identifier')
			setLoading(false)
			return
		}

		console.log('🔍 OrderingInterface mounted with params:', { tenantId, tableId })
		fetchCategories()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId, tableId])

	// Fetch categories from API
	const fetchCategories = async () => {
		try {
			setLoading(true)
			setError(null)
			console.log('📥 Fetching categories for tenant:', tenantId)

			const response = await getPublicMenuAPI(tenantId, {
				// Get grouped by categories without pagination
			})

			if (response.success && response.categories) {
				console.log('✅ Categories loaded:', response.categories.length)
				console.log(
					'📦 Categories data:',
					response.categories.map((c) => ({
						name: c.name,
						itemCount: c.items?.length,
						firstItemImage: c.items?.[0]?.imageUrl || c.items?.[0]?.photos?.[0]?.url,
					})),
				)
				setCategories(response.categories)
			} else {
				console.warn('⚠️ No categories found:', response.message)
				setCategories([])
				setError(response.message || 'No menu available')
			}
		} catch (err) {
			console.error('❌ Error fetching categories:', err)
			setError('Failed to load menu. Please try again.')
			setCategories([])
		} finally {
			setLoading(false)
		}
	}

	// Fetch dishes for selected category
	const fetchDishes = async (categoryId) => {
		try {
			setLoadingDishes(true)
			setError(null)
			console.log('📥 Fetching dishes for category:', categoryId)

			// Build params for API call
			const params = {
				categoryId,
				page: currentPage,
				limit: itemsPerPage,
			}

			// Add search if present
			if (dishSearch.trim()) {
				params.search = dishSearch.trim()
			}

			// Add sort parameters
			if (sortBy !== 'none') {
				if (sortBy === 'price-asc') {
					params.sortBy = 'price'
					params.sortOrder = 'ASC'
				} else if (sortBy === 'price-desc') {
					params.sortBy = 'price'
					params.sortOrder = 'DESC'
				} else if (sortBy === 'name') {
					params.sortBy = 'name'
					params.sortOrder = 'ASC'
				}
			}

			const response = await getPublicMenuAPI(tenantId, params)

			if (response.success && response.items) {
				console.log('✅ Dishes loaded:', response.items.length)

				// Filter by availability on frontend if needed
				let filteredItems = response.items
				if (availableFilter === 'available') {
					filteredItems = filteredItems.filter(
						(item) => item.status === 'AVAILABLE' || item.isAvailable === true,
					)
				}

				setDishes(filteredItems)

				// Update pagination info
				if (response.pagination) {
					setTotalPages(response.pagination.totalPages || 1)
					setTotalItems(response.pagination.total || filteredItems.length)
				} else {
					setTotalPages(1)
					setTotalItems(filteredItems.length)
				}
			} else {
				console.warn('⚠️ No dishes found:', response.message)
				setDishes([])
				setTotalPages(1)
				setTotalItems(0)
			}
		} catch (err) {
			console.error('❌ Error fetching dishes:', err)
			setError('Failed to load dishes. Please try again.')
			setDishes([])
		} finally {
			setLoadingDishes(false)
		}
	}

	// Refetch dishes when filters change
	useEffect(() => {
		if (selectedCategory && view === 'DISHES') {
			fetchDishes(selectedCategory.id)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCategory, currentPage, dishSearch, sortBy, availableFilter, view])

	// Reset to page 1 when filters change
	useEffect(() => {
		if (selectedCategory && view === 'DISHES') {
			setCurrentPage(1)
		}
	}, [dishSearch, sortBy, availableFilter, selectedCategory, view])

	// --- Filter categories by search ---
	const filteredCategories = useMemo(() => {
		console.log('🔍 Filtering categories:', {
			total: categories.length,
			search: categorySearch,
			categories: categories,
		})
		if (!categorySearch.trim()) return categories
		return categories.filter((cat) =>
			cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
		)
	}, [categories, categorySearch])

	// --- Tính toán tổng Cart ---
	const totalItemsInCart = cartItems.reduce((acc, item) => acc + item.qty, 0)

	// --- Handle Dish Click to Open Customization Modal ---
	const handleViewDetails = (dish) => {
		setSelectedDish(dish)
		setIsCustomizationOpen(true)
	}

	// --- Logic Thêm Cart từ Customization Modal ---
	const handleAddToCartFromModal = (cartItem) => {
		// Cart item structure: { id, name, description, price, qty, totalPrice, modifiers, specialNotes, image }
		// Generate unique key for cart item based on dish ID and modifiers
		const modifierKey = JSON.stringify(cartItem.modifiers || [])
		const uniqueKey = `${cartItem.id}-${modifierKey}`

		// Check if exact same item (with same modifiers) exists
		const existingIndex = cartItems.findIndex((item) => {
			const itemModifierKey = JSON.stringify(item.modifiers || [])
			return `${item.id}-${itemModifierKey}` === uniqueKey
		})

		if (existingIndex !== -1) {
			// Update quantity if same item with same modifiers exists
			setCartItems((prev) =>
				prev.map((item, index) =>
					index === existingIndex
						? {
								...item,
								qty: item.qty + cartItem.qty,
								totalPrice:
									(item.qty + cartItem.qty) * (cartItem.totalPrice / cartItem.qty),
						  }
						: item,
				),
			)
		} else {
			// Add as new cart item if different modifiers
			setCartItems((prev) => [...prev, { ...cartItem, uniqueKey }])
		}

		setIsCustomizationOpen(false)
		setSelectedDish(null)
	}

	// Hàm mở/đóng Modal và xử lý xóa giỏ hàng sau khi đặt món
	const handleOpenCart = () => {
		setIsCartOpen(true)
	}

	const handleClearCart = () => {
		setCartItems([])
	}

	const handleUpdateCart = (newCartItems) => {
		setCartItems(newCartItems)
	}

	const handleCategorySelect = (categoryData) => {
		console.log('📂 Category selected:', categoryData)
		setSelectedCategory(categoryData)
		setView('DISHES')
		setCurrentPage(1)
		setDishSearch('')
		// Fetch will be triggered by useEffect
	}

	const handleBack = () => {
		setView('CATEGORIES')
		setSelectedCategory(null)
		setDishes([])
		setDishSearch('')
		setCurrentPage(1)
	}

	// ----------------------------------------------------
	// 🚨 RENDER
	// ----------------------------------------------------

	// Loading state for initial categories load
	if (loading) {
		return (
			<div className="w-full min-h-screen bg-[#101922] font-['Work_Sans',_sans-serif] flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#137fec] mx-auto mb-4"></div>
					<p className="text-white text-lg">Loading menu...</p>
				</div>
			</div>
		)
	}

	// Error state
	if (error && !categories.length) {
		return (
			<div className="w-full min-h-screen bg-[#101922] font-['Work_Sans',_sans-serif] flex items-center justify-center">
				<div className="text-center p-8">
					<span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">
						error
					</span>
					<h2 className="text-2xl font-bold text-white mb-2">Unable to Load Menu</h2>
					<p className="text-[#9dabb9] mb-6">{error}</p>
					<button
						onClick={() => {
							setError(null)
							fetchCategories()
						}}
						className="px-6 py-3 bg-[#137fec] text-white rounded-lg hover:bg-blue-600 transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="w-full min-h-screen bg-[#101922] font-['Work_Sans',_sans-serif]">
			{/* TOP HEADER (CART BUTTON) */}
			<div className="sticky top-0 z-40 bg-[#1A202C] p-4 flex justify-between items-center shadow-lg">
				<div className="flex items-center gap-3">
					<h1 className="text-xl font-bold text-white">Restaurant Menu</h1>
					{tenantId && (
						<span className="text-xs text-[#9dabb9] hidden sm:inline">
							{tenantId.slice(0, 8)}...
						</span>
					)}
				</div>
				<button
					onClick={handleOpenCart}
					className="relative py-2 px-4 mr-4 rounded-xl text-white hover:bg-blue-600 transition-colors flex justify-center"
				>
					<span className="material-symbols-outlined">shopping_cart</span>
					{totalItemsInCart > 0 && (
						<span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
							{totalItemsInCart}
						</span>
					)}
				</button>
			</div>

			{/* CONTENT VIEWS */}
			{view === 'CATEGORIES' ? (
				// CATEGORY VIEW
				<div className="p-4 flex flex-col items-center justify-center">
					<div className="w-full max-w-md mb-6">
						<div className="relative">
							<input
								type="text"
								value={categorySearch}
								onChange={(e) => setCategorySearch(e.target.value)}
								placeholder="Search categories..."
								className="w-full px-4 py-3 pl-12 rounded-lg bg-[#2D3748] text-white border border-white/10 focus:border-[#137fec] focus:outline-none placeholder-[#9dabb9]"
							/>
							<span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9dabb9]">
								search
							</span>
							{categorySearch && (
								<button
									onClick={() => setCategorySearch('')}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9dabb9] hover:text-white"
								>
									<span className="material-symbols-outlined">close</span>
								</button>
							)}
						</div>
					</div>

					<div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
						{filteredCategories.length > 0 ? (
							filteredCategories.map((cat) => (
								<CustomerCategoryCard
									key={cat.id}
									category={cat}
									onClick={handleCategorySelect}
								/>
							))
						) : (
							<div className="col-span-full text-center py-12">
								<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4 block">
									category
								</span>
								<p className="text-[#9dabb9] text-lg">No categories found</p>
								{categorySearch && (
									<p className="text-[#9dabb9] text-sm mt-2">Try adjusting your search</p>
								)}
							</div>
						)}
					</div>
				</div>
			) : (
				// DISHES VIEW
				<div className="p-4">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<button
								onClick={handleBack}
								className="p-2 rounded-full bg-[#2D3748] text-white hover:bg-[#4A5568] flex justify-center"
							>
								<span className="material-symbols-outlined">arrow_back</span>
							</button>
							<h2 className="text-2xl font-bold text-white">
								{selectedCategory?.name || 'Menu Items'}
							</h2>
						</div>

						{/* Layout Toggle Buttons */}
						<div className="flex items-center gap-2 bg-[#2D3748] rounded-lg p-1">
							<button
								onClick={() => setLayoutView('grid')}
								className={`p-2 rounded-md transition-colors ${
									layoutView === 'grid'
										? 'bg-[#137fec] text-white'
										: 'text-[#9dabb9] hover:text-white'
								}`}
								title="Grid View"
							>
								<span className="material-symbols-outlined">grid_view</span>
							</button>
							<button
								onClick={() => setLayoutView('list')}
								className={`p-2 rounded-md transition-colors ${
									layoutView === 'list'
										? 'bg-[#137fec] text-white'
										: 'text-[#9dabb9] hover:text-white'
								}`}
								title="List View"
							>
								<span className="material-symbols-outlined">view_list</span>
							</button>
						</div>
					</div>

					{/* Search, Filter, Sort Controls */}
					<div className="mb-6 space-y-4">
						{/* Search Bar */}
						<div className="relative">
							<input
								type="text"
								value={dishSearch}
								onChange={(e) => setDishSearch(e.target.value)}
								placeholder="Search dishes by name..."
								className="w-full px-4 py-3 pl-12 rounded-lg bg-[#2D3748] text-white border border-white/10 focus:border-[#137fec] focus:outline-none placeholder-[#9dabb9]"
							/>
							<span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9dabb9]">
								search
							</span>
							{dishSearch && (
								<button
									onClick={() => setDishSearch('')}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9dabb9] hover:text-white"
								>
									<span className="material-symbols-outlined">close</span>
								</button>
							)}
						</div>

						{/* Filter and Sort Controls */}
						<div className="flex flex-wrap gap-3 items-center">
							{/* Availability Filter */}
							<div className="flex items-center gap-2">
								<span className="text-[#9dabb9] text-sm font-medium">Status:</span>
								<select
									value={availableFilter}
									onChange={(e) => setAvailableFilter(e.target.value)}
									disabled={loadingDishes}
									className="px-4 py-2 rounded-lg bg-[#2D3748] text-white border border-white/10 focus:border-[#137fec] focus:outline-none cursor-pointer disabled:opacity-50"
								>
									<option value="all">All Items</option>
									<option value="available">Available Only</option>
								</select>
							</div>

							{/* Sort Dropdown */}
							<div className="flex items-center gap-2">
								<span className="text-[#9dabb9] text-sm font-medium">Sort by:</span>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									disabled={loadingDishes}
									className="px-4 py-2 rounded-lg bg-[#2D3748] text-white border border-white/10 focus:border-[#137fec] focus:outline-none cursor-pointer disabled:opacity-50"
								>
									<option value="none">Default</option>
									<option value="name">Name (A-Z)</option>
									<option value="price-asc">Price: Low to High</option>
									<option value="price-desc">Price: High to Low</option>
								</select>
							</div>

							{/* Results Count */}
							<div className="flex items-center gap-2 px-4 py-2 bg-[#2D3748] rounded-lg text-[#9dabb9] text-sm ml-auto">
								<span className="material-symbols-outlined text-sm">restaurant</span>
								<span>
									{loadingDishes ? (
										'Loading...'
									) : (
										<>
											{dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'}
											{totalItems > dishes.length && ` of ${totalItems}`}
										</>
									)}
								</span>
							</div>
						</div>
					</div>

					{/* Dishes Grid or List */}
					{loadingDishes &&
						ReactDOM.createPortal(
							<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-200">
								<div className="text-center bg-[#1A202C] p-10 rounded-2xl border border-white/20 shadow-2xl transform scale-100 animate-fade-in">
									<div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#137fec] mx-auto mb-6"></div>
									<p className="text-white text-xl font-semibold">Loading dishes...</p>
									<p className="text-[#9dabb9] text-sm mt-2">Please wait</p>
								</div>
							</div>,
							document.body,
						)}
					{!loadingDishes && dishes.length > 0 ? (
						<>
							{layoutView === 'grid' ? (
								<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{dishes.map((dish) => (
										<DishCard
											key={dish.id}
											dish={dish}
											onViewDetails={handleViewDetails}
										/>
									))}
								</div>
							) : (
								<div className="space-y-4">
									{dishes.map((dish) => (
										<DishListItem
											key={dish.id}
											dish={dish}
											onViewDetails={handleViewDetails}
										/>
									))}
								</div>
							)}

							{/* Pagination Controls */}
							{totalPages > 1 && (
								<div className="mt-8 flex justify-center gap-2">
									<button
										onClick={() => setCurrentPage(1)}
										disabled={currentPage === 1}
										className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										title="First Page"
									>
										<span className="material-symbols-outlined text-sm">first_page</span>
									</button>
									<button
										onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
										disabled={currentPage === 1}
										className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										title="Previous Page"
									>
										<span className="material-symbols-outlined text-sm">
											chevron_left
										</span>
									</button>
									<span className="px-4 py-2 bg-[#2D3748] text-white rounded-lg">
										Page {currentPage} of {totalPages}
									</span>
									<button
										onClick={() =>
											setCurrentPage((prev) => Math.min(totalPages, prev + 1))
										}
										disabled={currentPage === totalPages}
										className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										title="Next Page"
									>
										<span className="material-symbols-outlined text-sm">
											chevron_right
										</span>
									</button>
									<button
										onClick={() => setCurrentPage(totalPages)}
										disabled={currentPage === totalPages}
										className="px-4 py-2 rounded-lg bg-[#2D3748] text-white hover:bg-[#4A5568] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
										title="Last Page"
									>
										<span className="material-symbols-outlined text-sm">last_page</span>
									</button>
								</div>
							)}
						</>
					) : !loadingDishes ? (
						<div className="text-center py-12">
							<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4 block">
								restaurant_menu
							</span>
							<p className="text-[#9dabb9] text-lg">No dishes found</p>
							<p className="text-[#9dabb9] text-sm mt-2">
								{dishSearch || availableFilter !== 'all'
									? 'Try adjusting your search or filters'
									: 'This category has no items'}
							</p>
						</div>
					) : null}
				</div>
			)}

			{/* CUSTOMIZATION MODAL */}
			{isCustomizationOpen && selectedDish && (
				<DishCustomizationModal
					dish={selectedDish}
					onClose={() => {
						setIsCustomizationOpen(false)
						setSelectedDish(null)
					}}
					onAddToCart={handleAddToCartFromModal}
				/>
			)}

			{/* CART MODAL */}
			<CartModal
				isOpen={isCartOpen}
				onClose={(shouldClearCart) => {
					setIsCartOpen(false)
					if (shouldClearCart) {
						handleClearCart()
					}
				}}
				cartItems={cartItems}
				onClearCart={handleClearCart}
				onUpdateCart={handleUpdateCart}
			/>
		</div>
	)
}

export default OrderManagementInterface
