import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { addItemToCartAPI } from '../../../services/api/cartAPI'
import { getOrdersAPI } from '../../../services/api/orderAPI'

// Import page components
import MenuPage from './pages/MenuPage'
import OrdersPage from './pages/OrdersPage'
import CartPage from './pages/CartPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'

// Import shared components
import RadialNavigationMenu from './components/RadialNavigationMenu'

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

const OrderManagementInterface = () => {
	// Get tenantId and tableId from URL params
	const { tenantId, tableId } = useParams()

	// Get customer info (guest or logged in)
	const [customerInfo, setCustomerInfo] = useState(null)

	// Load customer info on mount
	React.useEffect(() => {
		const customerAuth = localStorage.getItem('customerAuth')
		if (customerAuth) {
			try {
				const parsed = JSON.parse(customerAuth)
				setCustomerInfo(parsed)
				console.log('✅ Customer authenticated:', parsed)
			} catch (err) {
				console.error('❌ Failed to parse customerAuth:', err)
			}
		} else {
			console.log('🔓 Guest mode - no customer authentication')
		}
	}, [])

	// State management
	const [cartItems, setCartItems] = useState([]) // { id, name, price, qty, totalPrice, modifiers, specialNotes, imageUrl }
	const [view, setView] = useState('MENU') // MENU | ORDERS | CART
	const [orders, setOrders] = useState([]) // Orders history - load from API
	const [loadingOrders, setLoadingOrders] = useState(false)

	// Load orders when switching to ORDERS view
	useEffect(() => {
		if (view === 'ORDERS' && tenantId && tableId) {
			loadOrders()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view, tenantId, tableId])

	// Auto-refresh orders every 30 seconds when in ORDERS view
	useEffect(() => {
		let intervalId = null

		if (view === 'ORDERS' && tenantId && tableId) {
			// Refresh every 30 seconds
			intervalId = setInterval(() => {
				loadOrders(true) // Pass true to indicate background refresh (no loading spinner)
			}, 30000)
		}

		return () => {
			if (intervalId) {
				clearInterval(intervalId)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view, tenantId, tableId])

	// Load orders from API
	const loadOrders = async (isBackgroundRefresh = false) => {
		if (!isBackgroundRefresh) {
			setLoadingOrders(true)
		}

		try {
			// Check if customer has authentication
			if (!window.accessToken) {
				console.warn('⚠️ No access token found. Customer may need to login.')
				
				// Check if there's customerAuth in localStorage
				const customerAuth = localStorage.getItem('customerAuth')
				if (!customerAuth) {
					console.log('🔓 No customer authentication - orders require login')
					setOrders([])
					if (!isBackgroundRefresh) {
						setLoadingOrders(false)
					}
					return
				}
				
				// Has customerAuth but no window.accessToken - try to refresh token via apiClient
				console.log('🔄 Attempting to restore session...')
			}

			console.log(
				'📋 Loading orders for table:',
				tableId,
				isBackgroundRefresh ? '(background)' : '',
			)

			const result = await getOrdersAPI(tenantId, {
				tableId: tableId,
				limit: 50, // Get recent 50 orders
			})

			if (result.success && result.data?.orders) {
				console.log('✅ Orders loaded:', result.data.orders.length)

				// Transform orders to match OrderCard component format
				const transformedOrders = result.data.orders.map((order) => ({
					id: order.id,
					createdAt: order.createdAt,
					status: order.status, // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
					currentStep: mapOrderStatus(order.status),
					totalAmount: order.totalAmount,
					paymentStatus: order.paymentStatus,
					items: order.items.map((item) => ({
						id: item.id, // Item ID for cancel operation
						name: item.menuItemName || item.name,
						price: item.price,
						quantity: item.quantity,
						status: item.status, // PENDING, ACCEPTED, PREPARING, READY, SERVED, REJECTED, CANCELLED
						modifiers: item.modifiers?.map((m) => m.modifierName || m.name) || [],
						rejectionReason: item.rejectionReason || null,
					})),
					rejectionReason:
						order.items.find((i) => i.status === 'REJECTED')?.rejectionReason || null,
				}))

				setOrders(transformedOrders)
			} else {
				console.log('⚠️ No orders found or failed to load:', result.message)
				
				// If unauthorized, customer needs to re-login
				if (result.error?.code === 1004 || result.message?.includes('Unauthorized')) {
					console.log('🔐 Authentication required - clearing customer auth')
					localStorage.removeItem('customerAuth')
					window.accessToken = null
					alert('Your session has expired. Please login again.')
				}
				
				setOrders([])
			}
		} catch (error) {
			console.error('❌ Load orders error:', error)
			
			// Handle auth errors
			if (error.response?.status === 401) {
				console.log('🔐 Unauthorized - clearing customer auth')
				localStorage.removeItem('customerAuth')
				window.accessToken = null
				alert('Your session has expired. Please login again.')
			}
			
			setOrders([])
		} finally {
			if (!isBackgroundRefresh) {
				setLoadingOrders(false)
			}
		}
	}

	// Helper function to map order status to display text
	const mapOrderStatus = (status) => {
		const statusMap = {
			PENDING: 'Pending',
			IN_PROGRESS: 'Preparing',
			COMPLETED: 'Completed',
			CANCELLED: 'Cancelled',
		}
		return statusMap[status] || status
	}

	// Settings state
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

	// Calculate total items in cart
	const totalItemsInCart = cartItems.reduce((acc, item) => acc + item.qty, 0)

	// Handle adding item to cart from MenuPage
	const handleAddToCart = async (cartItem) => {
		if (!tenantId || !tableId) {
			alert('Missing tenant or table information. Please scan QR code again.')
			return
		}

		// Cart item structure from modal: { id, name, description, price, qty, totalPrice, modifiers, specialNotes, imageUrl }
		console.log('🛒 Adding item to cart:', cartItem)

		try {
			// Transform modifiers to API format
			const modifiersForAPI = (cartItem.modifiers || []).map((mod) => ({
				modifierGroupId: mod.groupId, // Backend expects modifierGroupId
				modifierOptionId: mod.optionId || mod.id, // Backend expects modifierOptionId
				name: mod.label, // Backend expects name (not modifierName)
				price: mod.priceDelta || 0,
			}))

			console.log('🔧 Modifiers transformed for API:', modifiersForAPI)

			// Call add to cart API
			const result = await addItemToCartAPI(tenantId, tableId, {
				menuItemId: cartItem.id,
				quantity: cartItem.qty,
				price: cartItem.price,
				modifiers: modifiersForAPI,
				notes: cartItem.specialNotes || '',
			})

			if (result.success) {
				console.log('✅ Item added to cart via API:', result.data)

				// Backend returns entire cart with all items
				// Find the newly added/updated item by matching menuItemId and modifiers
				// Create a normalized modifier signature for comparison
				const createModifierSignature = (modifiers) => {
					if (!modifiers || modifiers.length === 0) return 'no-mods'
					return modifiers
						.map((mod) => {
							// Handle both frontend and backend modifier structures
							const groupId = mod.modifierGroupId || mod.groupId
							const optionId = mod.modifierOptionId || mod.optionId || mod.id
							return `${groupId}:${optionId}`
						})
						.sort()
						.join('|')
				}

				const frontendModSignature = createModifierSignature(cartItem.modifiers)

				// Find the matching item from backend response to get itemKey
				let backendItem = null
				if (result.data?.items) {
					backendItem = result.data.items.find((item) => {
						const backendModSignature = createModifierSignature(item.modifiers)
						return (
							item.menuItemId === cartItem.id &&
							backendModSignature === frontendModSignature
						)
					})
				}

				const itemKey = backendItem?.itemKey
				console.log('🔑 ItemKey from backend:', itemKey)

				// Update local state for immediate UI feedback
				const uniqueKey = `${cartItem.id}-${frontendModSignature}`

				// Check if exact same item (with same modifiers) exists in local cart
				const existingIndex = cartItems.findIndex((item) => {
					const itemModSignature = createModifierSignature(item.modifiers)
					return item.id === cartItem.id && itemModSignature === frontendModSignature
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
										itemKey: itemKey || item.itemKey, // Keep itemKey
								  }
								: item,
						),
					)
				} else {
					// Add as new cart item if different modifiers
					setCartItems((prev) => [
						...prev,
						{
							...cartItem,
							uniqueKey,
							itemKey, // Store itemKey for future updates/deletes
						},
					])
				}

				// Show success feedback
				alert(`✅ ${cartItem.name} added to cart!`)
			} else {
				console.error('❌ Failed to add item to cart:', result.message)
				alert(`Failed to add item: ${result.message}`)
			}
		} catch (error) {
			console.error('❌ Add to cart error:', error)
			alert('Failed to add item to cart. Please try again.')
		}
	}

	const handleClearCart = () => {
		setCartItems([])
	}

	const handleUpdateCart = (newCartItems) => {
		setCartItems(newCartItems)
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
					setSelectedCategory={() => {}}
					handleOpenCart={() => setView('CART')}
					ordersCount={orders.length}
					cartCount={totalItemsInCart}
					setIsSettingsOpen={setIsSettingsOpen}
					tenantId={tenantId}
				/>

				{/* CONTENT VIEWS */}
				{view === 'ORDERS' && (
					<OrdersPage
						orders={orders}
						loading={loadingOrders}
						tenantId={tenantId}
						onBrowseMenu={() => setView('MENU')}
						onRefresh={() => loadOrders(false)}
					/>
				)}

				{view === 'MENU' && (
					<MenuPage tenantId={tenantId} onAddToCart={handleAddToCart} />
				)}

				{view === 'CART' && (
					<CartPage
						tenantId={tenantId}
						tableId={tableId}
						customerInfo={customerInfo}
						cartItems={cartItems}
						onClearCart={handleClearCart}
						onUpdateCart={handleUpdateCart}
						onClose={() => setView('MENU')}
					/>
				)}

				{view === 'PROFILE' && <ProfilePage onBack={() => setView('MENU')} />}

				{/* SETTINGS MODAL */}
				<SettingsPage
					isOpen={isSettingsOpen}
					onClose={() => setIsSettingsOpen(false)}
					backgroundImages={backgroundImages}
					currentBackground={currentBackground}
					setCurrentBackground={setCurrentBackground}
				/>
			</div>
		</div>
	)
}

export default OrderManagementInterface
