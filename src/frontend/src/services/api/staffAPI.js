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
 * Get all staff accounts (placeholder - not implemented yet in backend)
 * @returns {Promise} Response with list of staff accounts
 */
export const getAllStaffAccountsAPI = async () => {
	// This endpoint may not exist yet - using mock for now
	// TODO: Implement backend endpoint /identity/users/staff
	return {
		success: true,
		data: [],
		message: 'Feature not implemented yet',
	}
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
 * Delete/disable staff account (placeholder - not implemented yet in backend)
 * @param {string} userId - User ID to delete/disable
 * @returns {Promise} Response with confirmation
 */
export const deleteStaffAccountAPI = async () => {
	// This endpoint may not exist yet
	// TODO: Implement backend endpoint DELETE /identity/users/:userId
	return {
		success: true,
		message: 'Feature not implemented yet',
	}
}
