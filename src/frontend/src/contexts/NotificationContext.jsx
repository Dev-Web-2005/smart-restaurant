import React, { createContext, useContext, useState, useEffect } from 'react'

const NotificationContext = createContext()

export const useNotifications = () => {
	const context = useContext(NotificationContext)
	if (!context) {
		throw new Error('useNotifications must be used within a NotificationProvider')
	}
	return context
}

// Mock data for initial state
const mockPendingOrders = [
	{
		id: 'L1V4T',
		destination: 'Table 9',
		items: 4,
		time: '12:45 PM',
		totalPrice: 45.5,
		placedTime: Date.now() - 2 * 60 * 1000,
		paymentStatus: 'PAID',
	},
	{
		id: 'R8S3Y',
		destination: 'John D.',
		items: 6,
		time: '12:42 PM',
		totalPrice: 112.0,
		placedTime: Date.now() - 3 * 60 * 1000,
		paymentStatus: 'UNPAID',
	},
]

const mockHelpRequests = [
	{
		id: 'HR001',
		tableName: 'Table 5',
		timestamp: Date.now() - 2 * 60 * 1000,
		isAcknowledged: false,
		message: 'Customer needs assistance',
	},
	{
		id: 'HR002',
		tableName: 'Table 12',
		timestamp: Date.now() - 5 * 60 * 1000,
		isAcknowledged: false,
		message: 'Requesting waiter',
	},
]

export const NotificationProvider = ({ children }) => {
	const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
	const [newHelpRequestsCount, setNewHelpRequestsCount] = useState(0)

	// Fetch notification counts
	const fetchNotificationCounts = async () => {
		// TODO: Replace with actual API calls or socket.io listeners
		// For now, using mock data

		// Simulate API call
		setTimeout(() => {
			// Mock: Count pending orders
			setPendingOrdersCount(mockPendingOrders.length)

			// Mock: Count unacknowledged help requests
			const newRequests = mockHelpRequests.filter((req) => !req.isAcknowledged)
			setNewHelpRequestsCount(newRequests.length)
		}, 100)
	}

	// Update counts when orders/requests change
	useEffect(() => {
		fetchNotificationCounts()

		// TODO: Setup socket.io listeners
		// const socket = io(SOCKET_URL)
		//
		// socket.on('newOrder', () => {
		//   setPendingOrdersCount(prev => prev + 1)
		// })
		//
		// socket.on('orderApproved', () => {
		//   setPendingOrdersCount(prev => Math.max(0, prev - 1))
		// })
		//
		// socket.on('newHelpRequest', () => {
		//   setNewHelpRequestsCount(prev => prev + 1)
		// })
		//
		// socket.on('helpRequestAcknowledged', () => {
		//   setNewHelpRequestsCount(prev => Math.max(0, prev - 1))
		// })
		//
		// return () => socket.disconnect()

		// Polling as fallback (remove when socket.io is implemented)
		const interval = setInterval(fetchNotificationCounts, 30000) // Poll every 30s
		return () => clearInterval(interval)
	}, [])

	// Methods to manually update counts (useful for local state updates)
	const incrementPendingOrders = () => {
		setPendingOrdersCount((prev) => prev + 1)
	}

	const decrementPendingOrders = () => {
		setPendingOrdersCount((prev) => Math.max(0, prev - 1))
	}

	const incrementHelpRequests = () => {
		setNewHelpRequestsCount((prev) => prev + 1)
	}

	const decrementHelpRequests = () => {
		setNewHelpRequestsCount((prev) => Math.max(0, prev - 1))
	}

	const value = {
		pendingOrdersCount,
		newHelpRequestsCount,
		incrementPendingOrders,
		decrementPendingOrders,
		incrementHelpRequests,
		decrementHelpRequests,
		refreshCounts: fetchNotificationCounts,
	}

	return (
		<NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
	)
}
