import React, { useState, useEffect } from 'react'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API
import { useUser } from '../../../contexts/UserContext' // 👈 IMPORT CONTEXT
import { useLoading } from '../../../contexts/LoadingContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import AddCategoryModal from './AddCategoryModal'
import CategoryDishes from './CategoryDishes'
import ReactDOM from 'react-dom' // Thêm import này
import { InlineLoader, CardSkeleton } from '../../../components/common/LoadingSpinner'

// --- Dữ liệu Mock (Giữ nguyên) ---
const mockCategories = [
	{
		id: 1,
		name: 'Soups',
		image: 'https://images3.alphacoders.com/108/1088128.jpg',
		route: 'soups',
		status: 'ACTIVE',
	},
	{
		id: 2,
		name: 'Salads',
		image:
			'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',
		route: 'salads',
		status: 'ACTIVE',
	},
	{
		id: 3,
		name: 'Rice Dishes',
		image:
			'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80',
		route: 'rice-dishes',
		status: 'ACTIVE',
	},
	{
		id: 4,
		name: 'Noodle Dishes',
		image:
			'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=500&q=80',
		route: 'noodle-dishes',
		status: 'INACTIVE',
	},
	{
		id: 5,
		name: 'Seafood',
		image:
			'https://images.unsplash.com/photo-1535400255456-984241443b29?auto=format&fit=crop&w=500&q=80',
		route: 'seafood',
		status: 'ACTIVE',
	},
	{
		id: 6,
		name: 'Grilled Specialties',
		image:
			'https://sofein.ch/cdn/shop/articles/zart-und-wuerzig-das-perfekte-steak-mit-unserer-speziellen-marinade-1727604884.webp?v=1729157602',
		route: 'grilled',
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
	{
		id: 8,
		name: 'Desserts',
		image: 'https://wallpapercave.com/wp/wp12572997.jpg',
		route: 'desserts',
		status: 'ACTIVE',
	},
	{
		id: 9,
		name: 'Beverages',
		image:
			'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=80',
		route: 'beverages',
		status: 'INACTIVE',
	},
]

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

	const [categories, setCategories] = useState(mockCategories)
	const [loading, setLoading] = useState(false)
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [selectedCategorySlug, setSelectedCategorySlug] = useState(null)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [categoryToDelete, setCategoryToDelete] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')

	// Debounce search query
	const debouncedSearchQuery = useDebounce(searchQuery, 300)

	const fetchCategories = async () => {
		console.log('Fetching menu categories...')
	}

	useEffect(() => {
		// if (!contextLoading) fetchCategories();
	}, [contextLoading])

	const handleDeleteCategory = async (category) => {
		setCategoryToDelete(category)
		setIsDeleteModalOpen(true)
	}

	const handleToggleStatus = async (category) => {
		const newStatus = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
		const actionText = newStatus === 'ACTIVE' ? 'activate' : 'deactivate'

		if (!window.confirm(`Are you sure you want to ${actionText} "${category.name}"?`)) {
			return
		}

		setLoading(true)
		showLoading(
			`${actionText === 'activate' ? 'Activating' : 'Deactivating'} category...`,
		)

		try {
			// TODO: Replace with actual API call when backend is ready
			// await axios.patch(`/api/categories/${category.id}`, { status: newStatus })

			setCategories((prev) =>
				prev.map((c) => (c.id === category.id ? { ...c, status: newStatus } : c)),
			)

			console.log(`Category ${category.id} status changed to: ${newStatus}`)
			// Show success notification (optional)
		} catch (error) {
			console.error('Error toggling category status:', error)
			alert(`Failed to ${actionText} category. Please try again.`)
		} finally {
			setLoading(false)
			hideLoading()
		}
	}

	const confirmDelete = async () => {
		if (!categoryToDelete) return

		const categoryId = categoryToDelete.id
		const categoryName = categoryToDelete.name

		setIsDeleteModalOpen(false)
		setLoading(true)
		showLoading('Đang xóa danh mục...')

		setCategories((prev) => prev.filter((c) => c.id !== categoryId))
		setCategoryToDelete(null)

		console.log(`DELETING Category: ${categoryId}`)

		setLoading(false)
		hideLoading()
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

	const handleSaveCategory = (newCategory) => {
		const categoryWithRoute = {
			...newCategory,
			route: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
			id: Date.now(),
		}
		setCategories((prev) => [...prev, categoryWithRoute])
	}

	const handleAddDish = () => {
		alert('Opening form to add new dish directly.')
	}

	// Filter categories based on debounced search query
	const filteredCategories = categories.filter((category) =>
		category.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
	)

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

				{/* Search Bar */}
				<div className="mb-6">
					<SearchBar
						placeholder="Search categories by name..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onClear={() => setSearchQuery('')}
					/>
				</div>

				<div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
					{loading ? (
						<p className="text-[#9dabb9] lg:col-span-3 text-center py-10">
							Loading categories...
						</p>
					) : filteredCategories.length === 0 ? (
						<div className="lg:col-span-4 text-center py-10">
							<p className="text-[#9dabb9] text-lg">
								{searchQuery
									? `No categories found matching "${searchQuery}"`
									: 'No categories available'}
							</p>
						</div>
					) : (
						filteredCategories.map((category) => (
							<CategoryCard
								key={category.id}
								category={category}
								onClick={() => handleCardClick(category.route)}
								onDeleteRequest={handleDeleteCategory}
								onToggleStatus={handleToggleStatus}
							/>
						))
					)}

					{!searchQuery && <AddCategoryCard onClick={handleAddCategory} />}
				</div>

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
