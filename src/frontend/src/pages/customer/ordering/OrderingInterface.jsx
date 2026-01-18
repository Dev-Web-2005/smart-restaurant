import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAlert } from '../../../contexts/AlertContext'
import apiClient from '../../../services/apiClient'
import { getOrderByIdAPI } from '../../../services/api/orderAPI'
import socketClient from '../../../services/websocket/socketClient'

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
	// Get tenantId/ownerId and tableId from URL params
	// Supports both legacy route (/order/:tenantId/table/:tableId) and new multi-tenant route (/r/:ownerId/order/table/:tableId)
	const params = useParams()
	const tenantId = params.tenantId || params.ownerId // Support both param names
	const tableId = params.tableId

	// Alert context for custom alerts/confirms
	const { showAlert } = useAlert()

	// State management
	const [cartItems, setCartItems] = useState([]) // { id, name, price, qty, totalPrice, modifiers, specialNotes, imageUrl }
	const [view, setView] = useState('MENU') // MENU | ORDERS | CART
	const [orders, setOrders] = useState([]) // Orders history (fetched from backend)
	const [loadingOrders, setLoadingOrders] = useState(false)
	const [isAuthRestored, setIsAuthRestored] = useState(false) // ✅ Track auth restoration

	// Settings state
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [currentBackground, setCurrentBackground] = useState(0)

	// ==================== AUTH RESTORATION ====================
	// ✅ Restore customer auth on component mount (handles F5/refresh)
	useEffect(() => {
		const restoreAuth = async () => {
			// Check if already has token in memory
			if (window.accessToken) {
				console.log('✅ Access token already in memory')
				setIsAuthRestored(true)
				return
			}

			// Check if guest mode
			const isGuest = localStorage.getItem('isGuestMode') === 'true'
			if (isGuest) {
				console.log('🚶 Guest mode - no auth required')
				setIsAuthRestored(true)
				return
			}

			// Try to restore from localStorage (customer session)
			const customerAuthStr = localStorage.getItem('customerAuth')
			if (customerAuthStr) {
				try {
					const customerAuth = JSON.parse(customerAuthStr)
					console.log('🔄 Restoring customer session...', customerAuth)

					// ✅ First try to use stored accessToken
					if (customerAuth.accessToken) {
						window.accessToken = customerAuth.accessToken
						console.log('🔑 Customer accessToken restored from localStorage')
						setIsAuthRestored(true)
						return
					}

					// Customer sessions don't have refresh token mechanism like admin
					// So we need to use the stored ownerId to try refresh if available
					const ownerId = customerAuth.ownerId || tenantId

					if (ownerId) {
						// Try to refresh the token using httpOnly cookie
						try {
							const refreshResponse = await apiClient.get('/identity/auth/refresh', {
								withCredentials: true,
							})

							if (refreshResponse.data.code === 1000) {
								const newAccessToken = refreshResponse.data.data.accessToken
								window.accessToken = newAccessToken
								console.log('✅ Customer session restored via refresh token')

								// Update customerAuth with any new data
								if (refreshResponse.data.data.userId) {
									const updatedAuth = {
										...customerAuth,
										userId: refreshResponse.data.data.userId,
										username: refreshResponse.data.data.username,
										email: refreshResponse.data.data.email,
										roles: refreshResponse.data.data.roles,
									}
									localStorage.setItem('customerAuth', JSON.stringify(updatedAuth))
								}

								setIsAuthRestored(true)
								return
							}
						} catch (refreshError) {
							console.warn('⚠️ Token refresh failed:', refreshError.message)
							// Refresh failed, but don't clear auth yet - might be guest-allowed actions
						}
					}
				} catch (error) {
					console.error('❌ Failed to restore customer session:', error)
				}
			}

			// No valid session found, but allow guest actions
			console.log('ℹ️ No valid customer session, allowing guest actions')
			setIsAuthRestored(true)
		}

		restoreAuth()
	}, [tenantId])

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

	// Refs for debouncing fetch operations
	const fetchOrdersTimeoutRef = useRef(null)
	const lastFetchOrdersTimeRef = useRef(0)
	const FETCH_ORDERS_DEBOUNCE = 500 // ms
	const FETCH_ORDERS_MIN_INTERVAL = 2000 // Minimum 2 seconds between fetches

	// ✅ Refs to prevent duplicate initialization
	const initialFetchDoneRef = useRef(false)
	const socketSetupDoneRef = useRef(false)
	const lastFetchCartTimeRef = useRef(0)
	const FETCH_CART_MIN_INTERVAL = 2000 // Minimum 2 seconds between cart fetches
	const orderRoomJoinedRef = useRef(false) // ✅ Track if order room already joined

	// Fetch cart from backend (with rate limiting)
	const fetchCart = useCallback(
		async (force = false) => {
			try {
				if (!tenantId || !tableId) {
					console.warn('⚠️ fetchCart: Missing tenantId or tableId')
					return
				}

				// ✅ Rate limiting - prevent too frequent fetches
				const now = Date.now()
				const timeSinceLastFetch = now - lastFetchCartTimeRef.current
				if (!force && timeSinceLastFetch < FETCH_CART_MIN_INTERVAL) {
					console.log(
						`⏳ Skipping cart fetch, only ${timeSinceLastFetch}ms since last fetch`,
					)
					return
				}

				console.log(
					'📥 Fetching cart from:',
					`/tenants/${tenantId}/tables/${tableId}/cart`,
				)
				const response = await apiClient.get(
					`/tenants/${tenantId}/tables/${tableId}/cart`,
				)
				console.log('📥 Cart response:', response.data)

				const backendCart = response.data?.data || {}
				const backendItems = backendCart.items || []

				// Map backend cart items to frontend format
				const mappedItems = backendItems.map((item) => {
					const modifierTotal =
						item.modifiers?.reduce((sum, mod) => sum + (mod.price || 0), 0) || 0
					return {
						id: item.menuItemId,
						name: item.name,
						price: item.price,
						qty: item.quantity,
						totalPrice: item.total || (item.price + modifierTotal) * item.quantity,
						modifiers:
							item.modifiers?.map((mod) => ({
								groupId: mod.modifierGroupId,
								optionId: mod.modifierOptionId,
								name: mod.name,
								price: mod.price,
							})) || [],
						specialNotes: item.notes || '',
						itemKey: item.itemKey,
						uniqueKey: `${item.menuItemId}-${JSON.stringify(item.modifiers || [])}`,
					}
				})

				setCartItems(mappedItems)
				console.log('✅ Cart fetched successfully:', mappedItems.length, 'items')
				lastFetchCartTimeRef.current = Date.now() // ✅ Update last fetch time
			} catch (error) {
				console.error('❌ Error fetching cart:', error)
				console.error('❌ Fetch cart error details:', {
					message: error.message,
					response: error.response?.data,
					status: error.response?.status,
				})
			}
		},
		[tenantId, tableId],
	)

	// Fetch customer's order by orderId from localStorage (with debouncing)
	const fetchOrders = useCallback(
		async (force = false) => {
			// ✅ Rate limiting - prevent too frequent fetches
			const now = Date.now()
			const timeSinceLastFetch = now - lastFetchOrdersTimeRef.current

			if (!force && timeSinceLastFetch < FETCH_ORDERS_MIN_INTERVAL) {
				console.log(`⏳ Skipping fetch, only ${timeSinceLastFetch}ms since last fetch`)
				return
			}

			try {
				if (!tenantId || !tableId) {
					console.warn('⚠️ fetchOrders: Missing tenantId or tableId')
					return
				}

				// Check if we have a saved orderId from checkout
				const orderSessionStr = localStorage.getItem('currentOrderSession')
				const orderSession = orderSessionStr ? JSON.parse(orderSessionStr) : null

				if (!orderSession || !orderSession.orderId) {
					console.log('⚠️ No orderId in localStorage, cannot fetch order')
					setOrders([])
					return
				}

				// Verify orderId belongs to current table
				if (orderSession.tableId !== tableId) {
					console.log('⚠️ OrderId belongs to different table, clearing session')
					localStorage.removeItem('currentOrderSession')
					setOrders([])
					return
				}

				setLoadingOrders(true)

				// Fetch specific order by ID
				console.log('📥 Fetching order by ID:', orderSession.orderId)
				const response = await getOrderByIdAPI({
					tenantId,
					orderId: orderSession.orderId,
				})

				console.log('📥 Order details response:', response)
				const orderData = response?.data

				if (orderData) {
					// Check if order is still active (not completed/cancelled)
					if (['COMPLETED', 'CANCELLED'].includes(orderData.status)) {
						console.log('⚠️ Order is completed/cancelled, clearing session')
						localStorage.removeItem('currentOrderSession')
						setOrders([])
					} else {
						setOrders([orderData])
						console.log(`✅ Fetched order by ID: ${orderData.id}`)
					}
				} else {
					console.warn('⚠️ No order data in response')
					setOrders([])
				}
			} catch (error) {
				console.error('❌ Error fetching orders:', error)
				console.error('❌ Fetch orders error details:', {
					message: error.message,
					response: error.response?.data,
					status: error.response?.status,
				})
				setOrders([]) // Clear orders on error
			} finally {
				setLoadingOrders(false)
				lastFetchOrdersTimeRef.current = Date.now() // ✅ Update last fetch time
			}
		},
		[tenantId, tableId],
	)

	// ✅ Debounced fetch orders - for websocket events
	const debouncedFetchOrders = useCallback(() => {
		if (fetchOrdersTimeoutRef.current) {
			clearTimeout(fetchOrdersTimeoutRef.current)
		}
		fetchOrdersTimeoutRef.current = setTimeout(() => {
			fetchOrders()
		}, FETCH_ORDERS_DEBOUNCE)
	}, [fetchOrders])

	// ✅ Load cart ONLY AFTER auth restoration (prevents duplicate fetches on F5)
	useEffect(() => {
		if (!isAuthRestored) {
			console.log('⏳ Waiting for auth restoration before fetching cart...')
			return
		}

		// ✅ Prevent duplicate initial fetch
		if (initialFetchDoneRef.current) {
			console.log('⏳ Initial fetch already done, skipping...')
			return
		}

		console.log('🚀 Auth restored, performing initial fetch...')
		initialFetchDoneRef.current = true
		fetchCart(true) // Force initial fetch
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthRestored, tenantId, tableId]) // ✅ Remove fetchCart from deps to prevent loops

	// Fetch orders when view changes to 'ORDERS'
	useEffect(() => {
		if (view === 'ORDERS' && isAuthRestored) {
			fetchOrders(true) // Force fetch when switching to orders view
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [view, isAuthRestored]) // ✅ Remove fetchOrders from deps to prevent loops

	// WebSocket setup for real-time order updates (Customer side)
	useEffect(() => {
		if (!tenantId || !tableId || !isAuthRestored) {
			return
		}

		// ✅ Prevent duplicate socket setup
		if (socketSetupDoneRef.current) {
			console.log('⏳ Socket already setup, skipping...')
			return
		}

		console.log('🔌 Setting up WebSocket for customer order updates')
		console.log('📍 Table:', tableId, 'Tenant:', tenantId)
		socketSetupDoneRef.current = true

		// Get customer info from localStorage
		const customerAuthStr = localStorage.getItem('customerAuth')
		const customerAuth = customerAuthStr ? JSON.parse(customerAuthStr) : null
		const guestName = customerAuth?.name || customerAuth?.email || 'Guest Customer'

		// Connect to WebSocket as guest (customers don't need JWT token)
		socketClient.connectAsGuest(tenantId, tableId, guestName)

		// Get current order session from localStorage
		const orderSessionStr = localStorage.getItem('currentOrderSession')
		const orderSession = orderSessionStr ? JSON.parse(orderSessionStr) : null

		// Event handler functions - ✅ Use debounced fetch
		const handleItemsAccepted = (payload) => {
			console.log('✅ [Socket Event] Items accepted:', payload)
			debouncedFetchOrders() // Debounced refresh
		}

		const handleItemsPreparing = (payload) => {
			console.log('👨‍🍳 [Socket Event] Items preparing:', payload)
			debouncedFetchOrders() // Debounced refresh
		}

		const handleItemsReady = (payload) => {
			console.log('🍽️ [Socket Event] Items ready:', payload)
			debouncedFetchOrders() // Debounced refresh
		}

		const handleItemsServed = (payload) => {
			console.log('✨ [Socket Event] Items served:', payload)
			debouncedFetchOrders() // Debounced refresh
		}

		const handleItemsRejected = (payload) => {
			console.log('❌ [Socket Event] Items rejected:', payload)
			debouncedFetchOrders() // Debounced refresh
		}

		// Wait for socket connection, then join order room and register listeners
		const handleConnectionSuccess = () => {
			console.log('✅ [Socket] Connection ready, setting up order tracking')

			// Join order room if we have an active order AND haven't joined yet
			if (orderSession && orderSession.orderId && orderSession.tableId === tableId) {
				// ✅ Prevent duplicate join attempts
				if (orderRoomJoinedRef.current) {
					console.log('⏳ Already joined order room, skipping...')
					return
				}

				console.log('🚪 Joining order room:', orderSession.orderId)
				orderRoomJoinedRef.current = true // Mark as joining

				socketClient.joinOrderRoom(orderSession.orderId).then((response) => {
					if (response.success) {
						console.log('✅ Successfully joined order room:', orderSession.orderId)
						// ✅ Only fetch if we haven't fetched orders recently
						if (Date.now() - lastFetchOrdersTimeRef.current > FETCH_ORDERS_MIN_INTERVAL) {
							fetchOrders(true) // Force fetch on initial join
						} else {
							console.log('⏳ Skipping fetch after join, recent fetch exists')
						}
					} else {
						console.error('❌ Failed to join order room:', response.error)
						orderRoomJoinedRef.current = false // Allow retry
					}
				})
			}

			// Register event listeners
			socketClient.on('order.items.accepted', handleItemsAccepted)
			socketClient.on('order.items.preparing', handleItemsPreparing)
			socketClient.on('order.items.ready', handleItemsReady)
			socketClient.on('order.items.served', handleItemsServed)
			socketClient.on('order.items.rejected', handleItemsRejected)
		}

		// Listen for connection success event
		socketClient.on('connection.success', handleConnectionSuccess)

		// Cleanup: Remove event listeners and leave room on unmount
		return () => {
			// ✅ Clear debounce timeout on cleanup
			if (fetchOrdersTimeoutRef.current) {
				clearTimeout(fetchOrdersTimeoutRef.current)
			}

			socketClient.off('connection.success', handleConnectionSuccess)
			socketClient.off('order.items.accepted', handleItemsAccepted)
			socketClient.off('order.items.preparing', handleItemsPreparing)
			socketClient.off('order.items.ready', handleItemsReady)
			socketClient.off('order.items.served', handleItemsServed)
			socketClient.off('order.items.rejected', handleItemsRejected)

			// Leave order room if we were in one
			if (orderSession && orderSession.orderId) {
				console.log('🚪 Leaving order room:', orderSession.orderId)
				socketClient.leaveOrderRoom(orderSession.orderId)
			}

			// ✅ Reset refs on cleanup (for HMR)
			socketSetupDoneRef.current = false
			orderRoomJoinedRef.current = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId, tableId, isAuthRestored]) // ✅ Remove fetchOrders/debouncedFetchOrders from deps

	// Handle adding item to cart from MenuPage
	const handleAddToCart = async (cartItem) => {
		console.log('🎯 handleAddToCart called with:', cartItem)
		console.log('🔑 tenantId:', tenantId, '| tableId:', tableId)

		try {
			// Cart item structure: { id, name, description, price, qty, totalPrice, modifiers, specialNotes, imageUrl }

			// Call backend API to add to cart
			const payload = {
				menuItemId: cartItem.id,
				name: cartItem.name,
				quantity: cartItem.qty,
				price: cartItem.price, // Base price
				modifiers:
					cartItem.modifiers?.map((mod) => ({
						modifierGroupId: mod.groupId,
						modifierOptionId: mod.optionId,
						name: mod.label || mod.name,
						price: mod.priceDelta || 0,
					})) || [],
				notes: cartItem.specialNotes || '',
			}

			console.log('📦 Payload to send:', JSON.stringify(payload, null, 2))
			console.log('📍 POST URL:', `/tenants/${tenantId}/tables/${tableId}/cart/items`)

			console.log('⏳ Sending POST request at:', new Date().toISOString())
			await apiClient.post(`/tenants/${tenantId}/tables/${tableId}/cart/items`, payload)
			console.log('⏱️ POST request completed at:', new Date().toISOString())
			// Reload entire cart from backend to ensure sync
			console.log('🔄 Reloading cart from backend...')
			await fetchCart()
			console.log('✅ Cart reloaded successfully')

			// Show success alert
			showAlert(
				'Added to Cart',
				`${cartItem.name} has been added to your cart`,
				'success',
				3000,
			)
		} catch (error) {
			console.error('❌ Error adding to cart:', error)
			console.error('❌ Error details:', {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			})
			showAlert(
				'Error',
				error.response?.data?.message || 'Failed to add item to cart',
				'error',
				3000,
			)
		}
	}

	const handleClearCart = () => {
		// Clear cart - confirmation is handled by CartPage
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

			{/* Loading State while restoring auth */}
			{!isAuthRestored && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
					<div className="text-center text-white">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
						<p className="text-lg">Loading your session...</p>
					</div>
				</div>
			)}

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
						onBrowseMenu={() => setView('MENU')}
						tenantId={tenantId}
						onRefresh={() => fetchOrders(true)} // ✅ Add refresh callback for auto refresh
						onPaymentComplete={() => {
							// After payment complete, redirect to menu
							showAlert('success', 'Payment successful! Thank you for dining with us.')
							setView('MENU')
							// Optionally refresh orders to get updated status
							fetchOrders()
						}}
						onOrderCancelled={() => {
							// Remove cancelled order from list or refresh
							showAlert('success', 'Order cancelled successfully')
							// Refresh orders to get updated status
							fetchOrders()
						}}
					/>
				)}
				{view === 'MENU' && (
					<MenuPage tenantId={tenantId} onAddToCart={handleAddToCart} />
				)}
				{view === 'CART' && (
					<CartPage
						cartItems={cartItems}
						onClearCart={handleClearCart}
						onUpdateCart={handleUpdateCart}
						onRefreshCart={fetchCart}
						onClose={() => setView('MENU')}
						tenantId={tenantId}
						tableId={tableId}
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
