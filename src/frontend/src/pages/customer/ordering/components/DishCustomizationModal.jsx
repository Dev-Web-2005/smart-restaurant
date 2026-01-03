import React, { useState, useMemo, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'

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
							priceDelta: option.priceDelta || option.priceAdjustment || 0,
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
								priceDelta: option.priceDelta || option.priceAdjustment || 0,
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
				className={`relative backdrop-blur-xl bg-[#1A202C]/90 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden border border-white/20 transition-all duration-300 transform scale-100 opacity-100`}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-white/10">
					<div>
						<h2 className="text-2xl font-bold text-white m-0">{dish.name}</h2>
						<div className="flex items-center gap-3 mt-1">
							<p className="text-[#9dabb9] text-sm">${dish.price.toFixed(2)}</p>
							{(dish.prepTimeMinutes || dish.preparationTime) && (
								<>
									<span className="text-[#9dabb9]">•</span>
									<span className="flex items-center gap-1 text-[#9dabb9] text-sm">
										<span className="material-symbols-outlined text-sm">schedule</span>
										{dish.prepTimeMinutes || dish.preparationTime} min
									</span>
								</>
							)}
						</div>
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
								className="w-10 h-10 flex items-center justify-center bg-[#137fec] text-white rounded-full hover:bg-[#4A5568] transition-colors"
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

export default DishCustomizationModal
