import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
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
 * Provides WebSocket connection for Kitchen Display System
 * Auto-connects when user is authenticated as CHEF
 *
 * Events received:
 * - order.items.accepted - New items accepted by waiter (for kitchen to prepare)
 * - order.items.preparing - Items started preparing (broadcast)
 * - order.items.ready - Items ready (broadcast)
 */
export const KitchenSocketProvider = ({ children }) => {
	const { user } = useUser()
	const [isConnected, setIsConnected] = useState(false)
	const [newItems, setNewItems] = useState([])
	const socketRef = useRef(null)

	// Get socket URL from env
	const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888'

	// Connect to WebSocket
	const connect = useCallback(() => {
		if (socketRef.current?.connected) return

		const accessToken = window.accessToken

		if (!accessToken) {
			console.warn('No access token available for WebSocket connection')
			return
		}

		console.log('🔌 Connecting to Kitchen WebSocket...')

		socketRef.current = io(`${SOCKET_URL}/realtime`, {
			auth: { token: accessToken },
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
		})

		// Connection events
		socketRef.current.on('connect', () => {
			console.log('✅ Kitchen WebSocket connected')
			setIsConnected(true)
		})

		socketRef.current.on('disconnect', (reason) => {
			console.log('❌ Kitchen WebSocket disconnected:', reason)
			setIsConnected(false)
		})

		socketRef.current.on('connect_error', (error) => {
			console.error('❌ Kitchen WebSocket connection error:', error.message)
			setIsConnected(false)
		})

		// Listen for accepted items (from waiter)
		socketRef.current.on('order.items.accepted', (payload) => {
			console.log('📥 New items for kitchen:', payload)
			setNewItems((prev) => [...prev, ...payload.data.items])
		})

		// Listen for item status changes
		socketRef.current.on('order.items.preparing', (payload) => {
			console.log('🍳 Items preparing:', payload)
		})

		socketRef.current.on('order.items.ready', (payload) => {
			console.log('✅ Items ready:', payload)
		})

		// Connection success acknowledgment
		socketRef.current.on('connection.success', (data) => {
			console.log('🎉 Kitchen WebSocket authenticated:', data)
		})
	}, [SOCKET_URL])

	// Disconnect from WebSocket
	const disconnect = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.disconnect()
			socketRef.current = null
			setIsConnected(false)
		}
	}, [])

	// Clear new items after processing
	const clearNewItems = useCallback(() => {
		setNewItems([])
	}, [])

	// Track socket in state for context (avoids ref access during render)
	const [socket, setSocket] = useState(null)

	// Sync socket ref to state when connection changes
	useEffect(() => {
		setSocket(socketRef.current)
	}, [isConnected])

	// Auto-connect when user is authenticated
	useEffect(() => {
		// Only connect for CHEF role
		if (user && user.roles?.includes('CHEF')) {
			connect()
		}

		return () => {
			disconnect()
		}
	}, [user, connect, disconnect])

	const value = {
		isConnected,
		socket,
		newItems,
		clearNewItems,
		connect,
		disconnect,
	}

	return (
		<KitchenSocketContext.Provider value={value}>
			{children}
		</KitchenSocketContext.Provider>
	)
}
