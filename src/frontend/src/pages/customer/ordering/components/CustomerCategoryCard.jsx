import React from 'react'

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
			className="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-xl bg-[#1A202C]/60 border border-white/20"
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
				<div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
					<h3 className="text-base sm:text-xl md:text-2xl font-bold text-white leading-tight">
						{category.name}
					</h3>
					{category.description && (
						<p className="text-xs sm:text-sm text-gray-300 mt-1 line-clamp-2">
							{category.description}
						</p>
					)}
					<div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
						<span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold bg-blue-500/20 text-blue-400">
							{itemCount} {itemCount === 1 ? 'item' : 'items'}
						</span>
						{isActive && (
							<span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold bg-green-500/20 text-green-400">
								AVAILABLE
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default CustomerCategoryCard
