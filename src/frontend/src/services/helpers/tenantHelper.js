// services/helpers/tenantHelper.js
// Helper functions for tenant management

/**
 * Get current tenant ID from user context
 * For this system, tenantId = userId (each user is their own tenant)
 * @returns {string} Tenant ID or throws error if not found
 */
export const getTenantId = () => {
	try {
		// Try to get from localStorage first
		const userStr = localStorage.getItem('user')
		if (userStr) {
			const user = JSON.parse(userStr)
			// Use userId as tenantId (each user owns their own tables)
			if (user.userId) {
				return user.userId
			}
		}

		// If not found, check window object (set by UserContext)
		if (window.currentTenantId) {
			return window.currentTenantId
		}

		// If still not found, user not logged in
		console.error('❌ TenantId not found - user not logged in')
		throw new Error('User not authenticated. Please login first.')
	} catch (error) {
		console.error('❌ Error getting tenantId:', error)
		throw error
	}
}

/**
 * Set tenant ID to global state
 * Should be called after login
 * @param {string} tenantId - Tenant ID to set
 */
export const setTenantId = (tenantId) => {
	window.currentTenantId = tenantId
}

/**
 * Clear tenant ID from global state
 * Should be called on logout
 */
export const clearTenantId = () => {
	window.currentTenantId = null
}
