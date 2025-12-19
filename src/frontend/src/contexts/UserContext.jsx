// context/UserContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react'

// Toggle between mock and real API
const USE_MOCK_API = false

// Import from mock or real API
import * as mockAPI from '../services/api/mockAuthAPI'
import * as realAPI from '../services/api/authAPI'

const { loginAPI, logoutAPI, registerAPI, getCurrentUserAPI } = USE_MOCK_API
	? mockAPI
	: realAPI

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
				const userData = {
					...result.user,
					role: result.user.roles.includes('ADMIN') ? 'Super Administrator' : 'User',
					name: result.user.username,
				}
				setUser(userData)
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
					setUser({
						...loginResult.user,
						role: loginResult.user.roles.includes('ADMIN')
							? 'Super Administrator'
							: 'User',
						name: loginResult.user.username,
					})
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
			setPendingSignupData(null)
		}
	}

	// Hàm này sẽ fetch thông tin người dùng khi ứng dụng load (dựa trên token)
	useEffect(() => {
		const initializeAuth = async () => {
			const accessToken = window.accessToken
			const savedUser = localStorage.getItem('user')

			if (accessToken && savedUser) {
				try {
					// 🚀 Fetch current user from backend
					const result = await getCurrentUserAPI()

					if (result.success) {
						// ✅ Valid session
						const userData = {
							...result.user,
							role: result.user.roles.includes('ADMIN') ? 'Super Administrator' : 'User',
							name: result.user.username,
						}
						setUser(userData)
					} else {
						// ❌ Invalid session - clear storage
						window.accessToken = null
						localStorage.removeItem('user')
					}
				} catch (error) {
					console.error('Failed to fetch user profile', error)
					// Clear invalid session
					window.accessToken = null
					localStorage.removeItem('user')
				}
			}

			setLoading(false)
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
