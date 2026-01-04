import React from 'react'

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
	// 🕒 Backend returns prepTimeMinutes
	const prepTime = dish.prepTimeMinutes || dish.preparationTime

	return (
		<div className="group relative overflow-hidden rounded-xl backdrop-blur-xl bg-[#1A202C]/80 shadow-lg transition-all duration-300 hover:shadow-2xl border border-white/20 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
			{/* Image Section */}
			<div className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0 relative">
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
					<div className="absolute top-1 right-1 sm:top-2 sm:right-2">
						<span className="material-symbols-outlined text-yellow-400 text-base sm:text-xl">
							star
						</span>
					</div>
				)}
			</div>

			{/* Info Section */}
			<div className="flex-grow min-w-0 w-full sm:w-auto">
				<div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
					<h3 className="text-sm sm:text-lg font-bold text-white flex-1">{dish.name}</h3>
					{isChefRecommended && (
						<span className="px-1.5 sm:px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] sm:text-xs font-bold rounded">
							Chef's Choice
						</span>
					)}
					{/* Price on mobile - inline with title */}
					<span className="sm:hidden text-base font-bold text-[#4ade80] ml-auto">
						${typeof dish.price === 'number' ? dish.price.toFixed(2) : dish.price}
					</span>
				</div>
				{dish.description && (
					<p className="text-xs sm:text-sm text-[#9dabb9] line-clamp-2 mb-2">{dish.description}</p>
				)}

				{/* Meta Info */}
				<div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#9dabb9]">
					{hasModifiers && (
						<span className="flex items-center gap-0.5 sm:gap-1">
							<span className="material-symbols-outlined text-xs sm:text-sm">tune</span>
							<span className="hidden sm:inline">Customizable</span>
							<span className="sm:hidden">Custom</span>
						</span>
					)}
					{prepTime && (
						<span className="flex items-center gap-0.5 sm:gap-1">
							<span className="material-symbols-outlined text-xs sm:text-sm">schedule</span>
							{prepTime}<span className="hidden sm:inline"> min</span><span className="sm:hidden">m</span>
						</span>
					)}
					{dish.spicyLevel > 0 && (
						<span className="flex items-center gap-0.5 sm:gap-1">
							{'🌶️'.repeat(dish.spicyLevel)}
						</span>
					)}
				</div>
			</div>

			{/* Price Section - Desktop only */}
			<div className="hidden sm:block w-20 sm:w-24 flex-shrink-0 text-right">
				<span className="text-lg sm:text-xl font-bold text-[#4ade80] whitespace-nowrap">
					${typeof dish.price === 'number' ? dish.price.toFixed(2) : dish.price}
				</span>
			</div>

			{/* Action Button */}
			<button
				onClick={() => onViewDetails(dish)}
				disabled={!isAvailable}
				className={`w-full sm:w-auto sm:min-w-[140px] py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
					isAvailable
						? 'bg-[#137fec] text-white hover:bg-blue-600'
						: 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
				}`}
			>
				{isAvailable ? (
					<>
						<span className="material-symbols-outlined text-sm">add_shopping_cart</span>
						<span className="hidden sm:inline">Add to Cart</span>
						<span className="sm:hidden">Add</span>
					</>
				) : (
					<span className="text-xs sm:text-sm">N/A</span>
				)}
			</button>
		</div>
	)
}

export default DishListItem
