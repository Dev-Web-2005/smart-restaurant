// services/api/itemAPI.js
// Menu Item API Service - Product Service via API Gateway

import apiClient from '../apiClient'

/**
 * Get list of menu items for a tenant
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {Object} params - Query parameters
 * @param {string} [params.categoryId] - Filter by category ID
 * @param {string} [params.status] - Filter by status: "AVAILABLE" | "UNAVAILABLE" | "SOLD_OUT"
 * @param {boolean} [params.isChefRecommended] - Filter by chef recommended
 * @param {string} [params.search] - Search by item name
 * @param {string} [params.sortBy] - Sort field: "createdAt" | "price" | "name" | "popularity"
 * @param {string} [params.sortOrder] - Sort order: "ASC" | "DESC"
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<Object>} Response with items array or paginated result
 */
export const getMenuItemsAPI = async (tenantId, params = {}) => {
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

		if (params.status) {
			const validStatuses = ['AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT']
			const status = params.status.toUpperCase()
			if (!validStatuses.includes(status)) {
				throw new Error('Status must be AVAILABLE, UNAVAILABLE, or SOLD_OUT')
			}
			queryParams.append('status', status)
		}

		if (params.isChefRecommended !== undefined) {
			queryParams.append('isChefRecommended', Boolean(params.isChefRecommended))
		}

		if (params.search && typeof params.search === 'string') {
			queryParams.append('search', params.search.trim())
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
		const url = `/tenants/${tenantId}/items${queryString ? `?${queryString}` : ''}`

		console.log('📥 Fetching menu items:', url)
		const response = await apiClient.get(url)

		const { code, message, data } = response.data

		if (code === 1000) {
			console.log(
				'✅ Menu items fetched successfully:',
				data?.items?.length || 0,
				'items',
			)
			return {
				success: true,
				items: data?.items || data || [],
				pagination: data?.total
					? {
							total: data.total,
							page: data.page,
							limit: data.limit,
							totalPages: data.totalPages,
					  }
					: null,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				items: [],
				message: message || 'Failed to fetch menu items',
			}
		}
	} catch (error) {
		console.error('❌ Get menu items error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to load menu items. Please try again.'

		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2000:
				userMessage = 'Tenant not found.'
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
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Create new menu item
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {Object} itemData - Menu item data
 * @param {string} itemData.categoryId - Category ID (UUID, required)
 * @param {string} itemData.name - Item name (2-80 characters, required)
 * @param {string} [itemData.description] - Item description (optional)
 * @param {number} itemData.price - Price (0.01 to 999999, required)
 * @param {string} [itemData.currency] - Currency code (default: "VND")
 * @param {number} [itemData.prepTimeMinutes] - Preparation time (0-240 minutes, optional)
 * @param {string} [itemData.status] - Status: "AVAILABLE" | "UNAVAILABLE" | "SOLD_OUT" (default: "AVAILABLE")
 * @param {boolean} [itemData.isChefRecommended] - Chef recommended flag (default: false)
 * @returns {Promise<Object>} Response with created item
 */
export const createMenuItemAPI = async (tenantId, itemData) => {
	try {
		// Validate tenantId
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		// Validate required fields
		if (!itemData.categoryId || typeof itemData.categoryId !== 'string') {
			throw new Error('Category ID is required and must be a string')
		}

		if (!itemData.name || typeof itemData.name !== 'string') {
			throw new Error('Item name is required and must be a string')
		}

		const name = itemData.name.trim()
		if (name.length < 2 || name.length > 80) {
			throw new Error('Item name must be between 2 and 80 characters')
		}

		if (itemData.price === undefined || itemData.price === null) {
			throw new Error('Price is required')
		}

		const price = Number(itemData.price)
		if (isNaN(price) || price < 0.01 || price > 999999) {
			throw new Error('Price must be between 0.01 and 999999')
		}

		// Build request body
		const requestBody = {
			categoryId: itemData.categoryId.trim(),
			name,
			price,
		}

		// Optional: description
		if (itemData.description && typeof itemData.description === 'string') {
			requestBody.description = itemData.description.trim()
		}

		// Optional: currency
		if (itemData.currency && typeof itemData.currency === 'string') {
			requestBody.currency = itemData.currency.trim()
		}

		// Optional: prepTimeMinutes
		if (itemData.prepTimeMinutes !== undefined && itemData.prepTimeMinutes !== null) {
			const prepTime = Number(itemData.prepTimeMinutes)
			if (isNaN(prepTime) || prepTime < 0 || prepTime > 240) {
				throw new Error('Preparation time must be between 0 and 240 minutes')
			}
			requestBody.prepTimeMinutes = Math.floor(prepTime)
		}

		// Optional: status
		if (itemData.status) {
			const validStatuses = ['AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT']
			const status = itemData.status.toUpperCase()
			if (!validStatuses.includes(status)) {
				throw new Error('Status must be AVAILABLE, UNAVAILABLE, or SOLD_OUT')
			}
			requestBody.status = status
		}

		// Optional: isChefRecommended
		if (itemData.isChefRecommended !== undefined) {
			requestBody.isChefRecommended = Boolean(itemData.isChefRecommended)
		}

		const url = `/tenants/${tenantId}/items`
		console.log('📤 Creating menu item:', requestBody)

		const response = await apiClient.post(url, requestBody)

		const { code, message, data } = response.data

		if (code === 1000) {
			console.log('✅ Menu item created successfully:', data)
			return {
				success: true,
				item: data,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				item: null,
				message: message || 'Failed to create menu item',
			}
		}
	} catch (error) {
		console.error('❌ Create menu item error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to create menu item. Please try again.'

		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2000:
				userMessage = 'Tenant not found.'
				break
			case 2903:
				userMessage = 'Category not found.'
				break
			case 2904:
				userMessage = 'Item name already exists in this category.'
				break
			case 2901:
				userMessage = 'Invalid input. Please check your data.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			item: null,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Add photo to menu item
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @param {Object} photoData - Photo data
 * @param {string} photoData.url - Photo URL from cloud storage (required)
 * @param {string} [photoData.filename] - Original filename
 * @param {boolean} [photoData.isPrimary] - Set as primary photo
 * @param {number} [photoData.displayOrder] - Display order
 * @param {string} [photoData.mimeType] - MIME type (e.g., 'image/jpeg')
 * @param {number} [photoData.fileSize] - File size in bytes
 * @returns {Promise<Object>} Response with created photo
 */
export const addMenuItemPhotoAPI = async (tenantId, itemId, photoData) => {
	try {
		// Validate required fields
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Menu item ID is required and must be a string')
		}

		if (!photoData.url || typeof photoData.url !== 'string') {
			throw new Error('Photo URL is required and must be a string')
		}

		// Build request body
		const requestBody = {
			url: photoData.url.trim(),
		}

		if (photoData.filename && typeof photoData.filename === 'string') {
			requestBody.filename = photoData.filename.trim()
		}

		if (photoData.isPrimary !== undefined) {
			requestBody.isPrimary = Boolean(photoData.isPrimary)
		}

		if (photoData.displayOrder !== undefined && photoData.displayOrder !== null) {
			const order = Number(photoData.displayOrder)
			if (!isNaN(order) && order >= 0) {
				requestBody.displayOrder = Math.floor(order)
			}
		}

		if (photoData.mimeType && typeof photoData.mimeType === 'string') {
			requestBody.mimeType = photoData.mimeType.trim()
		}

		if (photoData.fileSize !== undefined && photoData.fileSize !== null) {
			const size = Number(photoData.fileSize)
			if (!isNaN(size) && size > 0) {
				requestBody.fileSize = size
			}
		}

		const url = `/tenants/${tenantId}/items/${itemId}/photos`
		console.log('📤 Adding photo to menu item:', requestBody)

		const response = await apiClient.post(url, requestBody)

		const { code, message, data } = response.data

		if (code === 1000) {
			console.log('✅ Photo added successfully:', data)
			return {
				success: true,
				photo: data,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				photo: null,
				message: message || 'Failed to add photo',
			}
		}
	} catch (error) {
		console.error('❌ Add photo error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to add photo. Please try again.'

		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2905:
				userMessage = 'Menu item not found.'
				break
			case 2907:
				userMessage = 'Photo limit exceeded (maximum 5 photos per item).'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			photo: null,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Get photos for a menu item
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @returns {Promise<Object>} Response with photos array
 */
export const getMenuItemPhotosAPI = async (tenantId, itemId) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Menu item ID is required and must be a string')
		}

		const url = `/tenants/${tenantId}/items/${itemId}/photos`
		console.log('📥 Fetching menu item photos:', url)

		const response = await apiClient.get(url)

		const { code, message, data } = response.data
		console.log('🔍 Get photos raw response:', { code, message, data })

		if (code === 1000) {
			// Backend returns: { menuItemId, photos, primaryPhoto, totalPhotos }
			const photosList = data?.photos || []
			console.log('✅ Photos fetched successfully:', photosList.length, 'photos')
			return {
				success: true,
				photos: photosList,
				primaryPhoto: data?.primaryPhoto,
				totalPhotos: data?.totalPhotos || 0,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				photos: [],
				message: message || 'Failed to fetch photos',
			}
		}
	} catch (error) {
		console.error('❌ Get photos error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message

		return {
			success: false,
			photos: [],
			message: errorMessage || 'Failed to load photos',
			errorCode,
		}
	}
}

/**
 * Set photo as primary for menu item
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @param {string} photoId - Photo ID to set as primary
 * @returns {Promise<Object>} Response with updated photo
 */
export const setPrimaryPhotoAPI = async (tenantId, itemId, photoId) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Menu item ID is required and must be a string')
		}

		if (!photoId || typeof photoId !== 'string') {
			throw new Error('Photo ID is required and must be a string')
		}

		const url = `/tenants/${tenantId}/items/${itemId}/photos/${photoId}/primary`
		console.log('⭐ Setting photo as primary:', url)

		const response = await apiClient.patch(url, {})

		const { code, message, data } = response.data

		if (code === 1000) {
			console.log('✅ Photo set as primary successfully')
			return {
				success: true,
				photo: data,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				photo: null,
				message: message || 'Failed to set primary photo',
			}
		}
	} catch (error) {
		console.error('❌ Set primary photo error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message

		return {
			success: false,
			photo: null,
			message: errorMessage || 'Failed to set primary photo',
			errorCode,
		}
	}
}

/**
 * Delete photo from menu item
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @param {string} photoId - Photo ID
 * @returns {Promise<Object>} Response
 */
export const deleteMenuItemPhotoAPI = async (tenantId, itemId, photoId) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Menu item ID is required and must be a string')
		}

		if (!photoId || typeof photoId !== 'string') {
			throw new Error('Photo ID is required and must be a string')
		}

		const url = `/tenants/${tenantId}/items/${itemId}/photos/${photoId}`
		console.log('🗑️ Deleting photo:', url)

		const response = await apiClient.delete(url)

		const { code, message } = response.data

		if (code === 1000) {
			console.log('✅ Photo deleted successfully')
			return {
				success: true,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				message: message || 'Failed to delete photo',
			}
		}
	} catch (error) {
		console.error('❌ Delete photo error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message

		return {
			success: false,
			message: errorMessage || 'Failed to delete photo',
			errorCode,
		}
	}
}

/**
 * Update menu item information
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @param {Object} updateData - Data to update
 * @param {string} [updateData.categoryId] - Category ID (UUID)
 * @param {string} [updateData.name] - Item name (2-80 chars)
 * @param {string} [updateData.description] - Item description
 * @param {number} [updateData.price] - Price (0.01-999999)
 * @param {string} [updateData.currency] - Currency code (default: VND)
 * @param {number} [updateData.prepTimeMinutes] - Preparation time (0-240 minutes)
 * @param {string} [updateData.status] - Status: "AVAILABLE" | "UNAVAILABLE" | "SOLD_OUT"
 * @param {boolean} [updateData.isChefRecommended] - Chef recommendation flag
 * @returns {Promise<Object>} Response with updated item
 */
export const updateMenuItemAPI = async (tenantId, itemId, updateData) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Menu item ID is required and must be a string')
		}

		if (!updateData || typeof updateData !== 'object') {
			throw new Error('Update data is required and must be an object')
		}

		// Validate fields if provided
		const payload = {}

		if (updateData.categoryId !== undefined) {
			if (typeof updateData.categoryId !== 'string') {
				throw new Error('Category ID must be a string')
			}
			payload.categoryId = updateData.categoryId
		}

		if (updateData.name !== undefined) {
			if (
				typeof updateData.name !== 'string' ||
				updateData.name.length < 2 ||
				updateData.name.length > 80
			) {
				throw new Error('Name must be a string between 2 and 80 characters')
			}
			payload.name = updateData.name
		}

		if (updateData.description !== undefined) {
			if (typeof updateData.description !== 'string') {
				throw new Error('Description must be a string')
			}
			payload.description = updateData.description
		}

		if (updateData.price !== undefined) {
			const price = Number(updateData.price)
			if (isNaN(price) || price < 0.01 || price > 999999) {
				throw new Error('Price must be a number between 0.01 and 999999')
			}
			payload.price = price
		}

		if (updateData.currency !== undefined) {
			if (typeof updateData.currency !== 'string') {
				throw new Error('Currency must be a string')
			}
			payload.currency = updateData.currency
		}

		if (updateData.prepTimeMinutes !== undefined) {
			const prepTime = Number(updateData.prepTimeMinutes)
			if (isNaN(prepTime) || prepTime < 0 || prepTime > 240) {
				throw new Error('Preparation time must be a number between 0 and 240 minutes')
			}
			payload.prepTimeMinutes = prepTime
		}

		if (updateData.status !== undefined) {
			const validStatuses = ['AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT']
			const status = updateData.status.toUpperCase()
			if (!validStatuses.includes(status)) {
				throw new Error('Status must be AVAILABLE, UNAVAILABLE, or SOLD_OUT')
			}
			payload.status = status
		}

		if (updateData.isChefRecommended !== undefined) {
			payload.isChefRecommended = Boolean(updateData.isChefRecommended)
		}

		if (Object.keys(payload).length === 0) {
			throw new Error('At least one field must be provided for update')
		}

		const url = `/tenants/${tenantId}/items/${itemId}`
		console.log('📝 Updating menu item:', itemId, payload)

		const response = await apiClient.patch(url, payload)

		const { code, message, data } = response.data

		if (code === 1000) {
			console.log('✅ Menu item updated successfully')
			return {
				success: true,
				item: data,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				item: null,
				message: message || 'Failed to update menu item',
			}
		}
	} catch (error) {
		console.error('❌ Update menu item error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to update menu item. Please try again.'

		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2000:
				userMessage = 'Tenant not found.'
				break
			case 2903:
				userMessage = 'Category not found.'
				break
			case 2905:
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
			item: null,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Update menu item status
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @param {string} status - New status: "AVAILABLE" | "UNAVAILABLE" | "SOLD_OUT"
 * @returns {Promise<Object>} Response with updated item
 */
export const updateMenuItemStatusAPI = async (tenantId, itemId, status) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Menu item ID is required and must be a string')
		}

		const validStatuses = ['AVAILABLE', 'UNAVAILABLE', 'SOLD_OUT']
		const upperStatus = status.toUpperCase()
		if (!validStatuses.includes(upperStatus)) {
			throw new Error('Status must be AVAILABLE, UNAVAILABLE, or SOLD_OUT')
		}

		const url = `/tenants/${tenantId}/items/${itemId}/status`
		console.log('📝 Updating item status to:', upperStatus)

		const response = await apiClient.patch(url, { status: upperStatus })

		const { code, message, data } = response.data

		if (code === 1000) {
			console.log('✅ Item status updated successfully')
			return {
				success: true,
				item: data,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				item: null,
				message: message || 'Failed to update status',
			}
		}
	} catch (error) {
		console.error('❌ Update status error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message

		return {
			success: false,
			item: null,
			message: errorMessage || 'Failed to update status',
			errorCode,
		}
	}
}

/**
 * Delete menu item (soft delete)
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @returns {Promise<Object>} Response
 */
export const deleteMenuItemAPI = async (tenantId, itemId) => {
	try {
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		if (!itemId || typeof itemId !== 'string') {
			throw new Error('Menu item ID is required and must be a string')
		}

		const url = `/tenants/${tenantId}/items/${itemId}`
		console.log('🗑️ Deleting menu item:', url)

		const response = await apiClient.delete(url)

		const { code, message } = response.data

		if (code === 1000) {
			console.log('✅ Menu item deleted successfully')
			return {
				success: true,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				message: message || 'Failed to delete menu item',
			}
		}
	} catch (error) {
		console.error('❌ Delete menu item error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to delete menu item. Please try again.'

		switch (errorCode) {
			case 2905:
				userMessage = 'Menu item not found.'
				break
			case 2906:
				userMessage = 'Cannot delete item with active orders.'
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
