import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAlert } from '../../../contexts/AlertContext'
import apiClient from '../../../services/apiClient'
import { getOrdersAPI } from '../../../services/api/orderAPI'
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

	// Fetch cart from backend
	const fetchCart = useCallback(async () => {
		try {
			if (!tenantId || !tableId) {
				console.warn('⚠️ fetchCart: Missing tenantId or tableId')
				return
			}

			console.log('📥 Fetching cart from:', `/tenants/${tenantId}/tables/${tableId}/cart`)
			const response = await apiClient.get(`/tenants/${tenantId}/tables/${tableId}/cart`)
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
		} catch (error) {
			console.error('❌ Error fetching cart:', error)
			console.error('❌ Fetch cart error details:', {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			})
		}
	}, [tenantId, tableId])

	// Fetch customer's unpaid orders
	const fetchOrders = useCallback(async () => {
		try {
			if (!tenantId || !tableId) {
				console.warn('⚠️ fetchOrders: Missing tenantId or tableId')
				return
			}

			setLoadingOrders(true)
			console.log('📥 Fetching unpaid orders for table:', tableId)

			const response = await getOrdersAPI({
				tenantId,
				tableId, // Filter by customer's table
				paymentStatus: 'PENDING', // Only unpaid orders
				page: 1,
				limit: 50, // Get up to 50 recent orders
			})

			console.log('📥 Orders response:', response)
			const fetchedOrders = response?.orders || []
			setOrders(fetchedOrders)
			console.log(`✅ Fetched ${fetchedOrders.length} unpaid orders`)
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
		}
	}, [tenantId, tableId])

	// Load cart on component mount
	useEffect(() => {
		fetchCart()
	}, [tenantId, tableId, fetchCart])

	// Fetch orders when view changes to 'ORDERS' or on mount
	useEffect(() => {
		if (view === 'ORDERS') {
			fetchOrders()
		}
	}, [view, fetchOrders])

	// WebSocket setup for real-time order updates (Customer side)
	useEffect(() => {
		if (!tenantId || !tableId) {
			return
		}

		const token = window.accessToken || localStorage.getItem('authToken')
		if (!token) {
			console.warn('⚠️ No auth token found for WebSocket')
			return
		}

		console.log('🔌 Setting up WebSocket for customer order updates')
		console.log('📍 Table:', tableId, 'Tenant:', tenantId)

		// Connect to WebSocket
		socketClient.connect(token)

		// Event handler functions
		const handleItemsAccepted = (payload) => {
			console.log('✅ Items accepted:', payload)
			fetchOrders() // Refresh orders to show updated status
		}

		const handleItemsReady = (payload) => {
			console.log('🍽️ Items ready:', payload)
			fetchOrders() // Refresh orders to show updated status
		}

		const handleItemsServed = (payload) => {
			console.log('✨ Items served:', payload)
			fetchOrders() // Refresh orders to show updated status
		}

		const handleItemsRejected = (payload) => {
			console.log('❌ Items rejected:', payload)
			fetchOrders() // Refresh orders to show rejection
		}

		// Register event listeners
		socketClient.on('order.items.accepted', handleItemsAccepted)
		socketClient.on('order.items.ready', handleItemsReady)
		socketClient.on('order.items.served', handleItemsServed)
		socketClient.on('order.items.rejected', handleItemsRejected)

		// Cleanup: Remove event listeners on unmount
		return () => {
			socketClient.off('order.items.accepted', handleItemsAccepted)
			socketClient.off('order.items.ready', handleItemsReady)
			socketClient.off('order.items.served', handleItemsServed)
			socketClient.off('order.items.rejected', handleItemsRejected)
		}
	}, [tenantId, tableId, fetchOrders])

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
