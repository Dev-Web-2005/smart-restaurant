// services/api/customerAPI.js
// Customer Authentication API Service - For customer ordering interface

import apiClient from '../apiClient'

/**
 * Customer login with username/email and password under specific restaurant
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @param {string} ownerId - Restaurant owner's userId
 * @returns {Promise} Response with customer data and access token
 */
export const customerLoginAPI = async (username, password, ownerId) => {
	try {
		const response = await apiClient.post(`/identity/auth/login/${ownerId}`, {
			username,
			password,
		})

		const { code, message, data } = response.data

		if (code === 1000) {
			const {
				accessToken,
				userId,
				username: userName,
				email,
				roles,
				ownerId: ownerIdResponse,
			} = data

			// Store access token in window for apiClient interceptor
			window.accessToken = accessToken

			// Prepare customer data (include accessToken for persistence)
			const customerData = {
				userId,
				username: userName,
				email,
				roles,
				ownerId: ownerIdResponse,
				accessToken, // ✅ Store token for persistence across page refresh
			}

			// Store in localStorage for persistence
			localStorage.setItem('customerAuth', JSON.stringify(customerData))

			return {
				success: true,
				accessToken,
				customer: customerData,
				message,
			}
		} else {
			return {
				success: false,
				message: message || 'Login failed',
			}
		}
	} catch (error) {
		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Login failed. Please try again.'

		switch (errorCode) {
			case 1001:
				userMessage = 'Invalid username or password.'
				break
			case 2901:
				userMessage = 'Invalid input. Please check your credentials.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Customer signup under specific restaurant
 * @param {Object} signupData - Customer signup data
 * @param {string} signupData.username - Required: 4-20 characters
 * @param {string} signupData.email - Required: valid email
 * @param {string} signupData.password - Required: min 8 characters
 * @param {string} signupData.confirmPassword - Required: must match password
 * @param {string} signupData.fullName - Optional: full name
 * @param {string} signupData.phoneNumber - Optional: phone number
 * @param {string} ownerId - Restaurant owner's userId
 * @returns {Promise} Response with created customer data
 */
export const customerSignupAPI = async (signupData, ownerId) => {
	try {
		const payload = {
			username: signupData.username,
			email: signupData.email,
			password: signupData.password,
			confirmPassword: signupData.confirmPassword,
			fullName: signupData.fullName || '',
			phoneNumber: signupData.phoneNumber || '',
		}

		const response = await apiClient.post(`/identity/users/register/${ownerId}`, payload)

		const { code, message, data } = response.data

		if (code === 200 || code === 1000) {
			// Auto login after successful signup
			const loginResult = await customerLoginAPI(
				signupData.username,
				signupData.password,
				ownerId,
			)

			if (loginResult.success) {
				return {
					success: true,
					customer: loginResult.customer,
					accessToken: loginResult.accessToken,
					message: message || 'Registration successful',
				}
			} else {
				return {
					success: true,
					customer: data,
					message: message || 'Registration successful. Please login.',
					requireLogin: true,
				}
			}
		} else {
			return {
				success: false,
				message: message || 'Registration failed',
			}
		}
	} catch (error) {
		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Registration failed. Please try again.'

		console.error('❌ Customer signup error:', {
			errorCode,
			errorMessage,
			fullError: error?.response?.data || error,
		})

		switch (errorCode) {
			case 1001:
				userMessage = 'Authentication failed. Please try again.'
				break
			case 1004:
				userMessage = 'User not found. Please check restaurant ID.'
				break
			case 2001:
				userMessage = 'Owner account not found. Invalid restaurant ID.'
				break
			case 2002:
				userMessage = 'Username or email already exists.'
				break
			case 2101:
				userMessage =
					'Customer role not configured in system. Please contact restaurant support.'
				break
			case 2901:
				userMessage = 'Invalid input. Please check your information.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Customer logout - clear stored data
 */
export const customerLogoutAPI = () => {
	try {
		// Clear access token from window
		delete window.accessToken

		// Clear customer data from localStorage
		localStorage.removeItem('customerAuth')

		return {
			success: true,
			message: 'Logged out successfully',
		}
	} catch (error) {
		console.error('Logout error:', error)
		return {
			success: false,
			message: 'Logout failed',
		}
	}
}

/**
 * Get current customer from localStorage
 * @returns {Object|null} Customer data or null
 */
export const getCurrentCustomer = () => {
	try {
		const customerData = localStorage.getItem('customerAuth')
		if (customerData) {
			return JSON.parse(customerData)
		}
		return null
	} catch (error) {
		console.error('Error getting customer data:', error)
		return null
	}
}

/**
 * Check if customer is authenticated
 * @returns {boolean} True if authenticated
 */
export const isCustomerAuthenticated = () => {
	return getCurrentCustomer() !== null && !!window.accessToken
}
