import React from 'react'

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
	// 🕒 Backend returns prepTimeMinutes
	const prepTime = dish.prepTimeMinutes || dish.preparationTime

	return (
		<div className="group relative overflow-hidden rounded-xl backdrop-blur-xl bg-[#1A202C]/80 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-white/20 flex flex-col h-full">
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
				<div className="absolute top-2 right-2 flex flex-col gap-1">
					{isChefRecommended && (
						<span className="px-1.5 py-0.5 bg-yellow-500/90 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5">
							<span className="material-symbols-outlined text-xs">star</span>
							<span className="hidden sm:inline">Chef's Choice</span>
						</span>
					)}
					{!isAvailable && (
						<span className="px-1.5 py-0.5 bg-red-500/90 text-white text-[10px] font-bold rounded-full">
							N/A
						</span>
					)}
				</div>
			</div>
			{/* Content Section */}
			<div className="p-3 flex flex-col flex-grow">
				<div className="flex items-start justify-between mb-1.5">
					<h3 className="text-sm sm:text-base font-bold text-white flex-1 line-clamp-2">
						{dish.name}
					</h3>
					<span className="text-base sm:text-lg font-bold text-[#4ade80] ml-2 flex-shrink-0">
						${typeof dish.price === 'number' ? dish.price.toFixed(2) : dish.price}
					</span>
				</div>

				{dish.description && (
					<p className="text-xs text-[#9dabb9] mb-2 line-clamp-2 hidden sm:block">
						{dish.description}
					</p>
				)}

				{/* Meta Info */}
				<div className="flex flex-wrap items-center gap-2 mb-2 text-[10px] sm:text-xs text-[#9dabb9]">
					{hasModifiers && (
						<span className="flex items-center gap-0.5">
							<span className="material-symbols-outlined text-xs">tune</span>
							<span className="hidden sm:inline">Custom</span>
						</span>
					)}
					{prepTime && (
						<span className="flex items-center gap-0.5">
							<span className="material-symbols-outlined text-xs">schedule</span>
							{prepTime}m
						</span>
					)}
					{dish.spicyLevel > 0 && (
						<span className="flex items-center gap-0.5">
							{'🌶️'.repeat(Math.min(dish.spicyLevel, 3))}
						</span>
					)}
				</div>

				{/* Spacer to push button to bottom */}
				<div className="flex-grow"></div>

				{/* Action Button */}
				<button
					onClick={() => onViewDetails(dish)}
					disabled={!isAvailable}
					className={`w-full py-2.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 mt-2 ${
						isAvailable
							? 'bg-[#137fec] text-white hover:bg-blue-600 active:scale-95'
							: 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
					}`}
				>
					{isAvailable ? (
						<>
							<span className="material-symbols-outlined text-base">
								add_shopping_cart
							</span>
							<span className="hidden sm:inline">
								{hasModifiers ? 'Customize & Add' : 'Add to Cart'}
							</span>
							<span className="sm:hidden">Add</span>
						</>
					) : (
						<span>Not Available</span>
					)}
				</button>
			</div>
		</div>
	)
}

export default DishCard
