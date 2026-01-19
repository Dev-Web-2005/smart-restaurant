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
			const {
				accessToken,
				userId,
				username: userName,
				email,
				roles,
				authorities,
				ownerId,
			} = data

			// ✅ Don't store in window - will be stored in React state
			const userData = {
				userId,
				username: userName,
				email,
				roles,
				authorities,
				ownerId: ownerId || null, // Include ownerId for multi-tenant context
			}
			localStorage.setItem('user', JSON.stringify(userData))

			// Set tenantId for table management
			// ADMIN không có ownerId - chỉ USER (owner) và Staff/Chef/Customer mới có
			// USER's userId = ownerId của restaurant họ sở hữu
			// Staff/Chef/Customer's ownerId = userId của owner
			const isAdmin = roles && roles.includes('ADMIN')
			if (!isAdmin && ownerId) {
				window.currentTenantId = ownerId
				localStorage.setItem('currentTenantId', ownerId)
			} else if (!isAdmin && roles && roles.includes('USER')) {
				// USER (owner) - their userId IS the ownerId for their restaurant
				window.currentTenantId = userId
				localStorage.setItem('currentTenantId', userId)
			}
			// Admin doesn't need tenantId

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
 * Login user with ownerId context (for Staff/Chef/Customer in multi-tenant)
 * Uses the endpoint: POST /identity/auth/login/:ownerId
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @param {string} ownerId - Restaurant owner's userId (tenant context)
 * @returns {Promise} Response with user data, access token, and ownerId
 */
export const loginWithOwnerAPI = async (username, password, ownerId) => {
	try {
		const response = await apiClient.post(`/identity/auth/login/${ownerId}`, {
			username,
			password,
		})

		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			const {
				accessToken,
				userId,
				username: userName,
				email,
				roles,
				authorities,
				ownerId: responseOwnerId,
			} = data

			const userData = {
				userId,
				username: userName,
				email,
				roles,
				authorities,
				ownerId: responseOwnerId || ownerId, // Use response ownerId or fallback to param
			}
			localStorage.setItem('user', JSON.stringify(userData))

			// Set tenantId for operations
			window.currentTenantId = responseOwnerId || ownerId
			localStorage.setItem('currentTenantId', responseOwnerId || ownerId)

			return {
				success: true,
				accessToken,
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
			case 1004:
				userMessage = 'Account not found in this restaurant.'
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
			const { accessToken, userId, username, email, roles, ownerId, authorities } = data

			// ✅ Store access token in memory (window.accessToken)
			window.accessToken = accessToken

			// 🔄 FALLBACK: If refresh API doesn't return roles, get from localStorage
			let finalRoles = roles
			let finalOwnerId = ownerId
			let finalAuthorities = authorities

			if (!roles || roles.length === 0) {
				const savedUser = localStorage.getItem('user')
				if (savedUser) {
					try {
						const parsed = JSON.parse(savedUser)
						finalRoles = parsed.roles || []
						finalOwnerId = finalOwnerId || parsed.ownerId || null
						finalAuthorities = finalAuthorities || parsed.authorities
					} catch (e) {
						console.warn('⚠️ Failed to parse saved user from localStorage')
					}
				}
			}

			// Update localStorage with user data (non-sensitive)
			// Include ownerId and authorities for completeness
			const userData = {
				userId,
				username,
				email,
				roles: finalRoles,
				ownerId: finalOwnerId || null,
				authorities: finalAuthorities,
			}
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

/**
 * Update email when registration failed (e.g., email not received)
 * @param {string} username - Username from signup
 * @param {string} newEmail - New email address
 * @returns {Promise} Response with success status
 */
export const updateEmailWhenRegisterFailed = async (username, newEmail) => {
	try {
		const response = await apiClient.post(
			'/identity/users/update-email-when-register-failed',
			{
				username,
				newEmail,
			},
		)

		const { code, message, data } = response.data

		if (code === 200) {
			return {
				success: true,
				message: message || 'Email updated successfully',
				data,
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to update email',
			}
		}
	} catch (error) {
		console.error('❌ Update email error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message || 'Failed to update email. Please try again.',
		}
	}
}

/**
 * Send verification email with OTP code
 * @returns {Promise} Response with sent status
 */
export const sendVerificationEmailAPI = async () => {
	try {
		const response = await apiClient.post('/identity/users/send-verification-email')

		const { code, message, data } = response.data

		if (code === 200) {
			return {
				success: true,
				message: message || 'Verification email sent successfully',
				data,
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to send verification email',
			}
		}
	} catch (error) {
		console.error('❌ Send verification email error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message ||
				'Failed to send verification email. Please try again.',
		}
	}
}

/**
 * Verify email with OTP code
 * @param {string} code - 6-digit OTP code
 * @returns {Promise} Response with verification status
 */
export const verifyEmailCodeAPI = async (code) => {
	try {
		const response = await apiClient.post('/identity/users/verify-email', { code })

		const { code: statusCode, message, data } = response.data

		if (statusCode === 200) {
			return {
				success: true,
				message: message || 'Email verified successfully',
				data,
			}
		} else {
			return {
				success: false,
				message: message || 'Invalid verification code',
			}
		}
	} catch (error) {
		console.error('❌ Verify email code error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message || 'Failed to verify email. Please try again.',
		}
	}
}

/**
 * Check email verification status
 * @param {string} email - Email to check
 * @returns {Promise} Response with verification status
 */
export const checkEmailVerificationStatusAPI = async (email) => {
	try {
		const response = await apiClient.post('/identity/users/check-verify-email-status', {
			email,
		})

		const { code, message, data } = response.data

		if (code === 200) {
			return {
				success: true,
				isVerified: data.isVerified,
				message,
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to check verification status',
			}
		}
	} catch (error) {
		console.error('❌ Check email verification status error:', error)
		return {
			success: false,
			message: 'Failed to check verification status. Please try again.',
		}
	}
}

/**
 * Resend verification email
 * @param {string} email - Email to resend verification
 * @returns {Promise} Response with sent status
 */
export const resendVerificationEmailAPI = async (email) => {
	try {
		const response = await apiClient.post('/identity/users/resend-verification-email', {
			email,
		})

		const { code, message, data } = response.data

		if (code === 200) {
			return {
				success: true,
				message: message || 'Verification email resent successfully',
				data,
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to resend verification email',
			}
		}
	} catch (error) {
		console.error('❌ Resend verification email error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message ||
				'Failed to resend verification email. Please try again.',
		}
	}
}

/**
 * Update user password
 * @param {Object} data - Password update data
 * @param {string} data.oldPassword - Current password
 * @param {string} data.newPassword - New password (min 8 characters)
 * @returns {Promise} Response with success status
 */
export const updatePasswordAPI = async ({ oldPassword, newPassword }) => {
	try {
		const response = await apiClient.put('/identity/auth/change-password', {
			oldPassword,
			newPassword,
		})

		const { code, message, data } = response.data

		if (code === 1000) {
			return {
				success: true,
				message: message || 'Password updated successfully',
				data,
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to update password',
			}
		}
	} catch (error) {
		console.error('❌ Update password error:', error)
		return {
			success: false,
			message:
				error.response?.data?.message ||
				'Failed to update password. Please check your current password.',
		}
	}
}

/**
 * Update user profile information
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.phoneNumber] - Phone number
 * @param {string} [profileData.address] - Address
 * @param {Date|string} [profileData.birthDay] - Birth date
 * @param {string} [profileData.restaurantName] - Restaurant name (for Owner)
 * @param {string} [profileData.businessAddress] - Business address (for Owner)
 * @param {string} [profileData.contractNumber] - Contract number
 * @param {string} [profileData.contractEmail] - Contract email
 * @param {string} [profileData.cardHolderName] - Card holder name
 * @param {string} [profileData.accountNumber] - Account number
 * @param {string} [profileData.expirationDate] - Expiration date
 * @param {string} [profileData.cvv] - CVV
 * @param {string} [profileData.frontImage] - Front image (CMND/CCCD)
 * @param {string} [profileData.backImage] - Back image (CMND/CCCD)
 * @returns {Promise<{success: boolean, message: string, data?: Object}>} Response with success status and profile data
 */
export const updateProfileAPI = async (profileData) => {
	try {
		console.log('📤 Updating profile with data:', profileData)
		const response = await apiClient.patch('/profiles/modify', profileData)

		console.log('📥 Profile update response:', response.data)

		// Profile service returns direct object or wrapped in response structure
		const responseData = response.data

		// Check if response is wrapped (has code/message) or direct profile object
		if (responseData && typeof responseData === 'object') {
			// Wrapped response structure (has code/message/data)
			if (responseData.code !== undefined) {
				const { code, message, data } = responseData
				// Accept HTTP success codes (200-299) or custom success codes (1000, 100)
				if ((code >= 200 && code < 300) || code === 1000 || code === 100) {
					return {
						success: true,
						message: message || 'Profile updated successfully',
						data: data,
					}
				} else {
					return {
						success: false,
						message: message || 'Failed to update profile',
					}
				}
			}

			// Direct profile object from microservice (no code wrapper)
			if (responseData.userId) {
				return {
					success: true,
					message: 'Profile updated successfully',
					data: responseData,
				}
			}
		}

		return {
			success: false,
			message: 'Invalid response format',
		}
	} catch (error) {
		console.error('❌ Update profile error:', error)
		console.error('❌ Error response:', error.response?.data)
		return {
			success: false,
			message:
				error.response?.data?.message ||
				error.message ||
				'Failed to update profile. Please try again.',
		}
	}
}

/**
 * Get user profile information
 * @returns {Promise<{success: boolean, message: string, data?: Object}>} Response with profile data
 */
export const getMyProfileAPI = async () => {
	try {
		console.log('📤 Fetching user profile...')
		const response = await apiClient.get('/profiles/my-profile')

		console.log('📥 Profile fetch response:', response.data)

		const responseData = response.data

		// Check if response is wrapped or direct profile object
		if (responseData && typeof responseData === 'object') {
			// Wrapped response structure (has code/message/data)
			if (responseData.code !== undefined) {
				const { code, message, data } = responseData
				// Accept HTTP success codes (200-299) or custom success codes (1000, 100)
				if ((code >= 200 && code < 300) || code === 1000 || code === 100) {
					return {
						success: true,
						message: message || 'Profile fetched successfully',
						data: data,
					}
				} else {
					return {
						success: false,
						message: message || 'Failed to fetch profile',
					}
				}
			}

			// Direct profile object from microservice (no code wrapper)
			if (responseData.userId) {
				return {
					success: true,
					message: 'Profile fetched successfully',
					data: responseData,
				}
			}
		}

		return {
			success: false,
			message: 'Invalid response format',
		}
	} catch (error) {
		console.error('❌ Get profile error:', error)
		console.error('❌ Error response:', error.response?.data)

		// Handle 404 - profile not found (first time user)
		if (error.response?.status === 404) {
			return {
				success: true,
				message: 'Profile not found',
				data: null, // Will be created on first update
			}
		}

		return {
			success: false,
			message:
				error.response?.data?.message || error.message || 'Failed to fetch profile',
		}
	}
}
