import React, { createContext, useState, useContext, useCallback } from 'react'
import { FullPageLoader } from '../components/common/LoadingSpinner'

const LoadingContext = createContext()

export const useLoading = () => {
	const context = useContext(LoadingContext)
	if (!context) {
		throw new Error('useLoading must be used within LoadingProvider')
	}
	return context
}

/**
 * Loading Provider - Provides global loading state management
 * Usage:
 *
 * const { showLoading, hideLoading, setLoadingMessage } = useLoading()
 *
 * showLoading('Đang tải dữ liệu...')
 * // ... async operation
 * hideLoading()
 */
export const LoadingProvider = ({ children }) => {
	const [isLoading, setIsLoading] = useState(false)
	const [loadingMessage, setLoadingMessage] = useState('Đang tải...')
	const [loadingStack, setLoadingStack] = useState([])

	const showLoading = useCallback((message = 'Đang tải...') => {
		setLoadingMessage(message)
		setIsLoading(true)
		setLoadingStack((prev) => [...prev, message])
	}, [])

	const hideLoading = useCallback(() => {
		setLoadingStack((prev) => {
			const newStack = prev.slice(0, -1)
			if (newStack.length === 0) {
				setIsLoading(false)
			} else {
				setLoadingMessage(newStack[newStack.length - 1])
			}
			return newStack
		})
	}, [])

	const setMessage = useCallback((message) => {
		setLoadingMessage(message)
	}, [])

	const value = {
		isLoading,
		loadingMessage,
		showLoading,
		hideLoading,
		setLoadingMessage: setMessage,
	}

	return (
		<LoadingContext.Provider value={value}>
			{children}
			<FullPageLoader isLoading={isLoading} message={loadingMessage} />
		</LoadingContext.Provider>
	)
}

export default LoadingContext
