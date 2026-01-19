// services/api/adminUserAPI.js
// Admin User Management API Service - Identity Service via API Gateway
// For Super Admin to manage all users on the platform

import apiClient from '../apiClient'

/**
 * Get users by role with pagination and status filter (ADMIN only)
 * @param {string} role - Role name: USER, STAFF, CHEF, CUSTOMER, ADMIN
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter: 'all', 'active', 'inactive' (default: 'all')
 * @param {number} params.page - Page number, 1-indexed (default: 1)
 * @param {number} params.limit - Items per page (default: 10)
 * @returns {Promise} Paginated users response
 */
export const getUsersByRoleAPI = async (role, params = {}) => {
	try {
		const { status = 'all', page = 1, limit = 10 } = params

		const response = await apiClient.get(`/identity/users/by-role/${role}`, {
			params: {
				status,
				page,
				limit,
			},
		})

		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				users: data.data || [],
				pagination: {
					total: data.total || 0,
					page: data.page || 1,
					limit: data.limit || 10,
					totalPages: data.totalPages || 1,
				},
				message,
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to fetch users',
				users: [],
				pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
			}
		}
	} catch (error) {
		console.error('❌ getUsersByRoleAPI error:', error)
		return {
			success: false,
			message:
				error?.response?.data?.message || error?.message || 'Failed to fetch users',
			users: [],
			pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
		}
	}
}

/**
 * Get all users (ADMIN only) - No pagination
 * @returns {Promise} All users response
 */
export const getAllUsersAPI = async () => {
	try {
		const response = await apiClient.get('/identity/users')

		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				users: data || [],
				message,
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to fetch all users',
				users: [],
			}
		}
	} catch (error) {
		console.error('❌ getAllUsersAPI error:', error)
		return {
			success: false,
			message:
				error?.response?.data?.message || error?.message || 'Failed to fetch all users',
			users: [],
		}
	}
}

/**
 * Deactivate (soft delete) a user (ADMIN only)
 * Cannot deactivate users with ADMIN role
 * @param {string} targetUserId - The user ID to deactivate
 * @returns {Promise} Deactivation result
 */
export const deactivateUserAPI = async (targetUserId) => {
	try {
		const response = await apiClient.patch(`/identity/users/${targetUserId}/deactivate`)

		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				userId: data.userId,
				isActive: data.isActive,
				message: message || 'User deactivated successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to deactivate user',
			}
		}
	} catch (error) {
		console.error('❌ deactivateUserAPI error:', error)
		const errorMessage =
			error?.response?.data?.message || error?.message || 'Failed to deactivate user'
		return {
			success: false,
			message: errorMessage,
		}
	}
}

/**
 * Restore (reactivate) a user (ADMIN only)
 * @param {string} targetUserId - The user ID to restore
 * @returns {Promise} Restoration result
 */
export const restoreUserAPI = async (targetUserId) => {
	try {
		const response = await apiClient.patch(`/identity/users/${targetUserId}/restore`)

		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				userId: data.userId,
				isActive: data.isActive,
				message: message || 'User restored successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to restore user',
			}
		}
	} catch (error) {
		console.error('❌ restoreUserAPI error:', error)
		const errorMessage =
			error?.response?.data?.message || error?.message || 'Failed to restore user'
		return {
			success: false,
			message: errorMessage,
		}
	}
}

/**
 * Toggle user status (activate/deactivate) based on current status
 * @param {string} targetUserId - The user ID to toggle
 * @param {boolean} currentIsActive - Current active status
 * @returns {Promise} Toggle result
 */
export const toggleUserStatusAPI = async (targetUserId, currentIsActive) => {
	if (currentIsActive) {
		return await deactivateUserAPI(targetUserId)
	} else {
		return await restoreUserAPI(targetUserId)
	}
}
