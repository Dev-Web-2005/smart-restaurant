// services/api/floorAPI.js
// Floor Management API Service - Floor Service via API Gateway
// Last Updated: 19/12/2025

/**
 * API STATUS (Updated: 19/12/2025)
 *
 * ✅ WORKING - Backend fully implemented (6 APIs):
 *    FLOOR MANAGEMENT:
 *    - getFloorsAPI: GET /tenants/:tenantId/floors (list all floors)
 *    - createFloorAPI: POST /tenants/:tenantId/floors (create new floor)
 *    - getFloorByIdAPI: GET /tenants/:tenantId/floors/:floorId (get single floor)
 *    - updateFloorAPI: PATCH /tenants/:tenantId/floors/:floorId (update floor)
 *    - deleteFloorAPI: DELETE /tenants/:tenantId/floors/:floorId (soft delete - set isActive=false)
 *    - deleteFloorPermanentAPI: DELETE /tenants/:tenantId/floors/:floorId/permanent (hard delete)
 *
 * 🔐 AUTHENTICATION:
 *    - tenantId = userId (each user is their own tenant)
 *    - window.currentTenantId set after login
 *    - All APIs require valid JWT token in Authorization header
 *
 * 📋 FIELD MAPPING:
 *    - Backend: UUID strings for id, tenantId
 *    - CreateFloorDto: name (required), floorNumber (required), gridWidth, gridHeight, description (optional)
 *    - UpdateFloorDto: All fields optional
 *    - ListFloorsDto: tenantId (required), isActive (optional)
 *    - Backend returns Array<FloorDto> directly for list
 */

import apiClient from '../apiClient'
import { getTenantId } from '../helpers/tenantHelper'

/**
 * Get all floors for the current tenant
 * @param {Object} options - Query options
 * @param {boolean} options.isActive - Filter by active status (default: true)
 * @returns {Promise<Array>} Array of FloorDto objects
 */
export const getFloorsAPI = async (options = {}) => {
	try {
		const tenantId = getTenantId()
		if (!tenantId) {
			throw new Error('Tenant ID is required. Please log in again.')
		}

		const params = {}
		if (options.isActive !== undefined) {
			params.isActive = options.isActive
		}

		console.log('📋 GET /tenants/:tenantId/floors', { tenantId, params })

		const response = await apiClient.get(`/tenants/${tenantId}/floors`, { params })

		console.log('✅ getFloorsAPI response:', response.data)
		console.log('✅ getFloorsAPI response type:', typeof response.data)
		console.log('✅ getFloorsAPI response keys:', Object.keys(response.data))
		console.log('✅ Is array?:', Array.isArray(response.data))

		// Check if response is wrapped in an object
		if (
			response.data &&
			typeof response.data === 'object' &&
			!Array.isArray(response.data)
		) {
			// Try common wrapper keys
			if (Array.isArray(response.data.floors)) {
				console.log('✅ Found floors in response.data.floors')
				return response.data.floors
			}
			if (Array.isArray(response.data.data)) {
				console.log('✅ Found floors in response.data.data')
				return response.data.data
			}
			if (Array.isArray(response.data.items)) {
				console.log('✅ Found floors in response.data.items')
				return response.data.items
			}
		}

		// Backend returns Array<FloorDto> directly
		return response.data
	} catch (error) {
		console.error('❌ getFloorsAPI error:', error)
		if (error.response?.status === 401) {
			throw new Error('Unauthorized. Please log in again.')
		}
		throw error
	}
}

/**
 * Create a new floor
 * @param {Object} floorData - Floor data
 * @param {string} floorData.name - Floor name (required, max 50 chars)
 * @param {number} floorData.floorNumber - Floor number (required, >= 0)
 * @param {number} floorData.gridWidth - Grid width/columns (optional, default 10)
 * @param {number} floorData.gridHeight - Grid height/rows (optional, default 10)
 * @param {string} floorData.description - Floor description (optional)
 * @returns {Promise<Object>} Response with success flag and FloorDto
 */
export const createFloorAPI = async (floorData) => {
	try {
		const tenantId = getTenantId()
		if (!tenantId) {
			throw new Error('Tenant ID is required. Please log in again.')
		}

		const payload = {
			name: floorData.name,
			floorNumber: floorData.floorNumber,
			gridWidth: floorData.gridWidth || 10,
			gridHeight: floorData.gridHeight || 10,
		}

		if (floorData.description) {
			payload.description = floorData.description
		}

		console.log('📤 POST /tenants/:tenantId/floors', { tenantId, payload })

		const response = await apiClient.post(`/tenants/${tenantId}/floors`, payload)

		console.log('✅ createFloorAPI response:', response.data)

		return {
			success: true,
			floor: response.data,
		}
	} catch (error) {
		console.error('❌ createFloorAPI error:', error)
		if (error.response?.status === 401) {
			throw new Error('Unauthorized. Please log in again.')
		}
		if (error.response?.status === 400) {
			throw new Error(error.response.data.message || 'Invalid floor data')
		}
		throw error
	}
}

/**
 * Get a single floor by ID
 * @param {string} floorId - Floor UUID
 * @returns {Promise<Object>} FloorDto object
 */
export const getFloorByIdAPI = async (floorId) => {
	try {
		const tenantId = getTenantId()
		if (!tenantId) {
			throw new Error('Tenant ID is required. Please log in again.')
		}

		console.log('📋 GET /tenants/:tenantId/floors/:floorId', { tenantId, floorId })

		const response = await apiClient.get(`/tenants/${tenantId}/floors/${floorId}`)

		console.log('✅ getFloorByIdAPI response:', response.data)

		return response.data
	} catch (error) {
		console.error('❌ getFloorByIdAPI error:', error)
		if (error.response?.status === 401) {
			throw new Error('Unauthorized. Please log in again.')
		}
		if (error.response?.status === 404) {
			throw new Error('Floor not found')
		}
		throw error
	}
}

/**
 * Update a floor
 * @param {string} floorId - Floor UUID
 * @param {Object} updates - Fields to update
 * @param {string} updates.name - Floor name (optional)
 * @param {number} updates.floorNumber - Floor number (optional)
 * @param {number} updates.gridWidth - Grid width (optional)
 * @param {number} updates.gridHeight - Grid height (optional)
 * @param {string} updates.description - Description (optional)
 * @param {boolean} updates.isActive - Active status (optional)
 * @returns {Promise<Object>} Response with success flag and updated FloorDto
 */
export const updateFloorAPI = async (floorId, updates) => {
	try {
		const tenantId = getTenantId()
		if (!tenantId) {
			throw new Error('Tenant ID is required. Please log in again.')
		}

		const payload = {}
		if (updates.name !== undefined) payload.name = updates.name
		if (updates.floorNumber !== undefined) payload.floorNumber = updates.floorNumber
		if (updates.gridWidth !== undefined) payload.gridWidth = updates.gridWidth
		if (updates.gridHeight !== undefined) payload.gridHeight = updates.gridHeight
		if (updates.description !== undefined) payload.description = updates.description
		if (updates.isActive !== undefined) payload.isActive = updates.isActive

		console.log('📤 PATCH /tenants/:tenantId/floors/:floorId', {
			tenantId,
			floorId,
			payload,
		})

		const response = await apiClient.patch(
			`/tenants/${tenantId}/floors/${floorId}`,
			payload,
		)

		console.log('✅ updateFloorAPI response:', response.data)

		return {
			success: true,
			floor: response.data,
		}
	} catch (error) {
		console.error('❌ updateFloorAPI error:', error)
		if (error.response?.status === 401) {
			throw new Error('Unauthorized. Please log in again.')
		}
		if (error.response?.status === 404) {
			throw new Error('Floor not found')
		}
		throw error
	}
}

/**
 * Soft delete a floor (set isActive = false)
 * @param {string} floorId - Floor UUID
 * @returns {Promise<Object>} Response with success flag
 */
export const deleteFloorAPI = async (floorId) => {
	try {
		const tenantId = getTenantId()
		if (!tenantId) {
			throw new Error('Tenant ID is required. Please log in again.')
		}

		console.log('📤 DELETE /tenants/:tenantId/floors/:floorId', { tenantId, floorId })

		const response = await apiClient.delete(`/tenants/${tenantId}/floors/${floorId}`)

		console.log('✅ deleteFloorAPI response:', response.data)

		return {
			success: true,
			message: 'Floor deleted successfully (soft delete)',
		}
	} catch (error) {
		console.error('❌ deleteFloorAPI error:', error)
		if (error.response?.status === 401) {
			throw new Error('Unauthorized. Please log in again.')
		}
		if (error.response?.status === 404) {
			throw new Error('Floor not found')
		}
		throw error
	}
}

/**
 * Permanently delete a floor (hard delete)
 * @param {string} floorId - Floor UUID
 * @returns {Promise<Object>} Response with success flag
 */
export const deleteFloorPermanentAPI = async (floorId) => {
	try {
		const tenantId = getTenantId()
		if (!tenantId) {
			throw new Error('Tenant ID is required. Please log in again.')
		}

		console.log('📤 DELETE /tenants/:tenantId/floors/:floorId/permanent', {
			tenantId,
			floorId,
		})

		const response = await apiClient.delete(
			`/tenants/${tenantId}/floors/${floorId}/permanent`,
		)

		console.log('✅ deleteFloorPermanentAPI response:', response.data)

		return {
			success: true,
			message: 'Floor permanently deleted',
		}
	} catch (error) {
		console.error('❌ deleteFloorPermanentAPI error:', error)
		if (error.response?.status === 401) {
			throw new Error('Unauthorized. Please log in again.')
		}
		if (error.response?.status === 404) {
			throw new Error('Floor not found')
		}
		throw error
	}
}
