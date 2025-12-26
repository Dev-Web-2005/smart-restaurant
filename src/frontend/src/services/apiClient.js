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

// Global flag to prevent multiple concurrent token refresh requests
let isRefreshing = false
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

		// Handle 401 Unauthorized
		if (status === 401) {
			const errorCode = data?.code

			if (errorCode === 1002 && !originalRequest._retry) {
				originalRequest._retry = true

				// If already refreshing, queue this request
				if (isRefreshing) {
					return new Promise((resolve) => {
						subscribeTokenRefresh((newToken) => {
							originalRequest.headers.Authorization = `Bearer ${newToken}`
							resolve(apiClient(originalRequest))
						})
					})
				}

				isRefreshing = true

				try {
					const refreshResponse = await axios.get('/api/v1/identity/auth/refresh', {
						withCredentials: true, // Important: Send httpOnly refresh token cookie
					})

					if (refreshResponse.data.code === 1000) {
						const newAccessToken = refreshResponse.data.data.accessToken

						window.accessToken = newAccessToken
						apiClient.defaults.headers.common[
							'Authorization'
						] = `Bearer ${newAccessToken}`

						// Update localStorage with new user data
						if (refreshResponse.data.data.userId) {
							const userData = {
								userId: refreshResponse.data.data.userId,
								username: refreshResponse.data.data.username,
								email: refreshResponse.data.data.email,
								roles: refreshResponse.data.data.roles,
							}
							localStorage.setItem('user', JSON.stringify(userData))
						}

						// Execute all queued requests with new token
						onTokenRefreshed(newAccessToken)

						// Retry original request
						originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

						// Ensure POST data is properly sent on retry
						if (originalRequest.data && typeof originalRequest.data === 'string') {
							originalRequest.data = JSON.parse(originalRequest.data)
						}

						return apiClient(originalRequest)
					}
				} catch (refreshError) {
					window.accessToken = null
					localStorage.removeItem('user')

					// Notify all queued requests of failure
					refreshSubscribers = []

					// Redirect to login
					window.location.href = '/login'

					return Promise.reject({
						code: 1002,
						message: 'Session expired. Please login again.',
					})
				} finally {
					isRefreshing = false
				}
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
		} // Handle 500 Internal Server Error
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

export default apiClient
