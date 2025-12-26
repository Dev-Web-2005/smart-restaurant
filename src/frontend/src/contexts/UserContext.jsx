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

const { loginAPI, logoutAPI, registerAPI, getCurrentUserAPI, refreshTokenAPI } =
	USE_MOCK_API && mockAPI ? mockAPI : realAPI

const UserContext = createContext()

export const useUser = () => useContext(UserContext)

export const UserProvider = ({ children }) => {
	const [user, setUser] = useState(null)
	const [loading, setLoading] = useState(true)

	// State lưu dữ liệu signup tạm thời
	const [pendingSignupData, setPendingSignupData] = useState(null)

	// Login function
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
					role: result.user.roles.includes('ADMIN') ? 'Super Administrator' : 'User',
					name: result.user.username,
				}
				setUser(userData)
				// ✅ Save user to localStorage for F5 persistence
				localStorage.setItem('user', JSON.stringify(result.user))
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
				// Note: Backend does NOT auto-login after registration
				// We need to login manually with username/password
				const loginResult = await loginAPI(
					pendingSignupData.username,
					pendingSignupData.password,
				)

				if (loginResult.success) {
					// ✅ Store access token in memory if provided
					if (loginResult.accessToken) {
						window.accessToken = loginResult.accessToken
					}

					const userData = {
						...loginResult.user,
						role: loginResult.user.roles.includes('ADMIN')
							? 'Super Administrator'
							: 'User',
						name: loginResult.user.username,
					}
					setUser(userData)
					// ✅ Save user to localStorage for F5 persistence
					localStorage.setItem('user', JSON.stringify(loginResult.user))
					setPendingSignupData(null) // Clear pending data
					setLoading(false)
					return { success: true, message: 'Registration and login successful!' }
				} else {
					// Registration OK but auto-login failed
					setPendingSignupData(null)
					setLoading(false)
					return {
						success: true,
						message: 'Registration successful! Please login with your credentials.',
						requireLogin: true,
					}
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
			console.error('Logout error:', error)
		} finally {
			// Always clear local state
			setUser(null)
			window.accessToken = null // ✅ Clear access token from memory
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
					console.error('❌ Token verification failed:', error)
					await attemptTokenRefresh()
				}
			}
			// Case 2: F5 - Access token mất (window.accessToken = undefined) -> restore từ refresh token cookie
			else if (savedUser) {
				console.log(
					'🔄 F5 detected - No access token in memory, restoring from refresh token cookie...',
				)
				await attemptTokenRefresh()
			}
			// Case 3: Không có gì cả -> user chưa đăng nhập
			else {
				console.log('ℹ️ No session found')
			}

			setLoading(false)
		}

		// Helper function để thử refresh token
		const attemptTokenRefresh = async () => {
			try {
				const refreshResult = await refreshTokenAPI()

				console.log('🔍 Refresh API result:', {
					success: refreshResult.success,
					hasUser: !!refreshResult.user,
					hasAccessToken: !!refreshResult.accessToken,
					user: refreshResult.user,
				})

				if (refreshResult.success && refreshResult.user) {
					// ✅ Store access token in memory if provided
					if (refreshResult.accessToken) {
						window.accessToken = refreshResult.accessToken
						console.log(
							'✅ Access token stored from refresh:',
							`${refreshResult.accessToken.substring(0, 30)}...`,
						)
					}

					console.log('✅ Session restored from refresh token (httpOnly cookie)')

					// ✅ Use user data directly from refresh response (1 API call instead of 2)
					const roles = refreshResult.user.roles || []
					const userData = {
						...refreshResult.user,
						role: roles.includes('ADMIN') ? 'Super Administrator' : 'User',
						name: refreshResult.user.username || refreshResult.user.email,
					}
					setUser(userData)
					// ✅ Save user to localStorage for F5 persistence
					localStorage.setItem('user', JSON.stringify(refreshResult.user))

					// Debug: Verify token is stored
					console.log('🔍 Token check after setUser:', {
						hasToken: !!window.accessToken,
						tokenPreview: window.accessToken
							? `${window.accessToken.substring(0, 20)}...`
							: 'undefined',
					})
				} else {
					// ❌ Refresh token expired or invalid
					console.log('❌ Session expired, please login again')
					window.accessToken = null
					localStorage.removeItem('user')
				}
			} catch (error) {
				console.error('❌ Session restore failed:', error)
				window.accessToken = null
				localStorage.removeItem('user')
			}
		}

		initializeAuth()
	}, [])

	const value = {
		user,
		loading,
		login,
		logout,
		startSignup,
		completeOnboarding,
		pendingSignupData,
	}

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
