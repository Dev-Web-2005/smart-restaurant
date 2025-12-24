// services/apiClient.js
// Axios client configuration for Backend API Gateway

import axios from 'axios'

// Create axios instance
const apiClient = axios.create({
	baseURL: '/api/v1',
	withCredentials: true, // Enable cookies for refresh token
	headers: {
		'Content-Type': 'application/json',
		'x-api-key': import.meta.env.VITE_API_KEY || 'smart-restaurant-2025-secret-key',
	},
	timeout: 30000,
})

// Request Interceptor - Attach access token
apiClient.interceptors.request.use(
	(config) => {
		const accessToken = window.accessToken || ''
		config.headers.Authorization = `Bearer ${accessToken}`
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
			console.log('🔄 Access token refreshed automatically by backend')
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

				try {
					console.log('🔄 Attempting manual token refresh...')

					const refreshResponse = await axios.get('/api/v1/identity/auth/refresh', {
						withCredentials: true, // Important: Send httpOnly refresh token cookie
					})

					if (refreshResponse.data.code === 1000) {
						const newAccessToken = refreshResponse.data.data.accessToken

						window.accessToken = newAccessToken
						apiClient.defaults.headers.common[
							'Authorization'
						] = `Bearer ${newAccessToken}`
						originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

						console.log('✅ Token refreshed, retrying request...')

						// Ensure POST data is properly sent on retry
						if (originalRequest.data && typeof originalRequest.data === 'string') {
							originalRequest.data = JSON.parse(originalRequest.data)
						}

						return apiClient(originalRequest)
					}
				} catch (refreshError) {
					console.error('❌ Token refresh failed:', refreshError)

					window.accessToken = null
					localStorage.removeItem('user')
					window.location.href = '/login'

					return Promise.reject({
						code: 1002,
						message: 'Session expired. Please login again.',
					})
				}
			}

			console.error('❌ Unauthorized:', data)
			return Promise.reject(data)
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
