import { io } from 'socket.io-client'

/**
 * WebSocket Client Service
 *
 * Manages real-time Socket.IO connection to API Gateway
 * Handles authentication, room management, and event listeners
 */

class SocketClient {
	constructor() {
		this.socket = null
		this.isConnected = false
		this.listeners = new Map() // event -> Set of callbacks
		this.reconnectAttempts = 0
		this.maxReconnectAttempts = 5
	}

	/**
	 * Connect to WebSocket server
	 * @param {string} token - JWT access token
	 */
	connect(token) {
		if (this.socket?.connected) {
			console.log('🔵 [Socket] Already connected')
			return this.socket
		}

		const SOCKET_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8888'

		console.log('🔵 [Socket] Connecting to:', SOCKET_URL + '/realtime')

		this.socket = io(`${SOCKET_URL}/realtime`, {
			auth: {
				token: token,
			},
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: this.maxReconnectAttempts,
		})

		this.setupEventHandlers()

		return this.socket
	}

	/**
	 * Setup default event handlers
	 */
	setupEventHandlers() {
		this.socket.on('connect', () => {
			this.isConnected = true
			this.reconnectAttempts = 0
			console.log('✅ [Socket] Connected:', this.socket.id)
			this.emit('connection.success', { socketId: this.socket.id })
		})

		this.socket.on('disconnect', (reason) => {
			this.isConnected = false
			console.warn('⚠️ [Socket] Disconnected:', reason)
		})

		this.socket.on('connect_error', (error) => {
			this.reconnectAttempts++
			console.error('❌ [Socket] Connection error:', error.message)

			if (this.reconnectAttempts >= this.maxReconnectAttempts) {
				console.error('❌ [Socket] Max reconnection attempts reached')
				this.disconnect()
			}
		})

		this.socket.on('error', (error) => {
			console.error('❌ [Socket] Error:', error)
		})

		this.socket.on('connection.success', (data) => {
			console.log('✅ [Socket] Connection success:', data)
		})

		this.socket.on('pong', (data) => {
			console.log('🏓 [Socket] Pong received:', data)
		})
	}

	/**
	 * Join waiters room to receive new order notifications
	 * Waiters receive order.items.new events in this room
	 */
	async joinWaitersRoom() {
		if (!this.socket?.connected) {
			console.error('❌ [Socket] Cannot join waiters room - not connected')
			return { success: false, error: 'Not connected' }
		}

		console.log('🔵 [Socket] Joining waiters room...')
		// Backend auto-joins waiters to tenant:{tenantId}:waiters room
		// Just confirm connection
		return { success: true }
	}

	/**
	 * Join order room to receive updates
	 * @param {string} orderId
	 */
	async joinOrderRoom(orderId) {
		if (!this.socket?.connected) {
			console.error('❌ [Socket] Cannot join room - not connected')
			return { success: false, error: 'Not connected' }
		}

		return new Promise((resolve) => {
			this.socket.emit('order.join', { orderId }, (response) => {
				console.log('🔵 [Socket] Join order room response:', response)
				resolve(response)
			})
		})
	}

	/**
	 * Leave order room
	 * @param {string} orderId
	 */
	async leaveOrderRoom(orderId) {
		if (!this.socket?.connected) return

		return new Promise((resolve) => {
			this.socket.emit('order.leave', { orderId }, (response) => {
				console.log('🔵 [Socket] Leave order room response:', response)
				resolve(response)
			})
		})
	}

	/**
	 * Send ping to keep connection alive
	 */
	ping() {
		if (!this.socket?.connected) return

		this.socket.emit('ping', {}, (response) => {
			console.log('🏓 [Socket] Ping response:', response)
		})
	}

	/**
	 * Listen to server event
	 * @param {string} event - Event name
	 * @param {Function} callback - Callback function
	 */
	on(event, callback) {
		if (!this.socket) {
			console.warn('⚠️ [Socket] Cannot add listener - socket not initialized')
			return
		}

		// Track listener
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set())
		}
		this.listeners.get(event).add(callback)

		// Add to socket
		this.socket.on(event, callback)
		console.log(`🔵 [Socket] Listening to event: ${event}`)
	}

	/**
	 * Remove event listener
	 * @param {string} event
	 * @param {Function} callback
	 */
	off(event, callback) {
		if (!this.socket) return

		this.socket.off(event, callback)

		// Remove from tracking
		if (this.listeners.has(event)) {
			this.listeners.get(event).delete(callback)
			if (this.listeners.get(event).size === 0) {
				this.listeners.delete(event)
			}
		}

		console.log(`🔵 [Socket] Stopped listening to event: ${event}`)
	}

	/**
	 * Emit custom event (for internal use)
	 * @param {string} event
	 * @param {*} data
	 */
	emit(event, data) {
		if (this.listeners.has(event)) {
			this.listeners.get(event).forEach((callback) => {
				try {
					callback(data)
				} catch (error) {
					console.error(`❌ [Socket] Error in listener for ${event}:`, error)
				}
			})
		}
	}

	/**
	 * Disconnect from server
	 */
	disconnect() {
		if (!this.socket) return

		console.log('🔴 [Socket] Disconnecting...')

		// Remove all listeners
		this.listeners.forEach((callbacks, event) => {
			callbacks.forEach((callback) => {
				this.socket.off(event, callback)
			})
		})
		this.listeners.clear()

		this.socket.disconnect()
		this.socket = null
		this.isConnected = false
	}

	/**
	 * Get connection status
	 */
	isSocketConnected() {
		return this.socket?.connected || false
	}
}

// Singleton instance
const socketClient = new SocketClient()

export default socketClient
