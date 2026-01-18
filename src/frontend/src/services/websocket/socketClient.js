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
		this.isConnecting = false // ✅ Track connecting state to prevent duplicates
	}

	/**
	 * Connect to WebSocket server
	 * @param {string} token - JWT access token
	 * @param {Object} options - Optional connection options
	 * @param {string} options.tenantId - Tenant ID for room joining (ownerId from URL)
	 * @param {string} options.waiterId - Waiter ID for personal room
	 * @param {string} options.tableId - Table ID for customer room
	 */
	connect(token, options = {}) {
		if (this.socket?.connected) {
			console.log('🔵 [Socket] Already connected')
			return this.socket
		}

		const SOCKET_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8888'

		console.log('🔵 [Socket] Connecting to:', SOCKET_URL + '/realtime')
		if (options.tenantId) {
			console.log('📍 [Socket] Connecting with tenantId:', options.tenantId)
		}

		this.socket = io(`${SOCKET_URL}/realtime`, {
			auth: {
				token: token,
				tenantId: options.tenantId || undefined,
				waiterId: options.waiterId || undefined,
				tableId: options.tableId || undefined,
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
	 * Connect as guest (for customers without login)
	 * @param {string} tenantId - Restaurant tenant ID
	 * @param {string} tableId - Table ID
	 * @param {string} guestName - Optional guest name
	 */
	connectAsGuest(tenantId, tableId, guestName = 'Guest') {
		// ✅ Check if already connected OR connecting
		if (this.socket?.connected) {
			console.log('🔵 [Socket] Already connected')
			return this.socket
		}

		// ✅ Prevent duplicate connection attempts
		if (this.isConnecting) {
			console.log('🔵 [Socket] Connection already in progress, skipping...')
			return this.socket
		}

		// ✅ If socket exists but not connected, reuse it
		if (this.socket && !this.socket.connected) {
			console.log('🔵 [Socket] Reusing existing socket, attempting reconnect...')
			this.socket.connect()
			return this.socket
		}

		this.isConnecting = true
		const SOCKET_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8888'

		console.log('🔵 [Socket] Connecting as guest to:', SOCKET_URL + '/realtime')
		console.log('📍 Guest info:', { tenantId, tableId, guestName })

		this.socket = io(`${SOCKET_URL}/realtime`, {
			auth: {
				tenantId: tenantId,
				tableId: tableId,
				guestName: guestName,
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
			this.isConnecting = false // ✅ Reset connecting flag
			this.reconnectAttempts = 0
			console.log('✅ [Socket] Connected:', this.socket.id)

			// Re-attach all custom listeners after reconnection
			// This ensures listeners survive socket reconnection
			this.reattachListeners()

			this.emit('connection.success', { socketId: this.socket.id })
		})

		this.socket.on('disconnect', (reason) => {
			this.isConnected = false
			this.isConnecting = false // ✅ Reset connecting flag
			console.warn('⚠️ [Socket] Disconnected:', reason)

			// ✅ If token was refreshed, try to reconnect with new token
			if (reason === 'io server disconnect' || reason === 'transport close') {
				const newToken = window.accessToken
				if (newToken && this.socket?.auth) {
					console.log('🔄 [Socket] Attempting reconnect with refreshed token...')
					this.socket.auth.token = newToken
					this.socket.connect()
				}
			}
		})

		this.socket.on('connect_error', (error) => {
			this.reconnectAttempts++
			console.error('❌ [Socket] Connection error:', error.message)

			// ✅ Check if token is stale and update before retry
			if (error.message.includes('unauthorized') || error.message.includes('jwt')) {
				const newToken = window.accessToken
				if (newToken && this.socket?.auth) {
					console.log('🔄 [Socket] Updating auth token for retry...')
					this.socket.auth.token = newToken
				}
			}

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
	 * Re-attach all stored listeners after socket reconnection
	 * Called automatically on 'connect' event
	 */
	reattachListeners() {
		if (!this.socket) return

		console.log('🔄 [Socket] Re-attaching listeners after reconnect...')
		this.listeners.forEach((callbacks, event) => {
			callbacks.forEach((callback) => {
				// Remove any existing to avoid duplicates
				this.socket.off(event, callback)
				// Re-attach
				this.socket.on(event, callback)
			})
			console.log(`🔵 [Socket] Re-attached ${callbacks.size} listener(s) for: ${event}`)
		})
	}

	/**
	 * Wait for socket to be connected
	 * @returns {Promise<boolean>} - Resolves when connected or rejects on timeout
	 */
	waitForConnection(timeout = 5000) {
		return new Promise((resolve, reject) => {
			// Already connected - resolve immediately
			if (this.socket?.connected && this.socket?.id) {
				resolve(true)
				return
			}

			let resolved = false // Prevent multiple resolves
			let pollInterval = null

			const cleanup = () => {
				if (pollInterval) {
					clearInterval(pollInterval)
					pollInterval = null
				}
				// Remove the connect listener we added
				if (this.socket && connectHandler) {
					this.socket.off('connect', connectHandler)
				}
			}

			const timeoutId = setTimeout(() => {
				if (!resolved) {
					resolved = true
					cleanup()
					reject(new Error('Socket connection timeout'))
				}
			}, timeout)

			const doResolve = () => {
				if (!resolved) {
					resolved = true
					clearTimeout(timeoutId)
					cleanup()
					resolve(true)
				}
			}

			// Handler for 'connect' event - MUST be named so we can remove it
			const connectHandler = () => {
				// Only resolve if socket has a valid id (fully connected)
				if (this.socket?.connected && this.socket?.id) {
					doResolve()
				}
			}

			// Listen for connect event
			this.socket?.on('connect', connectHandler)

			// Also poll as backup (in case connect event already fired)
			pollInterval = setInterval(() => {
				if (this.socket?.connected && this.socket?.id) {
					doResolve()
				}
			}, 100)
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
	 * @param {Function} callback - Optional. If not provided, removes all listeners for the event
	 */
	off(event, callback) {
		if (!this.socket) return

		if (callback) {
			// Remove specific callback
			this.socket.off(event, callback)

			// Remove from tracking
			if (this.listeners.has(event)) {
				this.listeners.get(event).delete(callback)
				if (this.listeners.get(event).size === 0) {
					this.listeners.delete(event)
				}
			}
		} else {
			// Remove all listeners for this event
			if (this.listeners.has(event)) {
				this.listeners.get(event).forEach((cb) => {
					this.socket.off(event, cb)
				})
				this.listeners.delete(event)
			}
			// Also remove any directly attached listeners
			this.socket.removeAllListeners(event)
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
	 * Update auth token for existing connection
	 * Call this after token refresh to keep socket authenticated
	 * @param {string} newToken - New JWT access token
	 */
	updateToken(newToken) {
		if (!this.socket) {
			console.warn('⚠️ [Socket] No socket instance to update token')
			return
		}

		// Update the auth object
		if (this.socket.auth) {
			this.socket.auth.token = newToken
			console.log('✅ [Socket] Auth token updated')
		}

		// If disconnected, try to reconnect with new token
		if (!this.socket.connected) {
			console.log('🔄 [Socket] Reconnecting with new token...')
			this.socket.connect()
		}
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
