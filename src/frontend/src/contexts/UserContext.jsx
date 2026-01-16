// context/UserContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react'

// Toggle between mock and real API
// In production, mock API is not imported to avoid console logs
const USE_MOCK_API = import.meta.env.DEV && false // Always false, can be changed for local testing

// Import real API (always used in production)
import * as realAPI from '../services/api/authAPI'

// Conditionally import mock API only in development
let mockAPI = null
if (import.meta.env.DEV && USE_MOCK_API) {
	mockAPI = await import('../services/api/mockAuthAPI')
}

const {
	loginAPI,
	loginWithOwnerAPI,
	logoutAPI,
	registerAPI,
	getCurrentUserAPI,
	refreshTokenAPI,
} = USE_MOCK_API && mockAPI ? mockAPI : realAPI

const UserContext = createContext()

export const useUser = () => useContext(UserContext)

export const UserProvider = ({ children }) => {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)

	// State lưu dữ liệu signup tạm thời
	const [pendingSignupData, setPendingSignupData] = useState(null)

	/**
	 * Map backend roles to frontend role names
	 */
	const mapUserRole = (roles) => {
		if (!roles || roles.length === 0) return 'User'
		if (roles.includes('ADMIN')) return 'Super Administrator'
		if (roles.includes('CHEF')) return 'Chef'
		if (roles.includes('STAFF')) return 'Staff'
		if (roles.includes('CUSTOMER')) return 'Customer'
		if (roles.includes('USER')) return 'User'
		return 'User'
	}

	// Login function (for Owner/Admin - no ownerId)
	const login = async (username, password) => {
		setLoading(true)
		try {
			const result = await loginAPI(username, password)

			if (result.success) {
				// ✅ Store access token in memory if provided
				if (result.accessToken) {
					window.accessToken = result.accessToken
					console.log('✅ Access token stored in window.accessToken')
				}

				const userData = {
					...result.user,
					role: mapUserRole(result.user.roles),
					name: result.user.username,
				}
				setUser(userData)
				// ✅ Save user to localStorage for F5 persistence
				localStorage.setItem('user', JSON.stringify(result.user))
				// ✅ Mark this tab as active session (persists through F5, clears on tab close)
				sessionStorage.setItem('tabSession', Date.now().toString())
				setLoading(false)
				return { success: true, user: userData }
			} else {
				// ❌ Login failed
				setLoading(false)
				return { success: false, message: result.message }
			}
		} catch (error) {
			setLoading(false)
			return { success: false, message: 'Login failed. Please try again.' }
		}
	}

	// Login with ownerId (for Staff/Chef/Customer in multi-tenant)
	const loginWithOwner = async (username, password, ownerId) => {
		setLoading(true)
		try {
			const result = await loginWithOwnerAPI(username, password, ownerId)

			if (result.success) {
				// ✅ Store access token in memory
				if (result.accessToken) {
					window.accessToken = result.accessToken
					console.log('✅ Access token stored (tenant login)')
				}

				const userData = {
					...result.user,
					role: mapUserRole(result.user.roles),
					name: result.user.username,
					ownerId: result.user.ownerId || ownerId,
				}
				setUser(userData)
				localStorage.setItem('user', JSON.stringify(result.user))
				sessionStorage.setItem('tabSession', Date.now().toString())

				// Store tenant context
				localStorage.setItem('currentTenantId', result.user.ownerId || ownerId)
				window.currentTenantId = result.user.ownerId || ownerId

				setLoading(false)
				return { success: true, user: userData }
			} else {
				setLoading(false)
				return { success: false, message: result.message }
			}
		} catch (error) {
			setLoading(false)
			return { success: false, message: 'Login failed. Please try again.' }
		}
	}

	// 🆕 Hàm lưu dữ liệu signup tạm thời (không gọi API ngay)
	const startSignup = (signupData) => {
		setPendingSignupData(signupData)
		// Không set user ngay, đợi onboarding hoàn thành
	}

	// 🆕 Hàm hoàn thành onboarding và gửi toàn bộ dữ liệu
	const completeOnboarding = async (onboardingData) => {
		if (!pendingSignupData) {
			throw new Error('No pending signup data found')
		}

		setLoading(true)

		try {
			const result = await registerAPI(pendingSignupData, onboardingData)

			if (result.success) {
				// ✅ Registration successful - DO NOT auto-login
				// User will be directed to email confirmation page first
				// They will login after confirming email receipt
				setPendingSignupData(null) // Clear pending data
				setLoading(false)
				return {
					success: true,
					message: 'Registration successful! Please check your email.',
					requireLogin: false,
				}
			} else {
				// ❌ Registration failed
				setLoading(false)
				return { success: false, message: result.message }
			}
		} catch (error) {
			console.error('❌ Registration error:', error)
			setLoading(false)
			return { success: false, message: error.message || 'Registration failed' }
		}
	}

	// Hàm gọi khi đăng xuất
	const logout = async () => {
		try {
			// 🚀 Call real logout API (blacklist tokens)
			await logoutAPI()
		} catch (error) {
			// Silent error
		} finally {
			// Always clear local state
			setUser(null)
			window.accessToken = null // ✅ Clear access token from memory
			window.currentTenantId = null // ✅ Clear tenant context from memory
			sessionStorage.removeItem('tabSession') // ✅ Clear tab session
			localStorage.removeItem('currentTenantId') // ✅ Clear tenant from storage
			localStorage.removeItem('user') // ✅ Clear user data
			setPendingSignupData(null)
		}
	}

	// 🔄 Khởi tạo authentication khi app load (hỗ trợ F5 refresh)
	useEffect(() => {
		const initializeAuth = async () => {
			const accessToken = window.accessToken
			const savedUser = localStorage.getItem('user')

			// Case 1: Có access token trong memory -> verify nó còn valid
			if (accessToken && savedUser) {
				try {
					console.log('🔍 Verifying existing access token...')
					const result = await getCurrentUserAPI()

					if (result.success) {
						// ✅ Access token còn valid
						const userData = {
							...result.user,
							role: result.user.roles.includes('ADMIN') ? 'Super Administrator' : 'User',
							name: result.user.username,
						}
						setUser(userData)
						console.log('✅ Session restored from access token')
					} else {
						// Access token expired, thử refresh
						console.log('⚠️ Access token expired, attempting refresh...')
						await attemptTokenRefresh()
					}
				} catch (error) {
					await attemptTokenRefresh()
				}
			}
			// Case 2: F5 - Access token mất (window.accessToken = undefined) -> restore từ refresh token cookie
			else if (savedUser) {
				// Check if this is the same tab (F5) or a new tab
				const tabSession = sessionStorage.getItem('tabSession')

				if (tabSession) {
					// ✅ Same tab (F5) - sessionStorage still exists
					console.log(
						'🔄 F5 detected (same tab) - Restoring from refresh token cookie...',
					)
					await attemptTokenRefresh()
				} else {
					// ❌ New tab - sessionStorage cleared by browser
					console.log('🆕 New tab detected - Clearing stale data, login required...')
					localStorage.removeItem('user')
					window.accessToken = null
				}
			}
			// Case 3: Không có gì cả -> user chưa đăng nhập
			else {
				// No session
			}

			setLoading(false)
		}

		// Helper function để thử refresh token
		const attemptTokenRefresh = async () => {
			try {
				const refreshResult = await refreshTokenAPI()

				if (refreshResult.success && refreshResult.user) {
					// ✅ Store access token in memory if provided
					if (refreshResult.accessToken) {
						window.accessToken = refreshResult.accessToken
					}

					// ✅ Use user data directly from refresh response (1 API call instead of 2)
					const roles = refreshResult.user.roles || []
					const userData = {
						...refreshResult.user,
						role: mapUserRole(roles),
						name: refreshResult.user.username || refreshResult.user.email,
						ownerId: refreshResult.user.ownerId || null,
					}
					setUser(userData)
					// ✅ Save user to localStorage for F5 persistence
					localStorage.setItem('user', JSON.stringify(refreshResult.user))
					// ✅ Restore tab session marker
					sessionStorage.setItem('tabSession', Date.now().toString())

					// Restore tenant context if available
					if (refreshResult.user.ownerId) {
						localStorage.setItem('currentTenantId', refreshResult.user.ownerId)
						window.currentTenantId = refreshResult.user.ownerId
					}
				} else {
					// ❌ Refresh token expired or invalid
					window.accessToken = null
					localStorage.removeItem('user')
					sessionStorage.removeItem('tabSession') // ✅ Clear tab session on invalid refresh token
				}
			} catch (error) {
				console.error('❌ Session restore failed:', error)
				window.accessToken = null
				localStorage.removeItem('user')
				sessionStorage.removeItem('tabSession') // ✅ Clear tab session on refresh failure
			}
		}

		initializeAuth()
	}, [])

	const value = {
		user,
		loading,
		login,
		loginWithOwner,
		logout,
		startSignup,
		completeOnboarding,
		pendingSignupData,
	}

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
