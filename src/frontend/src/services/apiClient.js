// services/apiClient.js
// Axios client configuration for Backend API Gateway

import axios from 'axios'

// Get API Gateway URL from environment variable
// Development: Uses proxy via relative path '/api/v1'
// Production: Uses full URL from VITE_API_GATEWAY_URL
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL
	? `${import.meta.env.VITE_API_GATEWAY_URL}/api/v1`
	: '/api/v1'

// Create axios instance
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true, // Enable cookies for refresh token
	headers: {
		'Content-Type': 'application/json',
		'x-api-key': import.meta.env.VITE_API_KEY || 'smart-restaurant-2025-secret-key',
	},
	timeout: 30000,
})

// ==================== TOKEN REFRESH QUEUE MANAGEMENT ====================
// Global flag to prevent multiple concurrent token refresh requests
let isRefreshing = false
let refreshPromise = null // Store the refresh promise for reuse
let refreshSubscribers = []

// Function to add pending requests to queue
const subscribeTokenRefresh = (callback) => {
	refreshSubscribers.push(callback)
}

// Function to execute all pending requests with new token
const onTokenRefreshed = (newToken) => {
	refreshSubscribers.forEach((callback) => callback(newToken))
	refreshSubscribers = []
}

// Function to reject all pending requests on refresh failure
const onTokenRefreshFailed = (error) => {
	refreshSubscribers.forEach((callback) => callback(null, error))
	refreshSubscribers = []
}

// Centralized token refresh function with debouncing
const performTokenRefresh = async () => {
	// If already refreshing, return the existing promise
	if (refreshPromise) {
		console.log('🔄 [apiClient] Reusing existing refresh promise...')
		return refreshPromise
	}

	console.log('🔄 [apiClient] Starting token refresh...')

	refreshPromise = axios
		.get('/api/v1/identity/auth/refresh', {
			withCredentials: true, // Important: Send httpOnly refresh token cookie
			timeout: 10000, // 10 second timeout for refresh
		})
		.then((response) => {
			if (response.data.code === 1000) {
				const newAccessToken = response.data.data.accessToken

				// ✅ Store new token in memory
				window.accessToken = newAccessToken
				apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

				// Update localStorage with new user data
				if (response.data.data.userId) {
					const userData = {
						userId: response.data.data.userId,
						username: response.data.data.username,
						email: response.data.data.email,
						roles: response.data.data.roles,
						ownerId: response.data.data.ownerId,
					}
					localStorage.setItem('user', JSON.stringify(userData))
				}

				console.log('✅ [apiClient] Token refreshed successfully')
				return { success: true, accessToken: newAccessToken }
			} else {
				throw new Error('Refresh response invalid')
			}
		})
		.catch((error) => {
			console.error('❌ [apiClient] Token refresh failed:', error.message)
			throw error
		})
		.finally(() => {
			// Clear the promise after a short delay to prevent rapid re-calls
			setTimeout(() => {
				refreshPromise = null
			}, 1000)
		})

	return refreshPromise
}

// Request Interceptor - Attach access token from memory (window.accessToken)
apiClient.interceptors.request.use(
	(config) => {
		// ✅ Get access token from window (set by authAPI after login/refresh)
		const accessToken = window.accessToken || ''
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`
		}
		return config
	},
	(error) => {
		return Promise.reject(error)
	},
)

// Response Interceptor - Handle token refresh & errors
apiClient.interceptors.response.use(
	(response) => {
		const newAccessToken = response.headers['x-new-access-token']

		if (newAccessToken) {
			window.accessToken = newAccessToken
			apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
			console.log('✅ [apiClient] Token updated from response header')
		}

		return response
	},
	async (error) => {
		const originalRequest = error.config

		if (!error.response) {
			console.error('❌ Network Error:', error.message)
			return Promise.reject({
				code: 9002,
				message: 'Unable to connect to server. Please check your connection.',
				error: error.message,
			})
		}

		const { status, data } = error.response

		// Handle 401 Unauthorized - Try to refresh token
		// ✅ FIX: Accept any 401 error, not just errorCode 1002
		if (status === 401 && !originalRequest._retry) {
			originalRequest._retry = true
			const errorCode = data?.code

			console.log(
				`⚠️ [apiClient] 401 received (code: ${errorCode}), attempting refresh...`,
			)

			// If already refreshing, queue this request and wait
			if (isRefreshing) {
				console.log('🔄 [apiClient] Queuing request while refresh in progress...')
				return new Promise((resolve, reject) => {
					subscribeTokenRefresh((newToken, refreshError) => {
						if (refreshError || !newToken) {
							reject(refreshError || { code: 1002, message: 'Token refresh failed' })
							return
						}
						originalRequest.headers.Authorization = `Bearer ${newToken}`
						resolve(apiClient(originalRequest))
					})
				})
			}

			isRefreshing = true

			try {
				const result = await performTokenRefresh()

				if (result.success) {
					const newAccessToken = result.accessToken

					// Execute all queued requests with new token
					onTokenRefreshed(newAccessToken)

					// Retry original request
					originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

					// Ensure POST data is properly sent on retry
					if (originalRequest.data && typeof originalRequest.data === 'string') {
						try {
							originalRequest.data = JSON.parse(originalRequest.data)
						} catch (e) {
							// Data is already an object or invalid JSON
						}
					}

					return apiClient(originalRequest)
				}
			} catch (refreshError) {
				console.error('❌ [apiClient] Token refresh failed, clearing auth state')
				window.accessToken = null
				localStorage.removeItem('user')

				// Notify all queued requests of failure
				onTokenRefreshFailed(refreshError)

				// Only redirect if not already on login page
				if (!window.location.pathname.includes('/login')) {
					window.location.href = '/login'
				}

				return Promise.reject({
					code: 1002,
					message: 'Session expired. Please login again.',
				})
			} finally {
				isRefreshing = false
			}
		}

		// Handle 403 Forbidden
		if (status === 403) {
			console.error('❌ Forbidden:', data)
			return Promise.reject({
				code: data?.code || 1005,
				message: data?.message || 'You do not have permission to access this resource.',
			})
		}

		// Handle 400 Bad Request
		if (status === 400) {
			console.error('❌ Validation Error:', data)
			if (data.errors && Array.isArray(data.errors)) {
				console.error('📋 Validation Details:', data.errors)
			}
			return Promise.reject(data)
		}

		// Handle 500 Internal Server Error
		if (status === 500) {
			console.error('❌ Server Error:', data)
			return Promise.reject({
				code: data?.code || 9001,
				message: data?.message || 'Internal server error. Please try again later.',
			})
		}

		// Other errors
		console.error('❌ API Error:', data)
		return Promise.reject(data)
	},
)

// ==================== PROACTIVE TOKEN REFRESH ====================
// Refresh token 1 minute before expiry (assuming 5 minute access token)
let proactiveRefreshTimer = null

export const startProactiveRefresh = () => {
	// Clear existing timer
	if (proactiveRefreshTimer) {
		clearTimeout(proactiveRefreshTimer)
	}

	// Refresh every 4 minutes (1 minute before 5-minute expiry)
	const REFRESH_INTERVAL = 4 * 60 * 1000 // 4 minutes

	const scheduleRefresh = () => {
		proactiveRefreshTimer = setTimeout(async () => {
			if (window.accessToken) {
				console.log('🔄 [apiClient] Proactive token refresh...')
				try {
					await performTokenRefresh()
					scheduleRefresh() // Schedule next refresh
				} catch (error) {
					console.warn(
						'⚠️ [apiClient] Proactive refresh failed, will retry on next API call',
					)
				}
			}
		}, REFRESH_INTERVAL)
	}

	scheduleRefresh()
	console.log('✅ [apiClient] Proactive token refresh scheduled (every 4 minutes)')
}

export const stopProactiveRefresh = () => {
	if (proactiveRefreshTimer) {
		clearTimeout(proactiveRefreshTimer)
		proactiveRefreshTimer = null
		console.log('⏹️ [apiClient] Proactive token refresh stopped')
	}
}

export default apiClient
