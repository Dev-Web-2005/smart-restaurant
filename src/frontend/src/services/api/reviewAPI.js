// services/api/reviewAPI.js
// Review API Service - Product Service via API Gateway

import apiClient from '../apiClient'

// ============ CACHE MANAGEMENT ============
const reviewCache = new Map()
const CACHE_TTL = 60000 // 1 minute cache

/**
 * Get cache key for reviews
 */
const getCacheKey = (tenantId, itemId, page, limit) => {
	return `${tenantId}-${itemId}-${page}-${limit}`
}

/**
 * Check if cache is valid
 */
const isCacheValid = (cacheEntry) => {
	if (!cacheEntry) return false
	return Date.now() - cacheEntry.timestamp < CACHE_TTL
}

/**
 * Clear review cache for a specific item (after creating/updating review)
 */
export const clearReviewCache = (tenantId, itemId) => {
	// Clear all cache entries for this item
	for (const key of reviewCache.keys()) {
		if (key.startsWith(`${tenantId}-${itemId}-`)) {
			reviewCache.delete(key)
		}
	}
}

/**
 * Get reviews for a menu item
 * GET /tenants/:tenantId/items/:itemId/reviews
 *
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {string} itemId - Menu Item ID (UUID format)
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Items per page
 * @param {boolean} [params.skipCache=false] - Skip cache and fetch fresh data
 * @returns {Promise<Object>} Response with reviews, pagination, and averageRating
 *
 * ✅ PUBLIC API - No authentication required
 * ✅ Both logged-in users and guests can view reviews
 */
export const getReviewsAPI = async (tenantId, itemId, params = {}) => {
	try {
		// Validate required params
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Item ID is required and must be a string')
		}

		const page = params.page || 1
		const limit = params.limit || 10
		const skipCache = params.skipCache || false

		// Check cache first (unless skipCache is true)
		const cacheKey = getCacheKey(tenantId, itemId, page, limit)
		if (!skipCache) {
			const cached = reviewCache.get(cacheKey)
			if (isCacheValid(cached)) {
				console.log('📦 Returning cached reviews for item:', itemId)
				return cached.data
			}
		}

		// Build URL
		const queryParams = new URLSearchParams()
		queryParams.append('page', page)
		queryParams.append('limit', limit)

		const url = `/tenants/${tenantId}/items/${itemId}/reviews?${queryParams.toString()}`

		console.log('📥 Fetching reviews:', url)
		const response = await apiClient.get(url)

		const { code, message, data } = response.data

		// Backend returns code 200 or 1000 for success
		if (code === 1000 || code === 200) {
			const result = {
				success: true,
				reviews: data?.reviews || [],
				total: data?.total || 0,
				page: data?.page || 1,
				limit: data?.limit || 10,
				totalPages: data?.totalPages || 0,
				averageRating: data?.averageRating || 0,
				message,
			}

			// Cache the result
			reviewCache.set(cacheKey, {
				data: result,
				timestamp: Date.now(),
			})

			console.log(
				'✅ Reviews fetched:',
				result.total,
				'total,',
				result.reviews.length,
				'on page',
				page,
			)
			return result
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				reviews: [],
				total: 0,
				averageRating: 0,
				message: message || 'Failed to fetch reviews',
			}
		}
	} catch (error) {
		console.error('❌ Get reviews error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to load reviews. Please try again.'

		switch (errorCode) {
			case 2000:
				userMessage = 'Tenant not found.'
				break
			case 2904:
				userMessage = 'Menu item not found.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			reviews: [],
			total: 0,
			averageRating: 0,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Create or update a review for a menu item
 * POST /tenants/:tenantId/items/:itemId/reviews
 *
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {string} itemId - Menu Item ID (UUID format)
 * @param {Object} reviewData - Review data
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} [reviewData.comment] - Optional comment
 * @returns {Promise<Object>} Response with created/updated review
 *
 * ⚠️ AUTHENTICATED API - Requires valid JWT token
 * ❌ Guests CANNOT create reviews - must be logged in
 *
 * Note: Backend automatically gets userId and userName from JWT token
 */
export const createReviewAPI = async (tenantId, itemId, reviewData) => {
	try {
		// Validate required params
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Item ID is required and must be a string')
		}

		// Validate rating
		if (reviewData.rating === undefined || reviewData.rating === null) {
			throw new Error('Rating is required')
		}
		const rating = Number(reviewData.rating)
		if (isNaN(rating) || rating < 1 || rating > 5) {
			throw new Error('Rating must be between 1 and 5')
		}

		// Check authentication
		const customerAuth = localStorage.getItem('customerAuth')
		const isGuest = localStorage.getItem('isGuestMode') === 'true'

		if (isGuest || !customerAuth) {
			return {
				success: false,
				message: 'Please login to write a review',
				requiresLogin: true,
			}
		}

		// Parse customer auth to get userId and userName
		let userId, userName
		try {
			const authData = JSON.parse(customerAuth)
			userId = authData.userId
			userName = authData.username || authData.email || 'Customer'
		} catch (e) {
			console.error('Failed to parse customerAuth:', e)
			return {
				success: false,
				message: 'Authentication error. Please login again.',
				requiresLogin: true,
			}
		}

		if (!userId) {
			return {
				success: false,
				message: 'User session invalid. Please login again.',
				requiresLogin: true,
			}
		}

		const url = `/tenants/${tenantId}/items/${itemId}/reviews`
		const body = {
			rating: rating,
			comment: reviewData.comment?.trim() || '',
			userId,
			userName,
		}

		console.log('📤 Creating review:', url, body)
		const response = await apiClient.post(url, body)

		const { code, message, data } = response.data

		// Backend returns code 200 or 1000 for success
		if (code === 1000 || code === 200) {
			// Clear cache for this item after creating review
			clearReviewCache(tenantId, itemId)

			console.log('✅ Review created/updated successfully')
			return {
				success: true,
				review: data,
				message: message || 'Review submitted successfully',
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				message: message || 'Failed to submit review',
			}
		}
	} catch (error) {
		console.error('❌ Create review error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to submit review. Please try again.'

		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				return {
					success: false,
					message: userMessage,
					requiresLogin: true,
				}
			case 2000:
				userMessage = 'Tenant not found.'
				break
			case 2904:
				userMessage = 'Menu item not found.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			message: userMessage,
			errorCode,
		}
	}
}

export default {
	getReviewsAPI,
	createReviewAPI,
	clearReviewCache,
}
