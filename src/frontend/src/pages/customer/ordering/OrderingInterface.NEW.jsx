import React, { useState, useMemo, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { getPublicMenuAPI } from '../../../services/api/publicMenuAPI'
import { motion, AnimatePresence } from 'framer-motion'

// --- CSS ANIMATIONS (Injected to head) ---
if (typeof document !== 'undefined') {
	const styleId = 'order-timeline-animations'
	if (!document.getElementById(styleId)) {
		const style = document.createElement('style')
		style.id = styleId
		style.textContent = `
			@keyframes pulse-glow {
				0%, 100% {
					transform: scale(1);
					box-shadow: 0 0 0 0 currentColor;
					opacity: 1;
				}
				50% {
					transform: scale(1.05);
					box-shadow: 0 0 20px 8px currentColor;
					opacity: 0.9;
				}
			}
			
			@keyframes fill-line {
				from {
					width: 0%;
				}
				to {
					width: 100%;
				}
			}
			
			@keyframes fade-in-up {
				from {
					opacity: 0;
					transform: translateY(10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			@keyframes checkmark-draw {
				0% {
					stroke-dashoffset: 50;
				}
				100% {
					stroke-dashoffset: 0;
				}
			}
			
			@keyframes shimmer {
				0% {
					transform: translateX(-100%);
				}
				100% {
					transform: translateX(100%);
				}
			}
		`
		document.head.appendChild(style)
	}
}

// --- CONSTANTS & DATA MOCK (Fallback) ---

// Mock Orders Data
const mockOrders = [
	{
		id: 'ORD-001',
		createdAt: '2025-12-29T10:30:00Z',
		status: 'PREPARING',
		currentStep: 'Preparing',
		totalAmount: 45.5,
		items: [
			{
				name: 'Spicy Miso Ramen',
				price: 15.5,
				quantity: 2,
				modifiers: ['Large', 'Extra Egg'],
			},
			{ name: 'Classic Pad Thai', price: 14.0, quantity: 1, modifiers: [] },
		],
		rejectionReason: null,
	},
	{
		id: 'ORD-002',
		createdAt: '2025-12-29T09:15:00Z',
		status: 'READY',
		currentStep: 'Ready',
		totalAmount: 27.5,
		items: [{ name: 'Beef Pho', price: 13.5, quantity: 2, modifiers: ['Rare Beef'] }],
		rejectionReason: null,
	},
	{
		id: 'ORD-003',
		createdAt: '2025-12-29T08:45:00Z',
		status: 'REJECTED',
		currentStep: null,
		totalAmount: 24.0,
		items: [{ name: 'Dan Dan Noodles', price: 12.0, quantity: 2, modifiers: [] }],
		rejectionReason: 'Out of ingredients - Sichuan peppercorns',
	},
	{
		id: 'ORD-004',
		createdAt: '2025-12-28T19:30:00Z',
		status: 'RECEIVED',
		currentStep: 'Received',
		totalAmount: 33.0,
		items: [
			{ name: 'Veggie Burger', price: 11.5, quantity: 1, modifiers: ['Cheese'] },
			{ name: 'Greek Salad', price: 9.0, quantity: 1, modifiers: [] },
			{ name: 'Tomato Soup', price: 8.0, quantity: 1, modifiers: [] },
		],
		rejectionReason: null,
	},
]
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
// 🚨 COMPONENT: RadialNavigationMenu - Floating Action Button with Radial Menu
// =========================================================
const RadialNavigationMenu = ({
	view,
	setView,
	setSelectedCategory,
	handleOpenCart,
	ordersCount,
	cartCount,
	setIsSettingsOpen,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [rotation, setRotation] = useState(0)
	const [currentPage, setCurrentPage] = useState(0)
	const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
	const rotationRef = useRef(0)
	const [isMobile, setIsMobile] = useState(false)
	const [fabPosition, setFabPosition] = useState({ side: 'right', bottom: 24 }) // 'right' or 'left'
	const [isDragging, setIsDragging] = useState(false)
	const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
	const [isSnapping, setIsSnapping] = useState(false)
	const [snapTarget, setSnapTarget] = useState({ x: 0, y: 0 })

	// Detect screen size
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 640) // sm breakpoint
		}
		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	// Handle drag end - snap to nearest edge
	const handleDragEnd = (event, info) => {
		const windowWidth = window.innerWidth
		const windowHeight = window.innerHeight
		const buttonSize = isMobile ? 56 : 64
		const padding = 20 // 20px padding from edges

		// Get button position (info.point gives screen coordinates)
		const buttonCenterX = info.point.x
		const buttonCenterY = info.point.y

		// Determine which side is closer
		const isLeftCloser = buttonCenterX < windowWidth / 2

		// Calculate bottom position (distance from bottom of screen)
		// Ensure button stays within viewport bounds with 20px padding
		const maxBottom = windowHeight - buttonSize - padding // Leave space from top
		const minBottom = padding
		const currentBottom = windowHeight - buttonCenterY - buttonSize / 2
		const clampedBottom = Math.max(minBottom, Math.min(maxBottom, currentBottom))

		// Calculate snap target position
		const targetX = isLeftCloser
			? padding + buttonSize / 2
			: windowWidth - padding - buttonSize / 2
		const targetY = windowHeight - clampedBottom - buttonSize / 2

		// Update fab position for when it becomes visible
		setFabPosition({
			side: isLeftCloser ? 'left' : 'right',
			bottom: clampedBottom,
		})

		// Start snapping animation
		setIsSnapping(true)
		setSnapTarget({ x: targetX, y: targetY })

		// After snap animation completes (clone stops), show original button
		setTimeout(() => {
			setIsDragging(false) // Show original button
		}, 400) // Match spring animation duration

		// After original button appears, hide clone and overlay
		setTimeout(() => {
			setIsSnapping(false) // Hide clone
		}, 600) // Additional 200ms delay for smooth transition
	}

	// Handle drag start
	const handleDragStart = (event, info) => {
		setIsDragging(true)
		setDragPosition({ x: info.point.x, y: info.point.y })
	}

	// Handle dragging
	const handleDrag = (event, info) => {
		setDragPosition({ x: info.point.x, y: info.point.y })
	}

	// Menu items configuration
	const menuItems = [
		{
			id: 'menu',
			icon: 'restaurant_menu',
			label: 'Menu',
			action: () => {
				setView('CATEGORIES')
				setSelectedCategory(null)
				setIsOpen(false)
			},
			badge: null,
			color: 'from-blue-500 to-blue-600',
		},
		{
			id: 'orders',
			icon: 'receipt_long',
			label: 'Orders',
			action: () => {
				setView('ORDERS')
				setIsOpen(false)
			},
			badge: ordersCount,
			color: 'from-purple-500 to-purple-600',
		},
		{
			id: 'cart',
			icon: 'shopping_cart',
			label: 'Cart',
			action: () => {
				handleOpenCart()
				setIsOpen(false)
			},
			badge: cartCount,
			color: 'from-green-500 to-green-600',
		},
		{
			id: 'profile',
			icon: 'person',
			label: 'Profile',
			action: () => {
				console.log('Profile clicked')
				setIsOpen(false)
			},
			badge: null,
			color: 'from-yellow-500 to-yellow-600',
		},
		{
			id: 'settings',
			icon: 'settings',
			label: 'Settings',
			action: () => {
				setIsSettingsOpen(true)
				setIsOpen(false)
			},
			badge: null,
			color: 'from-gray-500 to-gray-600',
		},
		{
			id: 'help',
			icon: 'help',
			label: 'Help',
			action: () => {
				console.log('Help clicked')
				setIsOpen(false)
			},
			badge: null,
			color: 'from-indigo-500 to-indigo-600',
		},
	]

	const itemsPerPage = 6
	const totalPages = Math.ceil(menuItems.length / itemsPerPage)
	const visibleItems = menuItems.slice(
		currentPage * itemsPerPage,
		(currentPage + 1) * itemsPerPage,
	)

	// Dynamic radius based on screen size
	const radius = isMobile ? 100 : 140

	// Calculate position for each item in a circle
	const getItemPosition = (index, total) => {
		const angle = (360 / total) * index - 90 + rotation // Start from top
		const radian = (angle * Math.PI) / 180
		return {
			x: Math.cos(radian) * radius,
			y: Math.sin(radian) * radius,
			angle,
		}
	}

	// Handle touch/swipe gestures
	const handleTouchStart = (e) => {
		const touch = e.touches[0]
		touchStartRef.current = {
			x: touch.clientX,
			y: touch.clientY,
			time: Date.now(),
		}
		rotationRef.current = rotation
	}

	const handleTouchMove = (e) => {
		if (!isOpen) return
		const touch = e.touches[0]
		const deltaX = touch.clientX - touchStartRef.current.x
		const deltaY = touch.clientY - touchStartRef.current.y

		// Calculate rotation based on swipe direction
		const swipeAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
		const rotationDelta = swipeAngle * 0.5

		setRotation(rotationRef.current + rotationDelta)
	}

	const handleTouchEnd = (e) => {
		const touch = e.changedTouches[0]
		const deltaX = touch.clientX - touchStartRef.current.x
		const deltaTime = Date.now() - touchStartRef.current.time

		// Check for swipe velocity for page change
		if (Math.abs(deltaX) > 50 && deltaTime < 300) {
			if (deltaX > 0 && currentPage > 0) {
				setCurrentPage(currentPage - 1)
			} else if (deltaX < 0 && currentPage < totalPages - 1) {
				setCurrentPage(currentPage + 1)
			}
		}

		// Snap to nearest position with inertia
		const snapAngle = 60
		const snappedRotation = Math.round(rotation / snapAngle) * snapAngle
		setRotation(snappedRotation)
	}

	// Find which item is at the top (highlight position)
	const getHighlightedIndex = () => {
		const normalizedRotation = ((rotation % 360) + 360) % 360
		const anglePerItem = 360 / visibleItems.length
		const highlightedIndex =
			Math.round(normalizedRotation / anglePerItem) % visibleItems.length
		return highlightedIndex
	}

	return (
		<>
			{/* Drag Overlay - Transparent layer with clone button for free dragging */}
			<AnimatePresence>
				{(isDragging || isSnapping) && (
					<>
						{/* Overlay layer to block interactions with other elements */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							className="fixed inset-0 z-[99]"
							style={{
								pointerEvents: 'auto',
								backgroundColor: 'rgba(0, 0, 0, 0.1)',
								cursor: 'grabbing',
							}}
						/>

						{/* Clone button on top of overlay for dragging */}
						<motion.div
							className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center"
							style={{
								position: 'fixed',
								width: isMobile ? '56px' : '64px',
								height: isMobile ? '56px' : '64px',
								zIndex: 101,
								cursor: 'grabbing',
								pointerEvents: 'none',
							}}
							initial={{
								scale: 1.15,
								left: dragPosition.x - (isMobile ? 28 : 32),
								top: dragPosition.y - (isMobile ? 28 : 32),
							}}
							animate={{
								scale: 1.15,
								left: isSnapping
									? snapTarget.x - (isMobile ? 28 : 32)
									: dragPosition.x - (isMobile ? 28 : 32),
								top: isSnapping
									? snapTarget.y - (isMobile ? 28 : 32)
									: dragPosition.y - (isMobile ? 28 : 32),
							}}
							transition={{
								type: isSnapping ? 'spring' : 'tween',
								stiffness: 300,
								damping: 20,
								mass: 0.8,
								duration: isSnapping ? undefined : 0,
							}}
						>
							<span
								className="material-symbols-outlined text-white"
								style={{ fontSize: isMobile ? '28px' : '32px' }}
							>
								menu
							</span>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Floating Action Button - Original (hidden while dragging) */}
			<motion.button
				onClick={() => !isDragging && setIsOpen(!isOpen)}
				drag={!isOpen}
				dragConstraints={{
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				}}
				dragElastic={0}
				dragMomentum={false}
				onDragStart={handleDragStart}
				onDrag={handleDrag}
				onDragEnd={handleDragEnd}
				className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center cursor-move active:cursor-grabbing"
				style={{
					position: 'fixed',
					width: isMobile ? '56px' : '64px',
					height: isMobile ? '56px' : '64px',
					zIndex: 100,
					touchAction: 'none',
					opacity: isDragging ? 0 : 1,
					pointerEvents: isDragging ? 'none' : 'auto',
				}}
				animate={{
					scale: isDragging ? 1 : 1,
					top: isOpen ? '50%' : 'auto',
					left: isOpen ? '50%' : fabPosition.side === 'left' ? '20px' : 'auto',
					bottom: isOpen ? 'auto' : `${fabPosition.bottom}px`,
					right: isOpen ? 'auto' : fabPosition.side === 'right' ? '20px' : 'auto',
					x: isOpen ? '-50%' : 0,
					y: isOpen ? '-50%' : 0,
				}}
				whileHover={{ scale: isOpen ? 1 : 1.1 }}
				whileTap={{ scale: isOpen ? 0.9 : 1.05 }}
				transition={{
					type: isSnapping ? 'tween' : 'spring',
					duration: isSnapping ? 0 : undefined,
					stiffness: 300,
					damping: 20,
					mass: 0.8,
				}}
			>
				<motion.span
					className="material-symbols-outlined text-white"
					style={{ fontSize: isMobile ? '28px' : '32px' }}
					animate={{ rotate: isOpen ? 45 : 0 }}
					transition={{ duration: 0.3 }}
				>
					{isOpen ? 'close' : 'menu'}
				</motion.span>
			</motion.button>

			{/* Radial Menu Overlay */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Background Overlay */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
							onClick={() => setIsOpen(false)}
						/>

						{/* Radial Menu Container - Uses screen center as coordinate origin */}
						<motion.div
							className="fixed pointer-events-none"
							style={{
								top: '50%',
								left: '50%',
								zIndex: 100,
							}}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
							onTouchStart={handleTouchStart}
							onTouchMove={handleTouchMove}
							onTouchEnd={handleTouchEnd}
						>
							{/* Menu Items - Positioned relative to center origin */}
							{visibleItems.map((item, index) => {
								const position = getItemPosition(index, visibleItems.length)
								const isHighlighted = index === getHighlightedIndex()
								const buttonSize = isMobile ? 48 : 56

								return (
									<motion.div
										key={item.id}
										initial={{ scale: 0 }}
										animate={{
											scale: isHighlighted ? 1.2 : 1,
										}}
										exit={{ scale: 0 }}
										transition={{
											type: 'spring',
											stiffness: 300,
											damping: 20,
											delay: index * 0.05,
										}}
										className="absolute pointer-events-auto"
										style={{
											left: `${position.x - 29}px`,
											top: `${position.y - 28}px`,
											transform: 'translate(-50%, -50%)',
										}}
									>
										<motion.button
											onClick={item.action}
											className={`relative rounded-full bg-gradient-to-br ${
												item.color
											} shadow-lg flex items-center justify-center ${
												isHighlighted ? 'ring-4 ring-white/50' : ''
											}`}
											style={{
												width: isMobile ? '48px' : '56px',
												height: isMobile ? '48px' : '56px',
											}}
											whileHover={{ scale: 1.15 }}
											whileTap={{ scale: 0.9 }}
										>
											<span
												className="material-symbols-outlined text-white"
												style={{ fontSize: isMobile ? '20px' : '24px' }}
											>
												{item.icon}
											</span>
											{item.badge !== null && item.badge > 0 && (
												<span
													className="absolute bg-red-500 rounded-full text-white font-bold flex items-center justify-center"
													style={{
														top: '-4px',
														right: '-4px',
														width: isMobile ? '18px' : '20px',
														height: isMobile ? '18px' : '20px',
														fontSize: isMobile ? '9px' : '10px',
													}}
												>
													{item.badge > 9 ? '9+' : item.badge}
												</span>
											)}
										</motion.button>

										{/* Label */}
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: isHighlighted ? 1 : 0.7 }}
											className="absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none"
											style={{
												top: isMobile ? '52px' : '60px',
											}}
										>
											<span
												className={`px-2 py-1 rounded-full font-bold bg-black/80 text-white shadow-lg ${
													isHighlighted ? (isMobile ? 'text-xs' : 'text-sm') : 'text-xs'
												}`}
											>
												{item.label}
											</span>
										</motion.div>
									</motion.div>
								)
							})}
						</motion.div>

						{/* Page Indicator - Positioned at bottom center */}
						{totalPages > 1 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 20 }}
								className="fixed left-1/2 transform -translate-x-1/2 z-[100] px-3 py-1.5 bg-black/80 rounded-full text-white font-bold shadow-lg"
								style={{
									bottom: isMobile ? '2rem' : '2.5rem',
									fontSize: isMobile ? '10px' : '12px',
								}}
							>
								{currentPage + 1} / {totalPages}
							</motion.div>
						)}
					</>
				)}
			</AnimatePresence>
		</>
	)
}

// =========================================================
// 🚨 COMPONENT: OrderStatusTimeline - Animated horizontal timeline
// =========================================================
const OrderStatusTimeline = ({ currentStep }) => {
	const steps = [
		{
			key: 'Received',
			label: 'Received',
			description: 'Order confirmed',
			icon: 'receipt_long',
			color: '#3B82F6', // blue-500
		},
		{
			key: 'Preparing',
			label: 'Preparing',
			description: 'Chef is cooking',
			icon: 'restaurant',
			color: '#F59E0B', // amber-500
		},
		{
			key: 'Ready',
			label: 'Ready',
			description: 'Ready to serve',
			icon: 'check_circle',
			color: '#10B981', // green-500
		},
	]

	const currentStepIndex = steps.findIndex((step) => step.key === currentStep)

	const getStepStatus = (index) => {
		if (index < currentStepIndex) return 'completed'
		if (index === currentStepIndex) return 'active'
		return 'pending'
	}

	return (
		<div className="w-full py-4" role="progressbar" aria-label="Order Status Timeline">
			{/* Desktop/Tablet - Horizontal */}
			<div className="hidden sm:block">
				<div className="relative flex items-center justify-between px-8">
					{/* Background Line - From center to center of circles */}
					<div
						className="absolute top-[27px] h-1 bg-[#2D3748]"
						style={{
							left: '60px',
							right: '60px',
						}}
					/>
					{/* Progress Line with Animation */}
					{currentStepIndex > 0 && (
						<div
							className="absolute top-[27px] h-1 transition-all duration-700 ease-out overflow-hidden"
							style={{
								left: '60px',
								width: `calc((100% - 120px) * ${currentStepIndex / (steps.length - 1)})`,
								background: `linear-gradient(to right, ${steps[0].color}, ${
									steps[Math.min(currentStepIndex, steps.length - 1)].color
								})`,
							}}
						>
							{/* Shimmer Effect */}
							<div
								className="absolute inset-0 w-full h-full"
								style={{
									background:
										'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
									animation: 'shimmer 2s infinite',
								}}
							/>
						</div>
					)}
					{/* Steps */}
					{steps.map((step, index) => {
						const status = getStepStatus(index)
						const isActive = status === 'active'
						const isCompleted = status === 'completed'

						return (
							<div
								key={step.key}
								className="relative flex flex-col items-center z-10"
								style={{
									animation: isActive ? 'fade-in-up 0.5s ease-out' : 'none',
								}}
							>
								{/* Circle Node */}
								<div
									className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 bg-[#1A202C] ${
										isActive ? 'ring-4 ring-opacity-30' : isCompleted ? '' : ''
									}`}
									style={{
										backgroundColor: isActive || isCompleted ? step.color : undefined,
										color: isActive || isCompleted ? '#FFFFFF' : '#9CA3AF',
										ringColor: isActive ? step.color : 'transparent',
										animation: isActive ? 'pulse-glow 2s ease-in-out infinite' : 'none',
									}}
									aria-label={`${step.label} - ${status}`}
								>
									{isCompleted ? (
										// Checkmark for completed steps
										<svg
											className="w-7 h-7"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="3"
										>
											<path
												d="M5 13l4 4L19 7"
												strokeLinecap="round"
												strokeLinejoin="round"
												style={{
													strokeDasharray: 50,
													strokeDashoffset: 0,
													animation: 'checkmark-draw 0.5s ease-out forwards',
												}}
											/>
										</svg>
									) : (
										// Icon for active/pending steps
										<span className="material-symbols-outlined text-3xl">
											{step.icon}
										</span>
									)}
								</div>

								{/* Label */}
								<div className="mt-3 text-center">
									<p
										className={`text-sm font-bold transition-colors duration-300 ${
											isActive || isCompleted ? 'text-white' : 'text-[#9dabb9]'
										}`}
										style={{
											color: isActive || isCompleted ? step.color : undefined,
										}}
									>
										{step.label}
									</p>
									<p
										className={`text-xs mt-0.5 transition-colors duration-300 ${
											isActive ? 'text-[#9dabb9]' : 'text-[#4A5568]'
										}`}
									>
										{step.description}
									</p>
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* Mobile - Vertical/Compact Horizontal */}
			<div className="block sm:hidden">
				<div className="flex items-center justify-between px-4">
					{steps.map((step, index) => {
						const status = getStepStatus(index)
						const isActive = status === 'active'
						const isCompleted = status === 'completed'

						return (
							<React.Fragment key={step.key}>
								<div className="flex flex-col items-center flex-1">
									{/* Circle Node - Smaller on mobile */}
									<div
										className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
											isActive
												? 'bg-opacity-20 ring-2 ring-opacity-30'
												: isCompleted
												? 'bg-opacity-100'
												: 'bg-[#2D3748]'
										}`}
										style={{
											backgroundColor: isActive || isCompleted ? step.color : undefined,
											color: isActive || isCompleted ? '#FFFFFF' : '#9CA3AF',
											ringColor: isActive ? step.color : 'transparent',
											animation: isActive ? 'pulse-glow 2s ease-in-out infinite' : 'none',
										}}
									>
										{isCompleted ? (
											<svg
												className="w-5 h-5"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="3"
											>
												<path
													d="M5 13l4 4L19 7"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										) : (
											<span className="material-symbols-outlined text-xl">
												{step.icon}
											</span>
										)}
									</div>

									{/* Label - Compact on mobile */}
									<p
										className={`text-[10px] font-bold mt-1.5 text-center transition-colors duration-300 ${
											isActive || isCompleted ? 'text-white' : 'text-[#9dabb9]'
										}`}
										style={{
											color: isActive || isCompleted ? step.color : undefined,
										}}
									>
										{step.label}
									</p>
								</div>

								{/* Connector Line - Not shown after last step */}
								{index < steps.length - 1 && (
									<div className="flex-1 h-0.5 bg-[#2D3748] mx-1 relative">
										{index < currentStepIndex && (
											<div
												className="absolute left-0 top-0 h-full transition-all duration-500"
												style={{
													width: '100%',
													backgroundColor: step.color,
												}}
											/>
										)}
									</div>
								)}
							</React.Fragment>
						)
					})}
				</div>
			</div>
		</div>
	)
}

// =========================================================
// 🚨 MODAL: Dish Customization Modal (Modifiers)
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
	// 🕒 Backend returns prepTimeMinutes
	const prepTime = dish.prepTimeMinutes || dish.preparationTime

	return (
		<div className="group relative overflow-hidden rounded-xl backdrop-blur-xl bg-[#1A202C]/80 shadow-lg transition-all duration-300 hover:shadow-2xl border border-white/20 flex items-center gap-4 p-4">
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
					{prepTime && (
						<span className="flex items-center gap-1">
							<span className="material-symbols-outlined text-sm">schedule</span>
							{prepTime} min
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
// 🚨 COMPONENT: OrderCard - Display order history
// =========================================================
const OrderCard = ({ order }) => {
	const [isExpanded, setIsExpanded] = useState(false)

	const getStatusColor = (status) => {
		switch (status) {
			case 'REJECTED':
				return 'bg-red-500/10 border-red-500/30 text-red-400'
			case 'RECEIVED':
				return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
			case 'PREPARING':
				return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
			case 'READY':
				return 'bg-green-500/10 border-green-500/30 text-green-400'
			default:
				return 'bg-gray-500/10 border-gray-500/30 text-gray-400'
		}
	}

	const formatDate = (dateString) => {
		const date = new Date(dateString)
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	return (
		<div
			className={`rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-xl border-2 ${
				order.status === 'REJECTED'
					? 'bg-red-500/10 border-red-500/30'
					: 'bg-[#1A202C]/80 border-white/20'
			}`}
		>
			{/* Header - Always visible */}
			<div
				onClick={() => setIsExpanded(!isExpanded)}
				className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
			>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex-1">
						<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
							<h3 className="text-white font-bold text-lg">{order.id}</h3>
							<span
								className={`px-3 py-1 rounded-full text-xs font-bold border self-start ${getStatusColor(
									order.status,
								)}`}
							>
								{order.status}
							</span>
						</div>
						<p className="text-[#9dabb9] text-sm">{formatDate(order.createdAt)}</p>
					</div>
					<div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
						<p className="text-2xl font-bold text-[#4ade80]">
							${order.totalAmount.toFixed(2)}
						</p>
						<span className="material-symbols-outlined text-[#9dabb9]">
							{isExpanded ? 'expand_less' : 'expand_more'}
						</span>
					</div>
				</div>

				{/* OrderStatusTimeline - Always visible for non-rejected orders */}
				{order.status !== 'REJECTED' && order.currentStep && (
					<div className="mt-4">
						<OrderStatusTimeline currentStep={order.currentStep} />
					</div>
				)}
			</div>

			{/* Expanded Content */}
			{isExpanded && (
				<div className="px-4 pb-4 border-t border-white/10">
					{/* Rejection reason */}
					{order.status === 'REJECTED' && order.rejectionReason && (
						<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 mt-4">
							<div className="flex items-start gap-2">
								<span className="material-symbols-outlined text-red-400 text-sm mt-0.5">
									error
								</span>
								<div>
									<p className="text-red-400 font-bold text-sm">Order Rejected</p>
									<p className="text-red-300 text-sm mt-1">{order.rejectionReason}</p>
								</div>
							</div>
						</div>
					)}

					{/* Order Items */}
					<div className="mt-4 space-y-2">
						<h4 className="text-white font-bold text-sm mb-2">Order Items:</h4>
						{order.items.map((item, index) => (
							<div
								key={index}
								className="flex justify-between items-start bg-[#2D3748] p-3 rounded-lg"
							>
								<div className="flex-1">
									<p className="text-white font-semibold text-sm">{item.name}</p>
									{item.modifiers && item.modifiers.length > 0 && (
										<p className="text-[#9dabb9] text-xs mt-1">
											{item.modifiers.join(', ')}
										</p>
									)}
									<p className="text-[#9dabb9] text-xs mt-1">
										${item.price.toFixed(2)} × {item.quantity}
									</p>
								</div>
								<p className="text-[#4ade80] font-bold">
									${(item.price * item.quantity).toFixed(2)}
								</p>
							</div>
						))}
					</div>

					{/* Total */}
					<div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
						<span className="text-white font-bold">Total:</span>
						<span className="text-2xl font-bold text-[#4ade80]">
							${order.totalAmount.toFixed(2)}
						</span>
					</div>
				</div>
			)}
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
			<div className="relative w-full max-w-lg transform overflow-hidden rounded-xl backdrop-blur-xl bg-[#1A202C]/90 p-8 shadow-2xl transition-all border border-white/20">
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
	const [view, setView] = useState('CATEGORIES') // CATEGORIES | DISHES | ORDERS
	const [layoutView, setLayoutView] = useState('grid') // grid | list
	const [orders, setOrders] = useState(mockOrders) // Orders history

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

	// --- Background & Settings States ---
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [currentBackground, setCurrentBackground] = useState(0)

	// Available background images
	const backgroundImages = [
		'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80', // Restaurant interior
		'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80', // Restaurant table
		'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1920&q=80', // Dining room
		'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1920&q=80', // Restaurant bar
		'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=1920&q=80', // Food table
	]

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
			<div className="w-full min-h-screen font-['Work_Sans',_sans-serif] relative overflow-hidden">
				{/* Background */}
				<div className="fixed inset-0 z-0">
					<img
						src={backgroundImages[0]}
						alt="Background"
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-black/60" />
				</div>
				<div className="relative z-10 flex items-center justify-center min-h-screen">
					<div className="text-center backdrop-blur-xl bg-[#1A202C]/80 p-8 rounded-xl border border-white/20">
						<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#137fec] mx-auto mb-4"></div>
						<p className="text-white text-lg">Loading menu...</p>
					</div>
				</div>
			</div>
		)
	}

	// Error state
	if (error && !categories.length) {
		return (
			<div className="w-full min-h-screen font-['Work_Sans',_sans-serif] relative overflow-hidden">
				{/* Background */}
				<div className="fixed inset-0 z-0">
					<img
						src={backgroundImages[0]}
						alt="Background"
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-black/60" />
				</div>
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
			</div>
		)
	}

	return (
		<div className="w-full min-h-screen font-['Work_Sans',_sans-serif] pb-20 sm:pb-0 relative overflow-hidden">
			{/* Background Layer with Image */}
			<div className="fixed inset-0 z-0">
				<img
					src={backgroundImages[currentBackground]}
					alt="Restaurant Background"
					className="w-full h-full object-cover"
				/>
				{/* Dark Overlay */}
				<div className="absolute inset-0 bg-black/60" />
			</div>

			{/* Content Layer - All UI components */}
			<div className="relative z-10">
				{/* Radial Navigation Menu - Floating Action Button */}
				<RadialNavigationMenu
					view={view}
					setView={setView}
					setSelectedCategory={setSelectedCategory}
					handleOpenCart={handleOpenCart}
					ordersCount={orders.length}
					cartCount={totalItemsInCart}
					setIsSettingsOpen={setIsSettingsOpen}
				/>

				{/* CONTENT VIEWS */}
				{view === 'ORDERS' ? (
					// ORDERS VIEW
					<div className="p-4 max-w-4xl mx-auto">
						<div className="mb-6">
							<h2 className="text-2xl font-bold text-white mb-2">Your Orders</h2>
							<p className="text-[#9dabb9] text-sm">
								Track your order status and view history
							</p>
						</div>

						{orders.length === 0 ? (
							<div className="text-center py-20">
								<span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4 block">
									receipt_long
								</span>
								<p className="text-[#9dabb9] text-lg">No orders yet</p>
								<button
									onClick={() => setView('CATEGORIES')}
									className="mt-6 px-6 py-3 bg-[#137fec] text-white rounded-lg hover:bg-blue-600 transition-colors"
								>
									Browse Menu
								</button>
							</div>
						) : (
							<div className="space-y-4">
								{orders.map((order) => (
									<OrderCard key={order.id} order={order} />
								))}
							</div>
						)}
					</div>
				) : view === 'CATEGORIES' ? (
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
										<p className="text-[#9dabb9] text-sm mt-2">
											Try adjusting your search
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				) : (
					// DISHES VIEW
					<div className="p-4">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
							<div className="flex items-center gap-3">
								<button
									onClick={handleBack}
									className="p-2 rounded-full bg-[#2D3748] text-white hover:bg-[#4A5568] flex justify-center flex-shrink-0"
								>
									<span className="material-symbols-outlined">arrow_back</span>
								</button>
								<h2 className="text-xl sm:text-2xl font-bold text-white truncate">
									{selectedCategory?.name || 'Menu Items'}
								</h2>
							</div>

							{/* Layout Toggle Buttons */}
							<div className="flex items-center gap-2 bg-[#2D3748] rounded-lg p-1 self-end sm:self-auto">
								<button
									onClick={() => setLayoutView('grid')}
									className={`p-2 rounded-md transition-colors ${
										layoutView === 'grid'
											? 'bg-[#137fec] text-white'
											: 'text-[#9dabb9] hover:text-white'
									}`}
									title="Grid View"
								>
									<span className="material-symbols-outlined text-base">grid_view</span>
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
									<span className="material-symbols-outlined text-base">view_list</span>
								</button>
							</div>
						</div>

						{/* Search, Filter, Sort Controls */}
						<div className="mb-6 space-y-3">
							{/* Search Bar */}
							<div className="relative">
								<input
									type="text"
									value={dishSearch}
									onChange={(e) => setDishSearch(e.target.value)}
									placeholder="Search dishes..."
									className="w-full px-4 py-2.5 pl-11 rounded-lg bg-[#2D3748] text-white text-sm border border-white/10 focus:border-[#137fec] focus:outline-none placeholder-[#9dabb9]"
								/>
								<span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9dabb9] text-base">
									search
								</span>
								{dishSearch && (
									<button
										onClick={() => setDishSearch('')}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#9dabb9] hover:text-white"
									>
										<span className="material-symbols-outlined text-base">close</span>
									</button>
								)}
							</div>

							{/* Filter and Sort Controls */}
							<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
								{/* Availability Filter */}
								<div className="flex items-center gap-2 flex-1">
									<span className="text-[#9dabb9] text-xs sm:text-sm font-medium whitespace-nowrap">
										Status:
									</span>
									<select
										value={availableFilter}
										onChange={(e) => setAvailableFilter(e.target.value)}
										disabled={loadingDishes}
										className="flex-1 px-3 py-2 text-sm rounded-lg bg-[#2D3748] text-white border border-white/10 focus:border-[#137fec] focus:outline-none cursor-pointer disabled:opacity-50"
									>
										<option value="all">All Items</option>
										<option value="available">Available Only</option>
									</select>
								</div>

								{/* Sort Dropdown */}
								<div className="flex items-center gap-2 flex-1">
									<span className="text-[#9dabb9] text-xs sm:text-sm font-medium whitespace-nowrap">
										Sort:
									</span>
									<select
										value={sortBy}
										onChange={(e) => setSortBy(e.target.value)}
										disabled={loadingDishes}
										className="flex-1 px-3 py-2 text-sm rounded-lg bg-[#2D3748] text-white border border-white/10 focus:border-[#137fec] focus:outline-none cursor-pointer disabled:opacity-50"
									>
										<option value="none">Default</option>
										<option value="name">Name (A-Z)</option>
										<option value="price-asc">Price ↑</option>
										<option value="price-desc">Price ↓</option>
									</select>
								</div>

								{/* Results Count */}
								<div className="flex items-center justify-center gap-2 px-3 py-2 bg-[#2D3748] rounded-lg text-[#9dabb9] text-xs sm:text-sm">
									<span className="material-symbols-outlined text-base">restaurant</span>
									<span>
										{loadingDishes ? (
											'Loading...'
										) : (
											<>
												{dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'}
												{totalItems > dishes.length && ` / ${totalItems}`}
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
											<span className="material-symbols-outlined text-sm">
												first_page
											</span>
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

				{/* SETTINGS MODAL */}
				{isSettingsOpen && (
					<div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
						<div className="relative backdrop-blur-xl bg-[#1A202C]/90 rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-white/20">
							{/* Header */}
							<div className="flex items-center justify-between p-6 border-b border-white/10">
								<div>
									<h2 className="text-2xl font-bold text-white m-0">Settings</h2>
									<p className="text-[#9dabb9] text-sm mt-1">Customize your experience</p>
								</div>
								<button
									onClick={() => setIsSettingsOpen(false)}
									className="p-2 rounded-lg text-[#9dabb9] hover:text-white hover:bg-white/10 transition-colors"
								>
									<span className="material-symbols-outlined">close</span>
								</button>
							</div>

							{/* Content */}
							<div className="p-6">
								<h3 className="text-lg font-bold text-white mb-4">Background Image</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
									{backgroundImages.map((image, index) => (
										<button
											key={index}
											onClick={() => {
												setCurrentBackground(index)
												setIsSettingsOpen(false)
											}}
											className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
												currentBackground === index
													? 'border-[#137fec] shadow-lg shadow-blue-500/30'
													: 'border-white/20 hover:border-white/40'
											}`}
										>
											<img
												src={image}
												alt={`Background ${index + 1}`}
												className="w-full h-full object-cover"
											/>
											{currentBackground === index && (
												<div className="absolute inset-0 bg-[#137fec]/20 flex items-center justify-center">
													<div className="bg-[#137fec] rounded-full p-2">
														<span className="material-symbols-outlined text-white text-2xl">
															check
														</span>
													</div>
												</div>
											)}
											<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
												<p className="text-white text-xs font-semibold text-center">
													Style {index + 1}
												</p>
											</div>
										</button>
									))}
								</div>
							</div>

							{/* Footer */}
							<div className="p-6 border-t border-white/10 flex justify-end gap-3">
								<button
									onClick={() => setIsSettingsOpen(false)}
									className="px-6 py-2 rounded-lg font-semibold text-sm bg-white/10 text-white hover:bg-white/20 transition-colors"
								>
									Close
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default OrderManagementInterface
