import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CustomerAuth from '../pages/CustomerAuth'
import HelpRequestModal from './HelpRequestModal'

const RadialNavigationMenu = ({
	view,
	setView,
	setSelectedCategory,
	handleOpenCart,
	ordersCount,
	cartCount,
	setIsSettingsOpen,
	tenantId, // Add tenantId prop
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [rotation, setRotation] = useState(0)
	const [currentPage, setCurrentPage] = useState(0)
	const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
	const rotationRef = useRef(0)
	const [isMobile, setIsMobile] = useState(false)
	const [fabPosition, setFabPosition] = useState({ side: 'right', bottom: 24 })
	const [isDragging, setIsDragging] = useState(false)
	const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
	const [isSnapping, setIsSnapping] = useState(false)
	const [snapTarget, setSnapTarget] = useState({ x: 0, y: 0 })
	const [showAuthModal, setShowAuthModal] = useState(false)
	const [showHelpModal, setShowHelpModal] = useState(false)
	const [customerAuth, setCustomerAuth] = useState(null)

	// Check customer authentication status
	const loadCustomerAuth = () => {
		const auth = localStorage.getItem('customerAuth')
		if (auth) {
			try {
				setCustomerAuth(JSON.parse(auth))
			} catch (error) {
				console.error('Failed to parse customer auth:', error)
				localStorage.removeItem('customerAuth')
				setCustomerAuth(null)
			}
		} else {
			setCustomerAuth(null)
		}
	}

	useEffect(() => {
		loadCustomerAuth()
	}, [])

	// Detect screen size
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 640)
		}
		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	// Handle drag end - snap to nearest edge
	const handleDragEnd = (event, info) => {
		// Use clientWidth/clientHeight to get viewport without scrollbar
		const windowWidth = document.documentElement.clientWidth
		const windowHeight = document.documentElement.clientHeight
		const buttonSize = isMobile ? 56 : 64
		const padding = 20
		const scrollY = window.scrollY || window.pageYOffset

		// Use point coordinates for accurate position (relative to viewport)
		const buttonCenterX = info.point.x
		const buttonCenterY = info.point.y - scrollY // Subtract scroll to get viewport-relative position

		// Determine which side is closer
		const isLeftCloser = buttonCenterX < windowWidth / 2

		// Calculate the snap position (relative to viewport)
		const snapX = isLeftCloser ? padding : windowWidth - buttonSize - padding
		const snapY = buttonCenterY - buttonSize / 2

		// Clamp Y position to stay within viewport
		const maxY = windowHeight - buttonSize - padding
		const minY = padding
		const clampedY = Math.max(minY, Math.min(maxY, snapY))

		// Calculate bottom for React state (distance from bottom of viewport)
		const bottomValue = windowHeight - clampedY - buttonSize

		// Update FAB position state
		setFabPosition({
			side: isLeftCloser ? 'left' : 'right',
			bottom: bottomValue,
		})

		// Set snap target with exact pixel coordinates
		setIsSnapping(true)
		setSnapTarget({
			side: isLeftCloser ? 'left' : 'right',
			left: snapX,
			top: clampedY, // Use top instead of bottom for consistency
		})

		// Hide dragging button and show snapping animation
		setTimeout(() => {
			setIsDragging(false) // Real button starts to fade in
		}, 450)

		// Remove snapping button after real button is visible
		setTimeout(() => {
			setIsSnapping(false) // Snapping button fades out
		}, 700)
	}

	const handleDragStart = (event, info) => {
		setIsDragging(true)
		const scrollY = window.scrollY || window.pageYOffset
		setDragPosition({ x: info.point.x, y: info.point.y - scrollY })
	}

	const handleDrag = (event, info) => {
		const scrollY = window.scrollY || window.pageYOffset
		setDragPosition({ x: info.point.x, y: info.point.y - scrollY })
	}

	// Menu items configuration
	const menuItems = [
		{
			id: 'menu',
			icon: 'restaurant_menu',
			label: 'Menu',
			action: () => {
				setView('MENU')
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
				setView('CART')
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
				// Check if customer is authenticated
				if (customerAuth) {
					setView('PROFILE')
					setIsOpen(false)
				} else {
					// Show auth modal if not logged in
					setShowAuthModal(true)
					setIsOpen(false)
				}
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
				setShowHelpModal(true)
				setIsOpen(false)
			},
			badge: null,
			color: 'from-indigo-500 to-indigo-600',
		},
	]

	// Handle successful authentication
	const handleAuthSuccess = (customerData) => {
		// Reload customer auth from localStorage
		loadCustomerAuth()
		// Navigate to profile page
		setView('PROFILE')
		// Close auth modal
		setShowAuthModal(false)
	}

	// Handle help request submission
	const handleHelpRequest = async (helpData) => {
		try {
			// TODO: Get table info from context or props
			const tableId = localStorage.getItem('tableId') || 'table_005'
			const tableName = localStorage.getItem('tableName') || 'Table 5'

			// TODO: Replace with actual API call
			console.log('Sending help request:', {
				tableId,
				tableName,
				...helpData,
			})

			// TODO: Implement API call
			// const response = await fetch(`/api/v1/customer/help/:tenantId`, {
			//   method: 'POST',
			//   headers: {
			//     'Authorization': `Bearer ${customerAuth?.token}`,
			//     'Content-Type': 'application/json',
			//   },
			//   body: JSON.stringify({
			//     tableId,
			//     tableName,
			//     message: helpData.message,
			//     urgency: helpData.urgency,
			//   }),
			// })

			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// TODO: Show success notification
			alert('Help request sent successfully! Staff will assist you shortly.')

			return true
		} catch (error) {
			console.error('Failed to send help request:', error)
			alert('Failed to send help request. Please try again.')
			throw error
		}
	}

	const itemsPerPage = 6
	const totalPages = Math.ceil(menuItems.length / itemsPerPage)
	const visibleItems = menuItems.slice(
		currentPage * itemsPerPage,
		(currentPage + 1) * itemsPerPage,
	)

	const radius = isMobile ? 100 : 140

	// Navigation menu position offset (để FAB button ở giữa 6 nút)
	const navigationOffsetX = isMobile ? 32 : 45 // Mobile: 32px | Desktop: 45px
	const navigationOffsetY = isMobile ? 32 : 45 // Mobile: 32px | Desktop: 45px

	const getItemPosition = (index, total) => {
		const angle = (Math.PI * 2 * index) / total - Math.PI / 2
		const x = Math.cos(angle) * radius
		const y = Math.sin(angle) * radius
		return { x, y }
	}

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
		const touch = e.touches[0]
		const deltaX = touch.clientX - touchStartRef.current.x
		const deltaY = touch.clientY - touchStartRef.current.y
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

		if (distance > 30) {
			const angle = Math.atan2(deltaY, deltaX)
			setRotation(rotationRef.current + (angle * 180) / Math.PI)
		}
	}

	const handleTouchEnd = (e) => {
		const timeDiff = Date.now() - touchStartRef.current.time
		const touch = e.changedTouches[0]
		const deltaX = touch.clientX - touchStartRef.current.x
		const deltaY = touch.clientY - touchStartRef.current.y
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

		if (timeDiff < 300 && distance < 10) {
			return
		}

		if (totalPages > 1 && distance > 50) {
			setCurrentPage((prev) => (prev + 1) % totalPages)
		}
	}

	const getHighlightedIndex = () => {
		const normalizedRotation = ((rotation % 360) + 360) % 360
		const itemAngle = 360 / visibleItems.length
		const highlightIndex =
			Math.round(normalizedRotation / itemAngle) % visibleItems.length
		return highlightIndex
	}

	return (
		<>
			<AnimatePresence>
				{(isDragging || isSnapping) && (
					<>
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
							animate={
								isSnapping
									? {
											scale: 1,
											left: snapTarget.left,
											top: snapTarget.top,
											opacity: 1,
									  }
									: {
											scale: 1.15,
											left: dragPosition.x - (isMobile ? 28 : 32),
											top: dragPosition.y - (isMobile ? 28 : 32),
									  }
							}
							transition={{
								type: 'spring',
								stiffness: 280,
								damping: 28,
								mass: 0.6,
								opacity: { duration: 0.2, ease: 'easeInOut' },
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
				}}
				initial={false}
				animate={{
					opacity: isDragging ? 0 : 1,
					scale: isDragging ? 0.8 : 1,
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
					opacity: { duration: isDragging ? 0.1 : 0.25, ease: 'easeInOut' },
					scale: { duration: isDragging ? 0.1 : 0.2 },
					type: 'spring',
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

			<AnimatePresence>
				{isOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
							onClick={() => setIsOpen(false)}
						/>

						<motion.div
							className="fixed pointer-events-none"
							style={{
								top: `calc(50% - ${navigationOffsetY}px)`,
								left: `calc(50% - ${navigationOffsetX}px)`,
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
							{visibleItems.map((item, index) => {
								const pos = getItemPosition(index, visibleItems.length)

								return (
									<motion.button
										key={item.id}
										onClick={item.action}
										className="absolute pointer-events-auto rounded-full shadow-xl flex flex-col items-center justify-center transition-all duration-300 scale-100 hover:scale-105"
										initial={{ scale: 0, opacity: 0 }}
										animate={{
											scale: 1,
											opacity: 1,
										}}
										exit={{ scale: 0, opacity: 0 }}
										transition={{
											type: 'spring',
											stiffness: 400,
											damping: 22,
											mass: 0.4,
											delay: index * 0.03,
										}}
										whileHover={isMobile ? {} : { scale: 1.15 }}
										whileTap={{ scale: 0.95 }}
										style={{
											width: isMobile ? '70px' : '90px',
											height: isMobile ? '70px' : '90px',
											left: pos.x,
											top: pos.y,
											transform: 'translate(-50%, -50%)',
											background: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
										}}
									>
										<div
											className={`w-full h-full rounded-full flex flex-col items-center justify-center bg-gradient-to-br ${item.color}`}
										>
											<span
												className="material-symbols-outlined text-white"
												style={{ fontSize: isMobile ? '28px' : '32px' }}
											>
												{item.icon}
											</span>
											<span
												className="text-white font-bold mt-1"
												style={{ fontSize: isMobile ? '9px' : '11px' }}
											>
												{item.label}
											</span>
											{item.badge !== null && item.badge > 0 && (
												<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
													{item.badge}
												</span>
											)}
										</div>
									</motion.button>
								)
							})}
						</motion.div>

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

			{/* Customer Auth Modal */}
			<AnimatePresence>
				{showAuthModal && (
					<CustomerAuth
						onClose={() => setShowAuthModal(false)}
						onSuccess={handleAuthSuccess}
						tenantId={tenantId}
					/>
				)}
			</AnimatePresence>

			{/* Help Request Modal */}
			<HelpRequestModal
				isOpen={showHelpModal}
				onClose={() => setShowHelpModal(false)}
				onSubmit={handleHelpRequest}
			/>
		</>
	)
}

export default RadialNavigationMenu
