import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useUser } from '../../../contexts/UserContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import AddDishModal from './AddDishModal'

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
		},
		{
			id: 2,
			name: 'Classic Pad Thai',
			description:
				'Wok-fried rice noodles with shrimp, tofu, peanuts, bean sprouts, and a tangy tamarind sauce.',
			price: 14.0,
			image:
				'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCylxfP50ETWvYyVwTx3qbbPj27wYtyyW5GQ&s',
		},
		{
			id: 3,
			name: 'Vietnamese Pho',
			description: 'Traditional Vietnamese beef noodle soup with herbs and lime.',
			price: 13.75,
			image:
				'https://iamafoodblog.b-cdn.net/wp-content/uploads/2017/11/authentic-instant-pot-pho-recipe-1959w.jpg',
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

// 🚨 COMPONENT MỚI: Modal Xác nhận Xóa (ĐÃ SỬA VỚI PORTAL)
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onClose }) => {
	const modalRef = useRef(null)
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

// 🚨 COMPONENT ĐÃ SỬA ĐỔI: DishCard (Giữ nguyên)
const DishCard = ({ dish, onDelete }) => {
	const [isHovering, setIsHovering] = useState(false)

	const handleDeleteClick = (e) => {
		e.stopPropagation()
		onDelete(dish)
	}

	return (
		<div className="flex flex-col items-center">
			<div
				className="relative w-full aspect-square overflow-hidden rounded-xl bg-black/40 backdrop-blur-md transition-all group hover:shadow-2xl hover:scale-[1.02] border border-white/10"
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
			>
				<div
					className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
					style={{ backgroundImage: `url('${dish.image}')` }}
				>
					<div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
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

// --- Sub-component: Add Dish Card ---
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

const CategoryDishes = ({ categorySlug, onBack }) => {
	const { user, loading: contextLoading } = useUser()

	const [dishes, setDishes] = useState([])
	const [categoryName, setCategoryName] = useState('')
	const [loading, setLoading] = useState(true)
	const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false)
	const [dishToDelete, setDishToDelete] = useState(null)

	const fetchDishes = async (slug) => {
		console.log(`Fetching dishes for category: ${slug}`)
		setLoading(true)

		setTimeout(() => {
			const data = JSON.parse(JSON.stringify(mockDishesData[slug] || []))
			setDishes(data)
			setCategoryName(formatCategoryName(slug))
			setLoading(false)
		}, 500)
	}

	const handleSaveDish = (newDish) => {
		setDishes((prev) => [...prev, newDish])
	}

	const openDeleteConfirmation = (dish) => {
		setDishToDelete(dish)
	}

	const executeDeleteDish = async () => {
		if (!dishToDelete) return

		const dishId = dishToDelete.id
		const dishName = dishToDelete.name

		setDishToDelete(null)

		const prevDishes = dishes
		setDishes(prevDishes.filter((dish) => dish.id !== dishId))

		try {
			await new Promise((resolve) => setTimeout(resolve, 300))
			console.log(`Dish ${dishId} deleted successfully.`)
		} catch (error) {
			console.error('Error deleting dish:', error)
			setDishes(prevDishes)
			alert(`Failed to delete dish: ${error.message}. Please try again.`)
		}
	}

	useEffect(() => {
		fetchDishes(categorySlug)
	}, [categorySlug])

	const openAddDishForm = () => {
		setIsAddDishModalOpen(true)
	}

	if (contextLoading) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center">
				<p className="text-white">Loading User Context...</p>
			</div>
		)
	}

	return (
		<>
			<div>
				<header className="mb-8 flex flex-wrap justify-between items-end gap-4">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2 text-[#9dabb9]">
							<button
								onClick={onBack}
								className="text-sm text-[#9dabb9] hover:text-[#137fec] transition-colors no-underline bg-transparent border-none cursor-pointer p-0"
							>
								Menu Management
							</button>
							<span className="material-symbols-outlined text-lg">chevron_right</span>
							<span className="text-sm text-white font-medium">{categoryName}</span>
						</div>

						<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] m-0 mt-2">
							{categoryName}
						</h1>
					</div>

					<button
						onClick={onBack}
						className="flex items-center justify-center h-10 px-4 rounded-lg bg-[#2D3748] text-white text-sm font-bold gap-2 transition-colors hover:bg-[#4A5568] border-none cursor-pointer"
					>
						<span className="material-symbols-outlined text-xl">arrow_back</span>
						Back to Categories
					</button>
				</header>

				<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{loading ? (
						<p className="text-[#9dabb9] lg:col-span-3 xl:col-span-4 text-center py-10">
							Loading dishes...
						</p>
					) : dishes.length > 0 ? (
						dishes.map((dish) => (
							<DishCard key={dish.id} dish={dish} onDelete={openDeleteConfirmation} />
						))
					) : (
						<p className="text-[#9dabb9] lg:col-span-3 xl:col-span-4 text-center py-10">
							No dishes found in this category.
						</p>
					)}

					<AddDishCard onClick={openAddDishForm} />
				</div>
			</div>

			{/* MODALS - Nằm ngoài BasePageLayout */}
			<AddDishModal
				isOpen={isAddDishModalOpen}
				onClose={() => setIsAddDishModalOpen(false)}
				onSave={handleSaveDish}
				categorySlug={categorySlug}
				categoryName={categoryName}
			/>

			<ConfirmationModal
				isOpen={!!dishToDelete}
				title="Confirm Dish Deletion"
				message={
					dishToDelete
						? `Are you sure you want to permanently delete the dish: "${dishToDelete.name}"? This action cannot be undone.`
						: ''
				}
				onConfirm={executeDeleteDish}
				onClose={() => setDishToDelete(null)}
			/>
		</>
	)
}

export default CategoryDishes
