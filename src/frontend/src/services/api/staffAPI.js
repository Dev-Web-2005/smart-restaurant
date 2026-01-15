// services/api/staffAPI.js
// Staff Account Management API Service

import apiClient from '../apiClient'

/**
 * Generate a new staff or chef account
 * API: POST /identity/users/generate-account
 * @param {string} role - Role type: 'STAFF' (waiter) or 'CHEF' (kitchen staff)
 * @returns {Promise} Response with generated username and password
 */
export const generateStaffAccountAPI = async (role) => {
	try {
		console.log('📤 Sending request to /identity/users/generate-account with role:', role)
		const response = await apiClient.post('/identity/users/generate-account', {
			role,
		})

		console.log('📥 Raw API response:', response)
		const { code, message, data } = response.data

		// Success: code 200 or 1000
		if (code === 200 || code === 1000) {
			// data contains: { userId, username, password, role }
			console.log('✅ Success! Generated account data:', data)
			return {
				success: true,
				data: {
					userId: data.userId,
					username: data.username,
					password: data.password,
					role: data.role,
				},
				message: message || 'Account generated successfully',
			}
		} else {
			console.error('❌ API returned error code:', code, 'message:', message)
			return {
				success: false,
				message: message || 'Failed to generate account',
			}
		}
	} catch (error) {
		console.error('❌ Generate staff account error:', error)
		console.error('Error details:', {
			message: error.message,
			response: error.response?.data,
			status: error.response?.status,
		})
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to generate staff account',
		}
	}
}

/**
 * Get staff/chef accounts list
 * API: GET /identity/users/staff-chef
 * @param {Object} params - Query parameters
 * @param {string} params.role - Optional: Filter by role ('STAFF' or 'CHEF')
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 100)
 * @param {boolean} params.isActive - Optional: Filter by active status
 * @returns {Promise} Response with list of staff accounts
 */
export const getStaffChefListAPI = async (params = {}) => {
	try {
		const { role, page = 1, limit = 100, isActive } = params

		const queryParams = new URLSearchParams()
		if (role) queryParams.append('role', role)
		queryParams.append('page', page.toString())
		queryParams.append('limit', limit.toString())
		if (isActive !== undefined) queryParams.append('isActive', isActive.toString())

		console.log('📤 Fetching staff/chef list with params:', params)
		const response = await apiClient.get(
			`/identity/users/staff-chef?${queryParams.toString()}`,
		)

		console.log('📥 Raw API response:', response)
		const { code, message, data } = response.data

		// Success: code 200 or 1000
		if (code === 200 || code === 1000) {
			console.log('✅ Success! Staff list data:', data)
			return {
				success: true,
				data: {
					items: data.data || [],
					total: data.total || 0,
					page: data.page || 1,
					limit: data.limit || 100,
					totalPages: data.totalPages || 1,
				},
				message: message || 'Staff list retrieved successfully',
			}
		} else {
			console.error('❌ API returned error code:', code, 'message:', message)
			return {
				success: false,
				data: { items: [], total: 0 },
				message: message || 'Failed to fetch staff list',
			}
		}
	} catch (error) {
		console.error('❌ Get staff list error:', error)
		console.error('Error details:', {
			message: error.message,
			response: error.response?.data,
			status: error.response?.status,
		})
		return {
			success: false,
			data: { items: [], total: 0 },
			message: error.response?.data?.message || 'Failed to fetch staff list',
		}
	}
}

/**
 * Get all staff accounts (alias for getStaffChefListAPI)
 * @returns {Promise} Response with list of staff accounts
 */
export const getAllStaffAccountsAPI = async () => {
	return await getStaffChefListAPI()
}

/**
 * Update staff account (placeholder - not implemented yet in backend)
 * @param {string} userId - User ID to update
 * @param {object} updateData - Data to update
 * @returns {Promise} Response with updated user data
 */
export const updateStaffAccountAPI = async () => {
	// This endpoint may not exist yet
	// TODO: Implement backend endpoint PUT /identity/users/:userId
	return {
		success: true,
		message: 'Feature not implemented yet',
	}
}

/**
 * Toggle staff account active status
 * API: PATCH /identity/users/:userId/status
 * @param {string} userId - User ID to toggle
 * @param {boolean} isActive - New active status
 * @returns {Promise} Response with confirmation
 */
export const toggleStaffStatusAPI = async (userId, isActive) => {
	try {
		console.log(`📤 Toggling user ${userId} status to ${isActive}`)
		const response = await apiClient.patch(`/identity/users/${userId}/status`, {
			isActive,
		})

		console.log('📥 Raw API response:', response)
		const { code, message, data } = response.data

		if (code === 200 || code === 1000) {
			console.log('✅ Success! User status updated:', data)
			return {
				success: true,
				data,
				message: message || 'User status updated successfully',
			}
		} else {
			console.error('❌ API returned error code:', code, 'message:', message)
			return {
				success: false,
				message: message || 'Failed to update user status',
			}
		}
	} catch (error) {
		console.error('❌ Toggle user status error:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to update user status',
		}
	}
}

/**
 * Delete staff account permanently
 * API: DELETE /identity/users/:userId
 * @param {string} userId - User ID to delete
 * @returns {Promise} Response with confirmation
 */
export const deleteStaffAccountAPI = async (userId) => {
	try {
		console.log(`📤 Deleting user ${userId}`)
		const response = await apiClient.delete(`/identity/users/${userId}`)

		console.log('📥 Raw API response:', response)
		const { code, message, data } = response.data

		if (code === 200 || code === 1000) {
			console.log('✅ Success! User deleted:', data)
			return {
				success: true,
				data,
				message: message || 'User deleted successfully',
			}
		} else {
			console.error('❌ API returned error code:', code, 'message:', message)
			return {
				success: false,
				message: message || 'Failed to delete user',
			}
		}
	} catch (error) {
		console.error('❌ Delete user error:', error)
		return {
			success: false,
			message: error.response?.data?.message || 'Failed to delete user',
		}
	}
}
