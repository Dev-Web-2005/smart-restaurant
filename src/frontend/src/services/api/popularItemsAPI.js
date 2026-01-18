// services/api/popularItemsAPI.js
// Popular Items API Service - Product Service via API Gateway

import apiClient from '../apiClient'

// ============ CACHE MANAGEMENT ============
let popularItemsCache = null
let cacheTimestamp = 0
const CACHE_TTL = 120000 // 2 minutes cache

/**
 * Check if cache is valid
 */
const isCacheValid = (tenantId) => {
	if (!popularItemsCache) return false
	if (popularItemsCache.tenantId !== tenantId) return false
	return Date.now() - cacheTimestamp < CACHE_TTL
}

/**
 * Clear popular items cache
 */
export const clearPopularItemsCache = () => {
	popularItemsCache = null
	cacheTimestamp = 0
}

/**
 * Get popular menu items for a tenant
 * GET /tenants/:tenantId/items/popular
 *
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {Object} params - Query parameters
 * @param {number} [params.limit=6] - Number of items to fetch (max: 100)
 * @param {string} [params.categoryId] - Optional filter by category ID
 * @param {boolean} [params.skipCache=false] - Skip cache and fetch fresh data
 * @returns {Promise<Object>} Response with popular items
 *
 * Backend Response Structure:
 * {
 *   code: 1000,
 *   message: "Popular items retrieved successfully",
 *   data: {
 *     items: [
 *       {
 *         id: string (UUID),
 *         tenantId: string (UUID),
 *         categoryId: string (UUID),
 *         categoryName: string,
 *         name: string,
 *         description: string | null,
 *         price: number,
 *         currency: string,
 *         prepTimeMinutes: number | null,
 *         status: "AVAILABLE" | "UNAVAILABLE" | "SOLD_OUT",
 *         isChefRecommended: boolean,
 *         orderCount: number,  // 🔥 Number of times ordered
 *         photos: [
 *           { id: string, url: string, isPrimary: boolean, displayOrder: number }
 *         ],
 *         createdAt: ISO date string,
 *         updatedAt: ISO date string
 *       }
 *     ],
 *     total: number,
 *     page: 1,
 *     limit: number,
 *     totalPages: 1
 *   }
 * }
 *
 * ✅ PUBLIC API - No authentication required
 * ✅ Only returns items with orderCount > 0 and status = AVAILABLE
 * ✅ Items sorted by orderCount DESC (most popular first)
 */
export const getPopularItemsAPI = async (tenantId, params = {}) => {
	try {
		// Validate tenantId
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		const limit = params.limit || 6
		const skipCache = params.skipCache || false

		// Check cache first (unless skipCache is true or categoryId is specified)
		if (!skipCache && !params.categoryId && isCacheValid(tenantId)) {
			console.log('📦 Returning cached popular items')
			return popularItemsCache.data
		}

		// Build query parameters
		const queryParams = new URLSearchParams()
		queryParams.append('limit', Math.min(limit, 100))

		if (params.categoryId && typeof params.categoryId === 'string') {
			queryParams.append('categoryId', params.categoryId.trim())
		}

		const url = `/tenants/${tenantId}/items/popular?${queryParams.toString()}`

		console.log('📥 Fetching popular items:', url)
		const response = await apiClient.get(url)

		const { code, message, data } = response.data

		// Backend returns code 1000 for success
		if (code === 1000 || code === 200) {
			const result = {
				success: true,
				items: data?.items || [],
				total: data?.total || 0,
				message,
			}

			// Cache the result (only if no categoryId filter)
			if (!params.categoryId) {
				popularItemsCache = {
					tenantId,
					data: result,
				}
				cacheTimestamp = Date.now()
			}

			console.log('✅ Popular items fetched:', result.items.length, 'items')
			return result
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				items: [],
				total: 0,
				message: message || 'Failed to fetch popular items',
			}
		}
	} catch (error) {
		console.error('❌ Get popular items error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to load popular items.'

		switch (errorCode) {
			case 2000:
				userMessage = 'Restaurant not found.'
				break
			case 9002:
				userMessage = 'Cannot connect to server.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			items: [],
			total: 0,
			message: userMessage,
			errorCode,
		}
	}
}

export default {
	getPopularItemsAPI,
	clearPopularItemsCache,
}
