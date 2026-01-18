import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CustomerCategoryCard from '../components/CustomerCategoryCard'
import DishCard from '../components/DishCard'
import DishListItem from '../components/DishListItem'
import DishCustomizationModal from '../components/DishCustomizationModal'
import { getPublicMenuAPI } from '../../../../services/api/publicMenuAPI'

// Custom Dropdown Component with Glass Morphism
const CustomDropdown = ({ value, onChange, options, disabled, label }) => {
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef(null)

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	const selectedOption = options.find((opt) => opt.value === value)

	return (
		<div ref={dropdownRef} className="relative flex-1">
			<button
				type="button"
				onClick={() => !disabled && setIsOpen(!isOpen)}
				disabled={disabled}
				className="w-full px-2 sm:px-3 py-1.5 sm:py-2 pr-8 text-xs sm:text-sm rounded-lg bg-black/40 backdrop-blur-md text-white border border-white/10 focus:border-[#137fec] focus:ring-2 focus:ring-[#137fec]/20 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-black/50 text-left"
			>
				{selectedOption?.label || 'Select...'}
			</button>
			<span
				className={`material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#9dabb9] text-sm pointer-events-none transition-transform duration-200 ${
					isOpen ? 'rotate-180' : ''
				}`}
			>
				expand_more
			</span>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.15 }}
						className="absolute z-50 w-full mt-1 rounded-lg bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden"
					>
						{options.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									onChange(option.value)
									setIsOpen(false)
								}}
								className={`w-full px-3 py-2 text-left text-sm transition-all duration-150 ${
									option.value === value
										? 'bg-[#137fec]/30 text-white font-medium'
										: 'text-[#9dabb9] hover:bg-white/10 hover:text-white'
								}`}
							>
								{option.label}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

const MenuPage = ({ tenantId, onAddToCart, onBack }) => {
	// State management
	const [categories, setCategories] = useState([])
	const [dishes, setDishes] = useState([])
	const [selectedCategory, setSelectedCategory] = useState(null)
	const [view, setView] = useState('CATEGORIES') // CATEGORIES | DISHES
	const [layoutView, setLayoutView] = useState('grid') // grid | list

	// Loading states
	const [loading, setLoading] = useState(true)
	const [loadingDishes, setLoadingDishes] = useState(false)
	const [error, setError] = useState(null)

	// Search, Filter, Sort States
	const [categorySearch, setCategorySearch] = useState('')
	const [dishSearch, setDishSearch] = useState('')
	const [debouncedDishSearch, setDebouncedDishSearch] = useState('') // ✅ Debounced search
	const [availableFilter, setAvailableFilter] = useState('all') // 'all' | 'available'
	const [sortBy, setSortBy] = useState('none') // 'none' | 'price-asc' | 'price-desc' | 'name'

	// Pagination for dishes
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalItems, setTotalItems] = useState(0)
	const itemsPerPage = 20

	// State for Customization Modal
	const [selectedDish, setSelectedDish] = useState(null)
	const [isCustomizationOpen, setIsCustomizationOpen] = useState(false)

	// Refs for debouncing and preventing duplicate fetches
	const fetchDishesTimeoutRef = useRef(null)
	const lastFetchParamsRef = useRef(null)
	const isFetchingRef = useRef(false)
	const categoriesCacheRef = useRef(null) // ✅ Cache categories

	// ==================== DEBOUNCE SEARCH ====================
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedDishSearch(dishSearch)
		}, 400) // 400ms debounce

		return () => clearTimeout(timer)
	}, [dishSearch])

	// Fetch categories when component mounts (with caching)
	useEffect(() => {
		if (!tenantId) {
			console.error('❌ Missing tenantId')
			setError('Invalid URL: Missing restaurant identifier')
			setLoading(false)
			return
		}

		// ✅ Check cache first
		if (categoriesCacheRef.current && categoriesCacheRef.current.tenantId === tenantId) {
			console.log('📦 Using cached categories')
			setCategories(categoriesCacheRef.current.data)
			setLoading(false)
			return
		}

		fetchCategories()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId])

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
				setCategories(response.categories)
				// ✅ Cache the result
				categoriesCacheRef.current = {
					tenantId,
					data: response.categories,
					timestamp: Date.now(),
				}
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

	// ==================== OPTIMIZED FETCH DISHES ====================
	const fetchDishes = useCallback(
		async (categoryId, page, search, sort, filter) => {
			// ✅ Create a unique key for this fetch request
			const fetchKey = JSON.stringify({ categoryId, page, search, sort, filter })

			// ✅ Skip if same params as last fetch
			if (lastFetchParamsRef.current === fetchKey) {
				console.log('⏭️ Skipping duplicate fetch request')
				return
			}

			// ✅ Skip if already fetching
			if (isFetchingRef.current) {
				console.log('⏳ Fetch already in progress, queuing...')
				// Queue the fetch for later
				if (fetchDishesTimeoutRef.current) {
					clearTimeout(fetchDishesTimeoutRef.current)
				}
				fetchDishesTimeoutRef.current = setTimeout(() => {
					fetchDishes(categoryId, page, search, sort, filter)
				}, 100)
				return
			}

			isFetchingRef.current = true
			lastFetchParamsRef.current = fetchKey

			try {
				setLoadingDishes(true)
				setError(null)
				console.log('📥 Fetching dishes for category:', categoryId, {
					page,
					search,
					sort,
					filter,
				})

				// Build params for API call
				const params = {
					categoryId,
					page,
					limit: itemsPerPage,
				}

				// Add search if present
				if (search && search.trim()) {
					params.search = search.trim()
				}

				// Add sort parameters
				if (sort !== 'none') {
					if (sort === 'price-asc') {
						params.sortBy = 'price'
						params.sortOrder = 'ASC'
					} else if (sort === 'price-desc') {
						params.sortBy = 'price'
						params.sortOrder = 'DESC'
					} else if (sort === 'name') {
						params.sortBy = 'name'
						params.sortOrder = 'ASC'
					}
				}

				const response = await getPublicMenuAPI(tenantId, params)

				if (response.success && response.items) {
					console.log('✅ Dishes loaded:', response.items.length)

					// Filter by availability on frontend if needed
					let filteredItems = response.items
					if (filter === 'available') {
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
				isFetchingRef.current = false
			}
		},
		[tenantId],
	)

	// ==================== SINGLE EFFECT FOR FETCHING DISHES ====================
	// Combines page change and filter change handling to prevent double-fetch
	useEffect(() => {
		if (!selectedCategory || view !== 'DISHES') return

		// Clear any pending fetch
		if (fetchDishesTimeoutRef.current) {
			clearTimeout(fetchDishesTimeoutRef.current)
		}

		// Small delay to batch rapid changes
		fetchDishesTimeoutRef.current = setTimeout(() => {
			fetchDishes(
				selectedCategory.id,
				currentPage,
				debouncedDishSearch,
				sortBy,
				availableFilter,
			)
		}, 50)

		return () => {
			if (fetchDishesTimeoutRef.current) {
				clearTimeout(fetchDishesTimeoutRef.current)
			}
		}
	}, [
		selectedCategory,
		currentPage,
		debouncedDishSearch,
		sortBy,
		availableFilter,
		view,
		fetchDishes,
	])

	// ==================== RESET PAGE ON FILTER CHANGE ====================
	// Only reset page, don't trigger fetch (the effect above will handle it)
	const prevFiltersRef = useRef({ search: '', sort: 'none', filter: 'all' })
	useEffect(() => {
		if (!selectedCategory || view !== 'DISHES') return

		const filtersChanged =
			prevFiltersRef.current.search !== debouncedDishSearch ||
			prevFiltersRef.current.sort !== sortBy ||
			prevFiltersRef.current.filter !== availableFilter

		if (filtersChanged && currentPage !== 1) {
			// Reset to page 1 when filters change
			setCurrentPage(1)
			// Clear last fetch params to allow new fetch
			lastFetchParamsRef.current = null
		}

		prevFiltersRef.current = {
			search: debouncedDishSearch,
			sort: sortBy,
			filter: availableFilter,
		}
	}, [selectedCategory, view, debouncedDishSearch, sortBy, availableFilter, currentPage])

	// Filter categories by search
	const filteredCategories = useMemo(() => {
		if (!categorySearch.trim()) return categories
		return categories.filter((cat) =>
			cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
		)
	}, [categories, categorySearch])

	// Handle Dish Click to Open Customization Modal
	const handleViewDetails = (dish) => {
		setSelectedDish(dish)
		setIsCustomizationOpen(true)
	}

	// Logic to add cart from Customization Modal
	const handleAddToCartFromModal = (cartItem) => {
		onAddToCart(cartItem)
		setIsCustomizationOpen(false)
		setSelectedDish(null)
	}

	const handleCategorySelect = (categoryData) => {
		console.log('📂 Category selected:', categoryData)
		setSelectedCategory(categoryData)
		setView('DISHES')
		setCurrentPage(1)
		setDishSearch('')
	}

	const handleBack = () => {
		if (onBack && view === 'CATEGORIES') {
			onBack()
		} else {
			setView('CATEGORIES')
			setSelectedCategory(null)
			setDishes([])
			setDishSearch('')
			setCurrentPage(1)
		}
	}

	// Loading state for initial categories load
	if (loading) {
		return (
			<div className="relative z-10 flex items-center justify-center min-h-screen">
				<div className="text-center backdrop-blur-xl bg-[#1A202C]/80 p-8 rounded-xl border border-white/20">
					<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#137fec] mx-auto mb-4"></div>
					<p className="text-white text-lg">Loading menu...</p>
				</div>
			</div>
		)
	}

	// Error state
	if (error && !categories.length) {
		return (
			<div className="relative z-10 flex items-center justify-center min-h-screen">
				<div className="text-center backdrop-blur-xl bg-[#1A202C]/80 p-8 rounded-xl border border-white/20">
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
		<>
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
								className="w-full px-4 py-3 pl-12 rounded-lg bg-black/40 backdrop-blur-md text-white border border-white/10 focus:border-[#137fec] focus:outline-none placeholder-[#9dabb9]"
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
				<div className="p-2 sm:p-4 pb-24">
					<div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
						<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
							<button
								onClick={handleBack}
								className="p-1.5 sm:p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 flex justify-center items-center flex-shrink-0 border border-white/10"
							>
								<span className="material-symbols-outlined text-xl sm:text-2xl">
									arrow_back
								</span>
							</button>
							<h2 className="text-base sm:text-xl md:text-2xl font-bold text-white truncate">
								{selectedCategory?.name || 'Menu Items'}
							</h2>
						</div>

						{/* Layout Toggle Buttons */}
						<div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-lg p-0.5 sm:p-1 flex-shrink-0 border border-white/10">
							<button
								onClick={() => setLayoutView('grid')}
								className={`p-1.5 sm:p-2 rounded-md transition-colors ${
									layoutView === 'grid'
										? 'bg-[#137fec] text-white'
										: 'text-[#9dabb9] hover:text-white'
								}`}
								title="Grid View"
							>
								<span className="material-symbols-outlined text-sm sm:text-base">
									grid_view
								</span>
							</button>
							<button
								onClick={() => setLayoutView('list')}
								className={`p-1.5 sm:p-2 rounded-md transition-colors ${
									layoutView === 'list'
										? 'bg-[#137fec] text-white'
										: 'text-[#9dabb9] hover:text-white'
								}`}
								title="List View"
							>
								<span className="material-symbols-outlined text-sm sm:text-base">
									view_list
								</span>
							</button>
						</div>
					</div>

					{/* Search, Filter, Sort Controls */}
					<div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
						{/* Search Bar */}
						<div className="relative">
							<input
								type="text"
								value={dishSearch}
								onChange={(e) => setDishSearch(e.target.value)}
								placeholder="Search dishes..."
								className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pl-9 sm:pl-11 rounded-lg bg-black/40 backdrop-blur-md text-white text-xs sm:text-sm border border-white/10 focus:border-[#137fec] focus:outline-none placeholder-[#9dabb9]"
							/>
							<span className="material-symbols-outlined absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-[#9dabb9] text-sm sm:text-base">
								search
							</span>
							{dishSearch && (
								<button
									onClick={() => setDishSearch('')}
									className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-[#9dabb9] hover:text-white"
								>
									<span className="material-symbols-outlined text-sm sm:text-base">
										close
									</span>
								</button>
							)}
						</div>

						{/* Filter and Sort Controls */}
						<div className="flex flex-wrap gap-2 items-center">
							{/* Availability Filter */}
							<div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-[120px]">
								<span className="text-[#9dabb9] text-xs font-medium whitespace-nowrap">
									Status:
								</span>
								<CustomDropdown
									value={availableFilter}
									onChange={setAvailableFilter}
									disabled={loadingDishes}
									options={[
										{ value: 'all', label: 'All' },
										{ value: 'available', label: 'Available' },
									]}
								/>
							</div>

							{/* Sort Dropdown */}
							<div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-[120px]">
								<span className="text-[#9dabb9] text-xs font-medium whitespace-nowrap">
									Sort:
								</span>
								<CustomDropdown
									value={sortBy}
									onChange={setSortBy}
									disabled={loadingDishes}
									options={[
										{ value: 'none', label: 'Default' },
										{ value: 'name', label: 'Name' },
										{ value: 'price-asc', label: 'Price ↑' },
										{ value: 'price-desc', label: 'Price ↓' },
									]}
								/>
								<span className="text-white text-xs font-medium">
									{loadingDishes ? (
										'...'
									) : (
										<>
											{dishes.length}
											{totalItems > dishes.length && (
												<span className="hidden sm:inline"> / {totalItems}</span>
											)}
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
								<div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
		</>
	)
}

export default MenuPage
