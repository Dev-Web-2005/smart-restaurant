// services/api/mockAuthAPI.js
// ============================================================================
// MOCK AUTHENTICATION API - FOR TESTING WITHOUT BACKEND
// ============================================================================
// This file simulates backend API responses for development/testing
// Switch to real authAPI.js when backend is ready

// Mock user database
const MOCK_USERS = [
	{
		userId: 'admin-001',
		username: 'admin',
		email: 'admin@spillproofpos.com',
		password: 'Admin123!', // In real backend, this would be hashed
		roles: ['ADMIN', 'USER'],
		authorities: ['READ', 'WRITE', 'DELETE', 'MANAGE_USERS'],
		profile: {
			fullName: 'Alex Grim',
			phoneNumber: '(555) 123-4567',
			address: '123 Admin Street, City',
		},
	},
	{
		userId: 'user-001',
		username: 'user',
		email: 'user@spillproofpos.com',
		password: 'User123!',
		roles: ['USER'],
		authorities: ['READ', 'WRITE'],
		profile: {
			fullName: 'John Doe',
			phoneNumber: '(555) 987-6543',
			address: '456 User Avenue, Town',
			restaurantName: 'The Gourmet Kitchen',
			restaurantAddress: '789 Restaurant Blvd',
			restaurantPhone: '(555) 111-2222',
		},
	},
	{
		userId: 'tenant-001',
		username: 'restaurant1',
		email: 'owner@restaurant.com',
		password: 'Restaurant123!',
		roles: ['USER'],
		authorities: ['READ', 'WRITE'],
		profile: {
			fullName: 'Maria Garcia',
			phoneNumber: '(555) 333-4444',
			restaurantName: 'The Gourmet Kitchen',
			restaurantAddress: '123 Culinary Lane, Foodie City',
			restaurantPhone: '(555) 123-4567',
		},
	},
]

// Simulate network delay
const delay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

// ============================================================================
// 1. LOGIN API (MOCK)
// ============================================================================
export const loginAPI = async (username, password) => {
	console.log('🔧 MOCK: Login API called with:', { username, password: '***' })

	// Simulate network delay
	await delay(1200)

	// Find user by username
	const user = MOCK_USERS.find((u) => u.username === username)

	// Check credentials
	if (!user || user.password !== password) {
		console.log('❌ MOCK: Login failed - Invalid credentials')
		return {
			success: false,
			message: 'Invalid username or password.',
			errorCode: 1001,
		}
	}

	// Generate mock access token
	const mockAccessToken = `mock-access-token-${user.userId}-${Date.now()}`

	// ✅ Store access token in memory (window.accessToken)
	window.accessToken = mockAccessToken
	// Also save to localStorage for mock persistence
	localStorage.setItem('accessToken', mockAccessToken)

	// Prepare user data (without password)
	const userData = {
		userId: user.userId,
		username: user.username,
		email: user.email,
		roles: user.roles,
		authorities: user.authorities,
	}

	localStorage.setItem('user', JSON.stringify(userData))

	console.log('✅ MOCK: Login successful:', user.username)

	return {
		success: true,
		user: userData,
		accessToken: mockAccessToken, // ✅ Include accessToken in response
		message: 'Login successful',
	}
}

// ============================================================================
// 2. REGISTER API (MOCK)
// ============================================================================
export const registerAPI = async (signupData, onboardingData) => {
	console.log('🔧 MOCK: Register API called')
	console.log('Signup data:', { ...signupData, password: '***' })
	console.log('Onboarding data:', onboardingData)

	// Simulate network delay
	await delay(1500)

	// Check if username already exists
	const existingUser = MOCK_USERS.find((u) => u.username === signupData.username)
	if (existingUser) {
		console.log('❌ MOCK: Registration failed - Username exists')
		return {
			success: false,
			message: 'Username or email already exists. Please use a different one.',
			errorCode: 2002,
		}
	}

	// Create new user
	const newUser = {
		userId: `user-${Date.now()}`,
		username: signupData.username,
		email: signupData.email,
		password: signupData.password,
		roles: ['USER'],
		authorities: ['READ', 'WRITE'],
		profile: {
			fullName: signupData.fullName || '',
			phoneNumber: signupData.phoneNumber || '',
			address: signupData.address || '',
			restaurantName: onboardingData.restaurantName || '',
			restaurantAddress: onboardingData.address || '',
			restaurantPhone: onboardingData.phone || '',
			cardholderName: onboardingData.cardholderName || '',
			accountNumber: onboardingData.accountNumber || '',
		},
	}

	// Add to mock database
	MOCK_USERS.push(newUser)

	console.log('✅ MOCK: Registration successful:', newUser.username)

	return {
		success: true,
		user: {
			userId: newUser.userId,
			username: newUser.username,
			email: newUser.email,
			roles: newUser.roles,
			authorities: newUser.authorities,
		},
		message: 'User registered successfully',
	}
}

// ============================================================================
// 3. LOGOUT API (MOCK)
// ============================================================================
export const logoutAPI = async () => {
	console.log('🔧 MOCK: Logout API called')

	// Simulate network delay
	await delay(500)

	// Clear localStorage
	localStorage.removeItem('accessToken')
	localStorage.removeItem('user')

	console.log('✅ MOCK: Logout successful')

	return {
		success: true,
		message: 'Logout successful',
	}
}

// ============================================================================
// 4. GET CURRENT USER API (MOCK)
// ============================================================================
export const getCurrentUserAPI = async () => {
	console.log('🔧 MOCK: Get current user API called')

	// Simulate network delay
	await delay(800)

	// Check if user exists in localStorage
	const savedUser = localStorage.getItem('user')
	const accessToken = localStorage.getItem('accessToken')

	if (!savedUser || !accessToken) {
		console.log('❌ MOCK: No valid session')
		return {
			success: false,
			message: 'No valid session',
			errorCode: 1004,
		}
	}

	const userData = JSON.parse(savedUser)

	console.log('✅ MOCK: User data fetched:', userData.username)

	return {
		success: true,
		user: userData,
	}
}

// ============================================================================
// 5. REFRESH TOKEN API (MOCK)
// ============================================================================
export const refreshTokenAPI = async () => {
	console.log('🔧 MOCK: Refresh token API called')

	// Simulate network delay
	await delay(600)

	const savedUser = localStorage.getItem('user')

	if (!savedUser) {
		console.log('❌ MOCK: No user to refresh token for')
		return {
			success: false,
			message: 'Session expired. Please login again.',
		}
	}

	const userData = JSON.parse(savedUser)

	// Generate new mock access token
	const newAccessToken = `mock-access-token-${userData.userId}-${Date.now()}`

	// ✅ Store access token in memory (window.accessToken)
	window.accessToken = newAccessToken
	localStorage.setItem('accessToken', newAccessToken)

	console.log('✅ MOCK: Token refreshed')

	return {
		success: true,
		accessToken: newAccessToken,
		user: userData, // ✅ Include user data (match real API structure)
	}
}

// ============================================================================
// HELPER: Get all mock users (for debugging)
// ============================================================================
export const getMockUsers = () => {
	return MOCK_USERS.map((u) => ({
		username: u.username,
		password: u.password,
		role: u.roles.includes('ADMIN') ? 'Admin' : 'User',
	}))
}

// ============================================================================
// EXPORT NOTE
// ============================================================================
console.log(`
🔧 MOCK AUTH API LOADED
Available test accounts:
${MOCK_USERS.map(
	(u) => `
  - Username: ${u.username}
    Password: ${u.password}
    Role: ${u.roles.includes('ADMIN') ? 'Admin' : 'User'}`,
).join('')}
`)
