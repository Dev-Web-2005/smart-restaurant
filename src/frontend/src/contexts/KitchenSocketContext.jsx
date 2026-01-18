import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useRef,
	useCallback,
} from 'react'
import { io } from 'socket.io-client'
import { useUser } from './UserContext'

const KitchenSocketContext = createContext(null)

export const useKitchenSocket = () => {
	const context = useContext(KitchenSocketContext)
	if (!context) {
		throw new Error('useKitchenSocket must be used within a KitchenSocketProvider')
	}
	return context
}

/**
 * Kitchen Socket Provider
 *
 * Provides WebSocket connection for Kitchen Display System with comprehensive event handling
 * Auto-connects when user is authenticated
 *
 * WebSocket Events:
 * Order Events:
 * - order.items.accepted - New items accepted by waiter → kitchen
 * - order.items.preparing - Items started preparing
 * - order.items.ready - Items marked ready
 * - order.items.served - Items served to customer
 * - order.items.rejected - Items rejected
 *
 * Kitchen Events:
 * - kitchen.ticket.new - New ticket created
 * - kitchen.ticket.ready - All items in ticket ready
 * - kitchen.ticket.completed - Ticket bumped/completed
 * - kitchen.ticket.priority - Priority changed
 * - kitchen.items.recalled - Items recalled for remake
 * - kitchen.timers.update - Timer updates (every 5 seconds)
 */
export const KitchenSocketProvider = ({ children }) => {
	const { user } = useUser()
	const [isConnected, setIsConnected] = useState(false)

	// State for different event types
	const [newTickets, setNewTickets] = useState([])
	const [ticketUpdates, setTicketUpdates] = useState(null)
	const [timerUpdates, setTimerUpdates] = useState([])
	const [priorityChanges, setPriorityChanges] = useState(null)

	// Callbacks for custom event handlers
	const [eventHandlers, setEventHandlers] = useState({})

	const socketRef = useRef(null)
	const lastTicketSoundRef = useRef(0)
	const isConnectingRef = useRef(false) // Prevent double connect in Strict Mode

	// Get socket URL from env - use VITE_API_GATEWAY_URL (not VITE_API_URL which has /api/v1)
	const SOCKET_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8888'

	/**
	 * Play sound alert for new tickets
	 */
	const playNewTicketSound = useCallback(() => {
		const now = Date.now()
		// Throttle sounds to prevent spam (1 sound per 2 seconds)
		if (now - lastTicketSoundRef.current < 2000) return

		lastTicketSoundRef.current = now

		try {
			// Create simple beep sound using Web Audio API
			const audioContext = new (window.AudioContext || window.webkitAudioContext)()
			const oscillator = audioContext.createOscillator()
			const gainNode = audioContext.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(audioContext.destination)

			oscillator.frequency.value = 800 // Frequency in hertz
			oscillator.type = 'sine'

			gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

			oscillator.start(audioContext.currentTime)
			oscillator.stop(audioContext.currentTime + 0.5)
		} catch (error) {
			console.warn('Failed to play sound:', error)
		}
	}, [])

	/**
	 * Register custom event handler
	 */
	const on = useCallback((eventName, handler) => {
		setEventHandlers((prev) => ({
			...prev,
			[eventName]: handler,
		}))
	}, [])

	/**
	 * Unregister custom event handler
	 */
	const off = useCallback((eventName) => {
		setEventHandlers((prev) => {
			const newHandlers = { ...prev }
			delete newHandlers[eventName]
			return newHandlers
		})
	}, [])

	/**
	 * Emit event to server
	 */
	const emit = useCallback((eventName, data) => {
		if (socketRef.current?.connected) {
			socketRef.current.emit(eventName, data)
		}
	}, [])

	// Connect to WebSocket
	const connect = useCallback(() => {
		// Prevent double connect (React Strict Mode runs effects twice)
		if (socketRef.current?.connected || isConnectingRef.current) {
			console.log('🔵 [KitchenSocket] Already connected or connecting, skipping')
			return
		}

		const accessToken = window.accessToken

		if (!accessToken) {
			console.warn(
				'⚠️ [KitchenSocket] No access token available for WebSocket connection',
			)
			return
		}

		isConnectingRef.current = true
		console.log('🔌 [KitchenSocket] Connecting to:', `${SOCKET_URL}/realtime`)

		socketRef.current = io(`${SOCKET_URL}/realtime`, {
			auth: { token: accessToken },
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
		})

		// ==================== CONNECTION EVENTS ====================

		socketRef.current.on('connect', () => {
			console.log('✅ [KitchenSocket] Connected successfully')
			isConnectingRef.current = false
			setIsConnected(true)
		})

		socketRef.current.on('disconnect', (reason) => {
			console.log('❌ [KitchenSocket] Disconnected:', reason)
			isConnectingRef.current = false
			setIsConnected(false)
		})

		socketRef.current.on('connect_error', (error) => {
			console.error('❌ [KitchenSocket] Connection error:', error.message)
			isConnectingRef.current = false
			setIsConnected(false)
		})

		socketRef.current.on('connection.success', (data) => {
			console.log('🎉 [KitchenSocket] Authenticated:', data)
		})

		// ==================== ORDER EVENTS ====================

		/**
		 * New items accepted by waiter → Kitchen should create ticket
		 */
		socketRef.current.on('order.items.accepted', (payload) => {
			console.log('📥 [Order] Items accepted for kitchen:', payload)
			if (eventHandlers['order.items.accepted']) {
				eventHandlers['order.items.accepted'](payload)
			}
		})

		/**
		 * Items started preparing (from any kitchen station)
		 */
		socketRef.current.on('order.items.preparing', (payload) => {
			console.log('🍳 [Order] Items preparing:', payload)
			if (eventHandlers['order.items.preparing']) {
				eventHandlers['order.items.preparing'](payload)
			}
		})

		/**
		 * Items marked as ready (from kitchen)
		 */
		socketRef.current.on('order.items.ready', (payload) => {
			console.log('✅ [Order] Items ready:', payload)
			if (eventHandlers['order.items.ready']) {
				eventHandlers['order.items.ready'](payload)
			}
		})

		/**
		 * Items served to customer (from waiter)
		 */
		socketRef.current.on('order.items.served', (payload) => {
			console.log('🍽️ [Order] Items served:', payload)
			if (eventHandlers['order.items.served']) {
				eventHandlers['order.items.served'](payload)
			}
		})

		/**
		 * Items rejected by waiter
		 */
		socketRef.current.on('order.items.rejected', (payload) => {
			console.log('❌ [Order] Items rejected:', payload)
			if (eventHandlers['order.items.rejected']) {
				eventHandlers['order.items.rejected'](payload)
			}
		})

		// ==================== KITCHEN-SPECIFIC EVENTS ====================

		/**
		 * New kitchen ticket created (display grouping)
		 */
		socketRef.current.on('kitchen.ticket.new', (payload) => {
			console.log('🎫 [Kitchen] New ticket:', payload)
			playNewTicketSound()
			setNewTickets((prev) => [...prev, payload.data])

			if (eventHandlers['kitchen.ticket.new']) {
				eventHandlers['kitchen.ticket.new'](payload)
			}
		})

		/**
		 * Kitchen ticket ready (all items prepared)
		 */
		socketRef.current.on('kitchen.ticket.ready', (payload) => {
			console.log('✅ [Kitchen] Ticket ready:', payload)
			setTicketUpdates({ type: 'ready', data: payload.data })

			if (eventHandlers['kitchen.ticket.ready']) {
				eventHandlers['kitchen.ticket.ready'](payload)
			}
		})

		/**
		 * Kitchen ticket completed (bumped)
		 */
		socketRef.current.on('kitchen.ticket.completed', (payload) => {
			console.log('🎯 [Kitchen] Ticket completed:', payload)
			setTicketUpdates({ type: 'completed', data: payload.data })

			if (eventHandlers['kitchen.ticket.completed']) {
				eventHandlers['kitchen.ticket.completed'](payload)
			}
		})

		/**
		 * Kitchen ticket priority changed
		 */
		socketRef.current.on('kitchen.ticket.priority', (payload) => {
			console.log('⚡ [Kitchen] Priority changed:', payload)
			setPriorityChanges(payload.data)

			if (eventHandlers['kitchen.ticket.priority']) {
				eventHandlers['kitchen.ticket.priority'](payload)
			}
		})

		/**
		 * Kitchen items recalled (need remake)
		 */
		socketRef.current.on('kitchen.items.recalled', (payload) => {
			console.log('🔄 [Kitchen] Items recalled:', payload)

			if (eventHandlers['kitchen.items.recalled']) {
				eventHandlers['kitchen.items.recalled'](payload)
			}
		})

		/**
		 * Kitchen timers update (every 5 seconds)
		 */
		socketRef.current.on('kitchen.timers.update', (payload) => {
			// Don't log this (too frequent)
			setTimerUpdates(payload.data || [])

			if (eventHandlers['kitchen.timers.update']) {
				eventHandlers['kitchen.timers.update'](payload)
			}
		})
	}, [SOCKET_URL, eventHandlers, playNewTicketSound])

	// Disconnect from WebSocket
	const disconnect = useCallback(() => {
		if (socketRef.current) {
			console.log('🔌 [KitchenSocket] Disconnecting...')
			socketRef.current.disconnect()
			socketRef.current = null
			setIsConnected(false)
			isConnectingRef.current = false
		}
	}, [])

	// Auto-connect when user is authenticated
	useEffect(() => {
		if (user) {
			connect()
		}

		return () => {
			disconnect()
		}
	}, [user, connect, disconnect])

	const value = {
		isConnected,
		socket: socketRef.current,

		// Event registration
		on,
		off,
		emit,

		// State updates from WebSocket
		newTickets,
		ticketUpdates,
		timerUpdates,
		priorityChanges,

		// State management
		clearNewTickets: () => setNewTickets([]),
		clearTicketUpdates: () => setTicketUpdates(null),
		clearPriorityChanges: () => setPriorityChanges(null),

		// Connection control
		connect,
		disconnect,
	}

	return (
		<KitchenSocketContext.Provider value={value}>
			{children}
		</KitchenSocketContext.Provider>
	)
}
