import React, { useState, useEffect } from 'react'
import { useUser } from '../../../contexts/UserContext'
import { useLoading } from '../../../contexts/LoadingContext'
import { useAlert } from '../../../contexts/AlertContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import AddCategoryModal from './AddCategoryModal'
import CategoryDishes from './CategoryDishes'
import ReactDOM from 'react-dom'
import { InlineLoader, CardSkeleton } from '../../../components/common/LoadingSpinner'
import {
	getCategoriesAPI,
	createCategoryAPI,
	updateCategoryStatusAPI,
	deleteCategoryAPI,
} from '../../../services/api/categoryAPI'

// --- Sub-component: Delete Confirmation Modal (ĐÃ SỬA VỚI PORTAL) ---
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, categoryName }) => {
	const modalRef = React.useRef(null)
	const [isVisible, setIsVisible] = useState(false)

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

	// Close on outside click
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

	if (!isOpen) return null

	const ModalContent = () => (
		<div
			className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-300 ${
				isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
			}`}
		>
			<div
				ref={modalRef}
				className={`relative bg-[#1A202C] p-6 rounded-xl w-full max-w-sm mx-4 shadow-2xl transition-all duration-300 transform ${
					isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
				}`}
			>
				<h3 className="text-xl font-bold text-red-400 mb-4">Confirm Deletion</h3>
				<p className="text-[#9dabb9] mb-6">
					Are you sure you want to delete the category &quot;{categoryName}
					&quot;? This action will permanently remove all associated dishes.
				</p>
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						className="h-10 px-4 rounded-lg bg-[#2D3748] text-white text-sm font-bold hover:bg-[#4A5568] transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="h-10 px-4 rounded-lg bg-[#dc2626] text-white text-sm font-bold hover:bg-red-700 transition-colors"
					>
						Yes, Delete
					</button>
				</div>
			</div>
		</div>
	)

	return ReactDOM.createPortal(<ModalContent />, document.body)
}

// --- Sub-component: Category Button Card ---
const CategoryCard = ({ category, onClick, onDeleteRequest, onToggleStatus }) => {
	const handleDeleteClick = (e) => {
		e.stopPropagation()
		onDeleteRequest(category)
	}

	const handleToggleStatus = (e) => {
		e.stopPropagation()
		onToggleStatus(category)
	}

	const isActive = category.status === 'ACTIVE'

	return (
		<div
			onClick={onClick}
			className="group relative flex w-full aspect-square bg-[#1A202C] rounded-lg overflow-hidden transition-all duration-200 hover:bg-[#2D3748] hover:shadow-xl active:scale-95 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#137fec] p-0 cursor-pointer"
		>
			<div className="h-full w-full overflow-hidden relative">
				<div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
				<img
					src={category.image}
					alt={category.name}
					className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
				/>
				{/* Inactive Overlay */}
				{!isActive && (
					<div className="absolute inset-0 bg-black/60 z-15 flex items-center justify-center">
						<span className="text-gray-400 text-sm font-bold bg-black/70 px-3 py-1 rounded-full">
							INACTIVE
						</span>
					</div>
				)}
			</div>

			<div className="absolute inset-0 z-20 flex flex-col items-start justify-end p-5 w-full text-left">
				<h3 className="text-2xl font-extrabold text-white group-hover:text-[#137fec] transition-colors text-left bg-black/50 p-2 leading-none rounded-lg backdrop-blur-sm shadow-lg">
					{category.name}
				</h3>
			</div>

			{/* Action Buttons - Top Right */}
			<div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
				{/* Toggle Status Button */}
				<button
					onClick={handleToggleStatus}
					title={isActive ? 'Deactivate category' : 'Activate category'}
					className={`flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-sm transition-colors ${
						isActive
							? 'bg-green-500/30 text-green-400 hover:bg-green-500/50 hover:text-green-300'
							: 'bg-gray-500/30 text-gray-400 hover:bg-gray-500/50 hover:text-gray-300'
					}`}
				>
					<span className="material-symbols-outlined text-base">
						{isActive ? 'toggle_on' : 'toggle_off'}
					</span>
				</button>

				{/* Delete Button */}
				<button
					onClick={handleDeleteClick}
					title={`Delete ${category.name}`}
					className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-red-400 hover:bg-red-600 hover:text-white transition-colors backdrop-blur-sm"
				>
					<span className="material-symbols-outlined text-base">close</span>
				</button>
			</div>
		</div>
	)
}

// --- Sub-component: Add Category Card (GIỮ NGUYÊN) ---
const AddCategoryCard = ({ onClick }) => (
	<button
		onClick={onClick}
		className="flex flex-col items-center justify-center w-full aspect-square bg-[#1A202C] rounded-lg p-6 text-center transition-all duration-200 hover:bg-[#2D3748] hover:shadow-xl active:scale-95 border border-dashed border-[#2D3748] hover:border-[#137fec] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
	>
		<span className="material-symbols-outlined text-6xl text-[#137fec] opacity-80 mb-3">
			add_circle
		</span>
		<h3 className="text-xl font-bold text-white">Add New Category</h3>
		<p className="text-sm text-[#9dabb9] mt-1">Organize your menu structure.</p>
	</button>
)

// --- Custom Hook: useDebounce ---
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

// --- Sub-component: SearchBar ---
const SearchBar = ({ placeholder, value, onChange, onClear }) => {
	return (
		<div className="relative w-full max-w-md">
			<div className="relative">
				<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9dabb9] text-xl">
					search
				</span>
				<input
					type="text"
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					className="w-full h-10 pl-10 pr-10 bg-black/30 backdrop-blur-md text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] placeholder-[#9dabb9] transition-all"
				/>
				{value && (
					<button
						onClick={onClear}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9dabb9] hover:text-white transition-colors"
						title="Clear search"
					>
						<span className="material-symbols-outlined text-xl">close</span>
					</button>
				)}
			</div>
		</div>
	)
}

// --- Main Component ---
const MenuCategoryManagement = () => {
	const { user, loading: contextLoading } = useUser()
	const { showLoading, hideLoading } = useLoading()
	const { showAlert, showConfirm, showSuccess, showError } = useAlert()

	const [categories, setCategories] = useState([])
	const [loading, setLoading] = useState(true)
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [selectedCategorySlug, setSelectedCategorySlug] = useState(null)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [categoryToDelete, setCategoryToDelete] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('ALL') // ALL, ACTIVE, INACTIVE
	const [sortBy, setSortBy] = useState('displayOrder') // displayOrder, name, createdAt
	const [sortOrder, setSortOrder] = useState('ASC') // ASC, DESC

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalItems, setTotalItems] = useState(0)
	const [itemsPerPage, setItemsPerPage] = useState(12)

	// Debounce search query
	const debouncedSearchQuery = useDebounce(searchQuery, 300)

	// Fetch categories from API
	const fetchCategories = async () => {
		if (!user || !user.userId) {
			return
		}

		const tenantId = user.userId
		setLoading(true)

		try {
			// Build query params with pagination
			const params = {
				sortBy,
				sortOrder,
				page: currentPage,
				limit: itemsPerPage,
			}

			// Add status filter if not ALL
			if (statusFilter !== 'ALL') {
				params.status = statusFilter
			}

			// Add search query if exists
			if (debouncedSearchQuery) {
				params.search = debouncedSearchQuery
			}

			const result = await getCategoriesAPI(tenantId, params)

			if (result.success) {
				// Transform backend data to frontend format
				const transformedCategories = result.categories.map((cat) => ({
					id: cat.id,
					name: cat.name,
					description: cat.description,
					image: cat.imageUrl || 'https://images3.alphacoders.com/108/1088128.jpg', // ✅ Backend returns 'imageUrl'
					route: cat.name.toLowerCase().replace(/\s+/g, '-'),
					status: cat.status, // "ACTIVE" or "INACTIVE"
					displayOrder: cat.displayOrder,
					itemCount: cat.itemCount || 0,
					createdAt: cat.createdAt,
					updatedAt: cat.updatedAt,
				}))

				setCategories(transformedCategories)

				// Update pagination info from backend
				if (result.pagination) {
					setTotalPages(result.pagination.totalPages || 1)
					setTotalItems(result.pagination.total || transformedCategories.length)
				}
			} else {
				console.error('❌ Failed to fetch categories:', result.message)
				showAlert('error', 'Failed to load categories', result.message)
			}
		} catch (error) {
			console.error('❌ Error fetching categories:', error)
			showAlert('error', 'Error', 'Failed to load categories. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	// Load categories when component mounts or user changes
	useEffect(() => {
		if (!contextLoading && user) {
			fetchCategories()
		}
	}, [
		contextLoading,
		user,
		debouncedSearchQuery,
		statusFilter,
		sortBy,
		sortOrder,
		currentPage,
		itemsPerPage,
	])

	// Reset to page 1 when filters change
	useEffect(() => {
		if (currentPage !== 1) {
			setCurrentPage(1)
		}
	}, [debouncedSearchQuery, statusFilter, sortBy, sortOrder])

	const handleDeleteCategory = async (category) => {
		setCategoryToDelete(category)
		setIsDeleteModalOpen(true)
	}

	const handleToggleStatus = async (category) => {
		const newStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
		const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate'

		const confirmed = await showConfirm(
			'Confirm Status Change',
			`Are you sure you want to ${actionText} "${category.name}"?`,
		)
		if (!confirmed) {
			return
		}

		showLoading(
			`${actionText === 'activate' ? 'Activating' : 'Deactivating'} category...`,
		)

		try {
			const tenantId = user.userId
			const result = await updateCategoryStatusAPI(tenantId, category.id, newStatus)

			if (result.success) {
				// Update local state
				setCategories((prev) =>
					prev.map((c) => (c.id === category.id ? { ...c, status: newStatus } : c)),
				)

				showAlert(
					'success',
					'Success',
					`Category "${category.name}" has been ${actionText}d.`,
				)
			} else {
				console.error('❌ Failed to toggle status:', result.message)
				showAlert('error', 'Failed', result.message)
			}
		} catch (error) {
			console.error('❌ Error toggling category status:', error)
			showAlert('error', 'Error', `Failed to ${actionText} category. Please try again.`)
		} finally {
			hideLoading()
		}
	}

	const confirmDelete = async () => {
		if (!categoryToDelete) return

		const categoryId = categoryToDelete.id
		const categoryName = categoryToDelete.name

		setIsDeleteModalOpen(false)
		showLoading('Deleting category...')

		try {
			const tenantId = user.userId
			const result = await deleteCategoryAPI(tenantId, categoryId)

			if (result.success) {
				// Remove from local state
				setCategories((prev) => prev.filter((c) => c.id !== categoryId))
				setCategoryToDelete(null)

				showAlert('success', 'Deleted', `Category "${categoryName}" has been deleted.`)
			} else {
				console.error('❌ Failed to delete category:', result.message)
				showAlert('error', 'Failed', result.message)
			}
		} catch (error) {
			console.error('❌ Error deleting category:', error)
			showAlert('error', 'Error', 'Failed to delete category. Please try again.')
		} finally {
			hideLoading()
		}
	}

	const handleCardClick = (route) => {
		setSelectedCategorySlug(route)
	}

	const handleBackToCategories = () => {
		setSelectedCategorySlug(null)
	}

	const handleAddCategory = () => {
		setIsAddModalOpen(true)
	}

	const handleSaveCategory = async (newCategoryData) => {
		if (!user || !user.userId) {
			showAlert('error', 'Error', 'User not found. Please login again.')
			return
		}

		showLoading('Creating category...')

		try {
			const tenantId = user.userId

			// Map frontend field names to backend requirements
			const categoryPayload = {
				name: newCategoryData.name,
				description: newCategoryData.description || '',
				status: newCategoryData.status || 'ACTIVE',
				displayOrder: newCategoryData.displayOrder || 0,
			}

			// Add image URL if available
			if (newCategoryData.image) {
				categoryPayload.image = newCategoryData.image
			}
			const result = await createCategoryAPI(tenantId, categoryPayload)

			if (result.success) {
				// Transform backend response to frontend format
				const transformedCategory = {
					id: result.category.id,
					name: result.category.name,
					description: result.category.description,
					image:
						result.category.imageUrl || 'https://images3.alphacoders.com/108/1088128.jpg', // ✅ Backend returns 'imageUrl'
					route: result.category.name.toLowerCase().replace(/\s+/g, '-'),
					status: result.category.status,
					displayOrder: result.category.displayOrder,
					itemCount: 0,
					createdAt: result.category.createdAt,
					updatedAt: result.category.updatedAt,
				}

				// Add to local state
				setCategories((prev) => [...prev, transformedCategory])
				setIsAddModalOpen(false)

				showAlert(
					'success',
					'Success',
					`Category "${result.category.name}" created successfully!`,
				)
			} else {
				console.error('❌ Failed to create category:', result.message)
				showAlert('error', 'Failed', result.message)
			}
		} catch (error) {
			console.error('❌ Error creating category:', error)
			showAlert('error', 'Error', 'Failed to create category. Please try again.')
		} finally {
			hideLoading()
		}
	}

	const handleAddDish = () => {
		alert('Opening form to add new dish directly.')
	}

	if (contextLoading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading...</p>
			</div>
		)
	}

	const renderCategoryListView = () => {
		return (
			<>
				<header className="flex flex-wrap justify-between items-center gap-4 mb-8">
					<div className="flex flex-col gap-2">
						<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
							Menu Categories
						</h1>
						<p className="text-[#9dabb9] text-base">
							Manage your restaurant&apos;s menu by category.
						</p>
					</div>
				</header>

				{/* Filter and Sort Controls */}
				<div className="mb-6 flex flex-wrap gap-4 items-center">
					{/* Search Bar */}
					<div className="flex-1 min-w-[250px]">
						<SearchBar
							placeholder="Search categories by name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onClear={() => setSearchQuery('')}
						/>
					</div>

					{/* Status Filter */}
					<div className="flex items-center gap-2">
						<span className="text-[#9dabb9] text-sm font-medium">Status:</span>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="h-10 px-4 bg-black/30 backdrop-blur-md text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] transition-all cursor-pointer"
						>
							<option value="ALL">All</option>
							<option value="ACTIVE">Active</option>
							<option value="INACTIVE">Inactive</option>
						</select>
					</div>

					{/* Sort By */}
					<div className="flex items-center gap-2">
						<span className="text-[#9dabb9] text-sm font-medium">Sort:</span>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="h-10 px-4 bg-black/30 backdrop-blur-md text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] transition-all cursor-pointer"
						>
							<option value="displayOrder">Display Order</option>
							<option value="name">Name</option>
							<option value="createdAt">Created Date</option>
						</select>
					</div>

					{/* Sort Order Toggle */}
					<button
						onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
						className="h-10 w-10 flex items-center justify-center bg-black/30 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-[#137fec] hover:border-[#137fec] focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all"
						title={sortOrder === 'ASC' ? 'Ascending' : 'Descending'}
					>
						<span className="material-symbols-outlined text-xl">
							{sortOrder === 'ASC' ? 'arrow_upward' : 'arrow_downward'}
						</span>
					</button>
				</div>

				<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
					{loading ? (
						// Loading skeleton
						<>
							{[1, 2, 3, 4].map((i) => (
								<CardSkeleton key={i} />
							))}
						</>
					) : categories.length === 0 ? (
						<div className="lg:col-span-4 text-center py-10">
							<p className="text-[#9dabb9] text-lg">
								{searchQuery || statusFilter !== 'ALL'
									? 'No categories found matching your filters.'
									: 'No categories available. Click "Add New Category" to get started.'}
							</p>
						</div>
					) : (
						categories.map((category) => (
							<CategoryCard
								key={category.id}
								category={category}
								onClick={() => handleCardClick(category.route)}
								onDeleteRequest={handleDeleteCategory}
								onToggleStatus={handleToggleStatus}
							/>
						))
					)}

					{!loading && <AddCategoryCard onClick={handleAddCategory} />}
				</div>
				{/* Pagination Controls */}
				{!loading && totalPages > 1 && (
					<div className="mt-8 flex items-center justify-between p-4 bg-black/30 backdrop-blur-md rounded-xl border border-white/20">
						<div className="text-[#9dabb9] text-sm">
							Showing {categories.length} of {totalItems} categories
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setCurrentPage(1)}
								disabled={currentPage === 1}
								className="px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								title="First page"
							>
								<span className="material-symbols-outlined">first_page</span>
							</button>
							<button
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								title="Previous page"
							>
								<span className="material-symbols-outlined">chevron_left</span>
							</button>
							<div className="flex items-center gap-2">
								{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
									let pageNum
									if (totalPages <= 5) {
										pageNum = i + 1
									} else if (currentPage <= 3) {
										pageNum = i + 1
									} else if (currentPage >= totalPages - 2) {
										pageNum = totalPages - 4 + i
									} else {
										pageNum = currentPage - 2 + i
									}
									return (
										<button
											key={pageNum}
											onClick={() => setCurrentPage(pageNum)}
											className={`px-4 py-2 rounded-lg font-semibold transition-all ${
												pageNum === currentPage
													? 'bg-[#137fec] text-white'
													: 'bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10'
											}`}
										>
											{pageNum}
										</button>
									)
								})}
							</div>
							<button
								onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
								disabled={currentPage === totalPages}
								className="px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								title="Next page"
							>
								<span className="material-symbols-outlined">chevron_right</span>
							</button>
							<button
								onClick={() => setCurrentPage(totalPages)}
								disabled={currentPage === totalPages}
								className="px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								title="Last page"
							>
								<span className="material-symbols-outlined">last_page</span>
							</button>
						</div>
						<select
							value={itemsPerPage}
							onChange={(e) => {
								setItemsPerPage(Number(e.target.value))
								setCurrentPage(1)
							}}
							className="px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#137fec] transition-all"
						>
							<option value="8">8 per page</option>
							<option value="12">12 per page</option>
							<option value="20">20 per page</option>
							<option value="50">50 per page</option>
						</select>
					</div>
				)}
				{/* MODALS - Được render ở ngoài BasePageLayout */}
			</>
		)
	}

	return (
		<>
			<BasePageLayout activeRoute="Menu">
				{selectedCategorySlug ? (
					<CategoryDishes
						categorySlug={selectedCategorySlug}
						category={categories.find((cat) => cat.route === selectedCategorySlug)}
						onBack={handleBackToCategories}
					/>
				) : (
					renderCategoryListView()
				)}
			</BasePageLayout>

			{/* MODALS - Render ở ngoài BasePageLayout */}
			<AddCategoryModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleSaveCategory}
			/>

			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDelete}
				categoryName={categoryToDelete?.name}
			/>
		</>
	)
}

export default MenuCategoryManagement
