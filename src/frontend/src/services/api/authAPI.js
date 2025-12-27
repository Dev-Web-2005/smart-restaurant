// services/api/authAPI.js
// Authentication API Service - Identity Service via API Gateway

import apiClient from '../apiClient'
import { uploadCCCDImages } from './fileAPI'

/**
 * Login user with username and password
 * @param {string} username - Username (4-20 characters)
 * @param {string} password - Password (min 8 characters)
 * @returns {Promise} Response with user data and access token
 */
export const loginAPI = async (username, password) => {
	try {
		const response = await apiClient.post('/identity/auth/login', {
			username,
			password,
		})

		const { code, message, data } = response.data

		if (code === 1000) {
			const { accessToken, userId, username: userName, email, roles, authorities } = data

			// ✅ Don't store in window - will be stored in React state
			const userData = {
				userId,
				username: userName,
				email,
				roles,
				authorities,
			}
			localStorage.setItem('user', JSON.stringify(userData))

			// Set tenantId for table management (userId = tenantId in this system)
			window.currentTenantId = userId

			return {
				success: true,
				accessToken, // ✅ Return access token to store in React state
				user: userData,
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
 * Register new user with full profile data
 * @param {Object} signupData - User signup data from SignUp page
 * @param {Object} onboardingData - Restaurant + payment data from RestaurantSetupWizard
 * @returns {Promise} Response with user data
 */
/**
 * Register new user with profile information
 * @param {Object} signupData - User signup data from SignUp form
 * @param {string} signupData.username - Required: 4-20 characters
 * @param {string} signupData.email - Required: valid email format
 * @param {string} signupData.password - Required: min 8 characters
 * @param {string} signupData.confirmPassword - Required: must match password
 * @param {string} signupData.fullName - Optional
 * @param {number} signupData.yearOfBirth - Optional
 * @param {string} signupData.phoneNumber - Optional
 * @param {string} signupData.address - Optional
 * @param {Object} onboardingData - Onboarding data (restaurant info, payment, CCCD)
 * @returns {Promise<{success: boolean, user?: Object, message: string}>}
 */
export const registerAPI = async (signupData, onboardingData) => {
	try {
		// Check if KYC URLs are provided (new flow) or need to upload files (old flow)
		let frontImageUrl = ''
		let backImageUrl = ''

		if (onboardingData.cccdFrontUrl && onboardingData.cccdBackUrl) {
			frontImageUrl = onboardingData.cccdFrontUrl
			backImageUrl = onboardingData.cccdBackUrl
		} else if (onboardingData.cccdFrontFile && onboardingData.cccdBackFile) {
			// Old flow - upload files manually
			try {
				const { frontImageUrl: front, backImageUrl: back } = await uploadCCCDImages(
					onboardingData.cccdFrontFile,
					onboardingData.cccdBackFile,
				)
				frontImageUrl = front
				backImageUrl = back
				console.log('✅ CCCD images uploaded successfully')
			} catch (uploadError) {
				console.error('❌ CCCD upload failed:', uploadError)
				throw new Error(`Failed to upload identity documents: ${uploadError.message}`)
			}
		} else {
			throw new Error('CCCD images are required for registration')
		}

		// Prepare registration payload
		const payload = {
			// Required fields
			username: signupData.username,
			email: signupData.email,
			password: signupData.password,
			confirmPassword: signupData.confirmPassword || signupData.password, // ✅ Use confirmPassword from form, fallback to password

			// Optional profile data
			fullName: signupData.fullName || onboardingData.citizenInfo?.fullName || '',
			birthDay: signupData.yearOfBirth
				? new Date(`${signupData.yearOfBirth}-01-01`).toISOString()
				: onboardingData.citizenInfo?.dateOfBirth
				? new Date(onboardingData.citizenInfo.dateOfBirth).toISOString()
				: undefined,
			phoneNumber: signupData.phoneNumber || '',
			address: signupData.address || onboardingData.citizenInfo?.address || '',

			// Restaurant information
			restaurantName: onboardingData.restaurantName || '',
			businessAddress: onboardingData.address || '',
			contractNumber: onboardingData.phone || '',
			contractEmail: onboardingData.email || '',

			// Payment information
			cardHolderName: onboardingData.cardholderName || '',
			accountNumber: onboardingData.accountNumber || '',
			expirationDate: onboardingData.expirationDate || '',
			cvv: onboardingData.cvv || '',

			// CCCD Images (from KYC or manual upload)
			frontImage: frontImageUrl,
			backImage: backImageUrl,
		}

		// ✅ Debug log to verify payload before sending
		console.log('📦 Registration payload prepared:', {
			username: payload.username,
			email: payload.email,
			hasPassword: !!payload.password,
			hasConfirmPassword: !!payload.confirmPassword,
			passwordsMatch: payload.password === payload.confirmPassword,
			restaurantName: payload.restaurantName,
			frontImage: payload.frontImage ? '✅ Present' : '❌ Missing',
			backImage: payload.backImage ? '✅ Present' : '❌ Missing',
		})

		// ✅ Final validation before sending
		if (!payload.frontImage || !payload.backImage) {
			throw new Error(
				'❌ CCCD images are required. Please complete identity verification.',
			)
		}

		// Send registration request
		const response = await apiClient.post('/identity/users/register', payload)

		const { code, message, data } = response.data

		if (code === 200) {
			return {
				success: true,
				user: data,
				message,
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
		const validationErrors = error?.errors || error?.response?.data?.errors
		let userMessage = 'Registration failed. Please try again.'

		switch (errorCode) {
			case 2002:
				userMessage = 'Username or email already exists. Please use a different one.'
				break
			case 2901:
				// Validation errors - extract specific field errors
				if (Array.isArray(validationErrors)) {
					const errorMessages = validationErrors.map(
						(err) => `${err.field}: ${err.message}`,
					)
					userMessage = errorMessages.join(', ')
				} else {
					userMessage = 'Invalid input. Please check your form data.'
				}
				break
			case 2004:
				userMessage = 'Failed to create user profile. Please try again.'
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
			validationErrors,
		}
	}
}

// ============================================================================
// 3. LOGOUT API
// ============================================================================
/**
 * Logout user and invalidate tokens
 * Requires: accessToken in Authorization header (auto-attached by interceptor)
 * Backend will blacklist both access and refresh tokens
 *
 * Response (200 OK):
 * {
 *   code: 1000,
 *   message: "Logout successful"
 * }
 *
 * Error codes:
 * - 1004: UNAUTHORIZED (401) - No valid token
 */
export const logoutAPI = async (accessToken) => {
	try {
		// Temporarily set token for logout request
		if (accessToken) {
			window.accessToken = accessToken
		}

		const response = await apiClient.get('/identity/auth/logout')

		const { code, message } = response.data

		if (code === 1000) {
			console.log('✅ Logout successful')

			window.accessToken = null
			localStorage.removeItem('user')

			return {
				success: true,
				message,
			}
		} else {
			return {
				success: false,
				message: message || 'Logout failed',
			}
		}
	} catch (error) {
		console.error('❌ Logout error:', error)

		// Clear storage even on error
		window.accessToken = null
		localStorage.removeItem('user')

		return {
			success: false,
			message: 'Logout completed (with errors)',
		}
	}
}

/**
 * Get current authenticated user information
 * @param {string} accessToken - Access token from React state
 * @returns {Promise} Response with user data
 */
export const getCurrentUserAPI = async (accessToken) => {
	try {
		// Temporarily set token for this request
		if (accessToken) {
			window.accessToken = accessToken
		}

		const response = await apiClient.get('/identity/auth/me')

		const { code, data } = response.data

		if (code === 1000) {
			console.log('✅ User data fetched:', data.username)

			localStorage.setItem('user', JSON.stringify(data))

			return {
				success: true,
				user: data,
			}
		} else {
			return {
				success: false,
				message: 'Failed to fetch user data',
			}
		}
	} catch (error) {
		console.error('❌ Get user error:', error)

		const errorCode = error?.code || error?.response?.data?.code

		// Clear storage if unauthorized
		if (errorCode === 1004 || errorCode === 1002) {
			window.accessToken = null
			localStorage.removeItem('user')
		}

		return {
			success: false,
			message: 'Failed to fetch user data',
			errorCode,
		}
	}
}

/**
 * Refresh access token using httpOnly refresh token cookie
 * Flow:
 *   Browser refresh → Access token lost (React state cleared)
 *   → Frontend calls /auth/refresh (cookie auto-sent)
 *   → Server verifies refreshToken from cookie
 *   → Returns new accessToken + user data
 *   → Frontend stores in React state (RAM)
 *
 * @returns {Promise} Response with new access token and user data
 */
export const refreshTokenAPI = async () => {
	try {
		const response = await apiClient.get('/identity/auth/refresh')

		const { code, data, message } = response.data

		if (code === 1000) {
			// ✅ Token refreshed from httpOnly cookie
			const { accessToken, userId, username, email, roles } = data

			console.log('✅ Token refreshed from httpOnly cookie')

			// ✅ Store access token in memory (window.accessToken)
			window.accessToken = accessToken

			// Update localStorage with user data (non-sensitive)
			const userData = { userId, username, email, roles }
			localStorage.setItem('user', JSON.stringify(userData))

			return {
				success: true,
				accessToken,
				user: userData, // ✅ User data from refresh response (no extra API call needed)
				message,
			}
		} else {
			// ⚠️ Unexpected response
			console.warn('⚠️ Unexpected refresh response:', response.data)
			return {
				success: false,
				message: message || 'Failed to refresh token',
			}
		}
	} catch (error) {
		// ❌ Refresh token expired or invalid
		console.error('❌ Token refresh error:', error)

		// Clear storage if refresh fails
		localStorage.removeItem('user')

		return {
			success: false,
			message: 'Session expired. Please login again.',
		}
	}
}
