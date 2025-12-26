// services/api/publicMenuAPI.js
// Public Menu API Service - No authentication required

import apiClient from '../apiClient'

/**
 * Get public menu for a tenant (accessible without authentication)
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {Object} params - Query parameters
 * @param {string} [params.categoryId] - Filter by category ID
 * @param {string} [params.search] - Search by item name
 * @param {boolean} [params.isChefRecommended] - Filter by chef recommended
 * @param {string} [params.sortBy] - Sort field: "createdAt" | "price" | "name" | "popularity"
 * @param {string} [params.sortOrder] - Sort order: "ASC" | "DESC"
 * @param {number} [params.page] - Page number for pagination (if provided, returns flat list)
 * @param {number} [params.limit] - Items per page (if provided, returns flat list)
 * @returns {Promise<Object>} Response with categories grouped or flat items list
 */
export const getPublicMenuAPI = async (tenantId, params = {}) => {
	try {
		// Validate tenantId
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		// Build query parameters
		const queryParams = new URLSearchParams()

		if (params.categoryId && typeof params.categoryId === 'string') {
			queryParams.append('categoryId', params.categoryId.trim())
		}

		if (params.search && typeof params.search === 'string') {
			queryParams.append('search', params.search.trim())
		}

		if (params.isChefRecommended !== undefined) {
			queryParams.append('isChefRecommended', Boolean(params.isChefRecommended))
		}

		if (params.sortBy) {
			const validSortBy = ['createdAt', 'price', 'name', 'popularity']
			if (!validSortBy.includes(params.sortBy)) {
				throw new Error('Invalid sortBy field')
			}
			queryParams.append('sortBy', params.sortBy)
		}

		if (params.sortOrder) {
			const validSortOrder = ['ASC', 'DESC']
			const sortOrder = params.sortOrder.toUpperCase()
			if (!validSortOrder.includes(sortOrder)) {
				throw new Error('Sort order must be ASC or DESC')
			}
			queryParams.append('sortOrder', sortOrder)
		}

		if (params.page !== undefined) {
			const page = Number(params.page)
			if (!isNaN(page) && page > 0) {
				queryParams.append('page', page)
			}
		}

		if (params.limit !== undefined) {
			const limit = Number(params.limit)
			if (!isNaN(limit) && limit > 0) {
				queryParams.append('limit', limit)
			}
		}

		const queryString = queryParams.toString()
		const url = `/public/menu/${tenantId}${queryString ? `?${queryString}` : ''}`

		console.log('📥 Fetching public menu:', url)
		const response = await apiClient.get(url)

		const { code, message, data } = response.data

		if (code === 1000) {
			// Check if response is paginated (flat list) or grouped by categories
			const isPaginated = data.items && data.total !== undefined

			if (isPaginated) {
				// Paginated/filtered response
				console.log(
					'✅ Public menu items fetched successfully:',
					data.items.length,
					'items',
				)
				return {
					success: true,
					items: data.items || [],
					pagination: {
						total: data.total,
						page: data.page,
						limit: data.limit,
						totalPages: data.totalPages,
					},
					message,
				}
			} else {
				// Grouped by categories
				console.log(
					'✅ Public menu fetched successfully:',
					data.categories?.length || 0,
					'categories',
				)
				return {
					success: true,
					categories: data.categories || [],
					tenantId: data.tenantId,
					message,
				}
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				items: [],
				categories: [],
				message: message || 'Failed to fetch public menu',
			}
		}
	} catch (error) {
		console.error('❌ Get public menu error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to load menu. Please try again.'

		switch (errorCode) {
			case 2000:
				userMessage = 'Restaurant not found.'
				break
			case 2903:
				userMessage = 'Category not found.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			items: [],
			categories: [],
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Get public menu for a specific category
 * @param {string} tenantId - Tenant ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Response with items in the category
 */
export const getPublicMenuByCategoryAPI = async (tenantId, categoryId) => {
	return getPublicMenuAPI(tenantId, { categoryId })
}

/**
 * Search public menu items
 * @param {string} tenantId - Tenant ID
 * @param {string} searchQuery - Search query
 * @param {Object} additionalParams - Additional filter params
 * @returns {Promise<Object>} Response with matching items
 */
export const searchPublicMenuAPI = async (
	tenantId,
	searchQuery,
	additionalParams = {},
) => {
	return getPublicMenuAPI(tenantId, {
		search: searchQuery,
		page: 1,
		limit: 50,
		...additionalParams,
	})
}
