import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAlert } from '../../../contexts/AlertContext'
import apiClient from '../../../services/apiClient'

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

// Mock Orders Data (fallback for development)
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

const OrderManagementInterface = () => {
	// Get tenantId/ownerId and tableId from URL params
	// Supports both legacy route (/order/:tenantId/table/:tableId) and new multi-tenant route (/r/:ownerId/order/table/:tableId)
	const params = useParams()
	const tenantId = params.tenantId || params.ownerId // Support both param names
	const tableId = params.tableId

	// Alert context for custom alerts/confirms
	const { showAlert, showConfirm } = useAlert()

	// State management
	const [cartItems, setCartItems] = useState([]) // { id, name, price, qty, totalPrice, modifiers, specialNotes, imageUrl }
	const [view, setView] = useState('MENU') // MENU | ORDERS | CART
	const [orders, setOrders] = useState(mockOrders) // Orders history

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
	const fetchCart = async () => {
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
	}

	// Load cart on component mount
	useEffect(() => {
		fetchCart()
	}, [tenantId, tableId])

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
			const response = await apiClient.post(
				`/tenants/${tenantId}/tables/${tableId}/cart/items`,
				payload,
			)
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
					<OrdersPage orders={orders} onBrowseMenu={() => setView('MENU')} />
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
