// services/api/categoryAPI.js
// Category API Service - Product Service via API Gateway

import apiClient from '../apiClient'

/**
 * Get list of categories for a tenant
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {Object} params - Query parameters
 * @param {string} [params.status] - Filter by status: "ACTIVE" | "INACTIVE"
 * @param {string} [params.search] - Search by category name
 * @param {string} [params.sortBy] - Sort field: "displayOrder" | "name" | "createdAt"
 * @param {string} [params.sortOrder] - Sort order: "ASC" | "DESC"
 * @returns {Promise<Object>} Response with categories array
 */
export const getCategoriesAPI = async (tenantId, params = {}) => {
	try {
		// Validate tenantId
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		// Build query parameters
		const queryParams = new URLSearchParams()

		if (params.status) {
			// Ensure status is uppercase
			const validStatuses = ['ACTIVE', 'INACTIVE']
			const status = params.status.toUpperCase()
			if (!validStatuses.includes(status)) {
				throw new Error('Status must be either ACTIVE or INACTIVE')
			}
			queryParams.append('status', status)
		}

		if (params.search && typeof params.search === 'string') {
			queryParams.append('search', params.search.trim())
		}

		if (params.sortBy) {
			const validSortBy = ['displayOrder', 'name', 'createdAt']
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

		const queryString = queryParams.toString()
		const url = `/tenants/${tenantId}/categories${queryString ? `?${queryString}` : ''}`

		console.log('📥 Fetching categories:', url)
		const response = await apiClient.get(url)

		const { code, message, data } = response.data

		if (code === 1000) {
			// Backend returns array of CategoryResponseDto
			console.log('✅ Categories fetched successfully:', data?.length || 0, 'items')
			return {
				success: true,
				categories: data || [],
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				categories: [],
				message: message || 'Failed to fetch categories',
			}
		}
	} catch (error) {
		console.error('❌ Get categories error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to load categories. Please try again.'

		// Handle specific error codes
		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2000:
				userMessage = 'Tenant not found.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			categories: [],
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Get category by ID (Get Detail)
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {string} categoryId - Category ID (UUID format)
 * @returns {Promise<Object>} Response with category detail
 *
 * Response structure:
 * {
 *   success: boolean,
 *   category: {
 *     id: string,              // UUID of category
 *     tenantId: string,        // UUID of tenant
 *     name: string,            // Category name
 *     description: string,     // Description (optional)
 *     status: string,          // "ACTIVE" or "INACTIVE"
 *     displayOrder: number,    // Display order number
 *     imageUrl: string,        // Image URL (optional)
 *     itemCount: number,       // Number of active items (optional)
 *     createdAt: Date,         // Creation timestamp
 *     updatedAt: Date          // Update timestamp
 *   },
 *   message: string
 * }
 */
export const getCategoryByIdAPI = async (tenantId, categoryId) => {
	try {
		// Validate tenantId
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		// Validate categoryId
		if (!categoryId || typeof categoryId !== 'string') {
			throw new Error('Category ID is required and must be a string')
		}

		const url = `/tenants/${tenantId}/categories/${categoryId}`

		console.log('📥 Fetching category detail:', categoryId)
		const response = await apiClient.get(url)

		const { code, message, data } = response.data

		if (code === 1000) {
			// Backend returns CategoryResponseDto with itemCount
			console.log('✅ Category detail fetched successfully:', data)
			return {
				success: true,
				category: data, // Full category object with all fields including itemCount
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				category: null,
				message: message || 'Failed to fetch category detail',
			}
		}
	} catch (error) {
		console.error('❌ Get category detail error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to load category detail. Please try again.'

		// Handle specific error codes
		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2000:
				userMessage = 'Tenant not found.'
				break
			case 2001:
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
			category: null,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Create new category
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {Object} categoryData - Category data
 * @param {string} categoryData.name - Category name (2-50 characters, required)
 * @param {string} [categoryData.description] - Category description (optional)
 * @param {string} [categoryData.status] - Status: "ACTIVE" | "INACTIVE" (default: "ACTIVE")
 * @param {number} [categoryData.displayOrder] - Display order (>= 0, default: 0)
 * @param {string} [categoryData.image] - Image URL from cloud storage (optional)
 * @returns {Promise<Object>} Response with created category
 */
export const createCategoryAPI = async (tenantId, categoryData) => {
	try {
		// Validate tenantId
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		// Validate required fields
		if (!categoryData.name || typeof categoryData.name !== 'string') {
			throw new Error('Category name is required and must be a string')
		}

		const name = categoryData.name.trim()
		if (name.length < 2 || name.length > 50) {
			throw new Error('Category name must be between 2 and 50 characters')
		}

		// Build request body
		const requestBody = {
			name,
		}

		// Optional: description
		if (categoryData.description) {
			if (typeof categoryData.description !== 'string') {
				throw new Error('Description must be a string')
			}
			requestBody.description = categoryData.description.trim()
		}

		// Optional: status
		if (categoryData.status) {
			const validStatuses = ['ACTIVE', 'INACTIVE']
			const status = categoryData.status.toUpperCase()
			if (!validStatuses.includes(status)) {
				throw new Error('Status must be either ACTIVE or INACTIVE')
			}
			requestBody.status = status
		}

		// Optional: displayOrder
		if (categoryData.displayOrder !== undefined && categoryData.displayOrder !== null) {
			const displayOrder = Number(categoryData.displayOrder)
			if (isNaN(displayOrder) || displayOrder < 0 || !Number.isInteger(displayOrder)) {
				throw new Error('Display order must be a non-negative integer')
			}
			requestBody.displayOrder = displayOrder
		}

		// Optional: image URL from cloud storage
		if (categoryData.image) {
			if (typeof categoryData.image !== 'string') {
				throw new Error('Image URL must be a string')
			}
			const imageUrl = categoryData.image.trim()
			if (imageUrl.length > 0) {
				// Basic URL validation
				try {
					new URL(imageUrl)
					requestBody.imageUrl = imageUrl // ✅ Backend expects 'imageUrl' not 'image'
				} catch (urlError) {
					console.warn('⚠️ Invalid image URL format:', imageUrl)
					// Don't throw error, just skip adding invalid URL
				}
			}
		}

		const url = `/tenants/${tenantId}/categories`
		console.log('📤 Creating category:', requestBody)

		const response = await apiClient.post(url, requestBody)

		const { code, message, data } = response.data

		if (code === 1000) {
			// Backend returns CategoryResponseDto
			console.log('✅ Category created successfully:', data)
			return {
				success: true,
				category: data,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				category: null,
				message: message || 'Failed to create category',
			}
		}
	} catch (error) {
		console.error('❌ Create category error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to create category. Please try again.'

		// Handle specific error codes
		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2000:
				userMessage = 'Tenant not found.'
				break
			case 2901:
				userMessage = 'Invalid input. Please check your data.'
				break
			case 2902:
				userMessage = 'Category name already exists.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			category: null,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Update existing category
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {string} categoryId - Category ID (UUID format)
 * @param {Object} updateData - Fields to update (all optional)
 * @param {string} [updateData.name] - Category name (2-50 characters)
 * @param {string} [updateData.description] - Category description
 * @param {string} [updateData.status] - Status: "ACTIVE" | "INACTIVE"
 * @param {number} [updateData.displayOrder] - Display order (>= 0)
 * @returns {Promise<Object>} Response with updated category
 */
export const updateCategoryAPI = async (tenantId, categoryId, updateData) => {
	try {
		// Validate IDs
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!categoryId || typeof categoryId !== 'string') {
			throw new Error('Category ID is required and must be a string')
		}

		// Build request body (all fields optional for update)
		const requestBody = {}

		if (updateData.name !== undefined) {
			if (typeof updateData.name !== 'string') {
				throw new Error('Name must be a string')
			}
			const name = updateData.name.trim()
			if (name.length < 2 || name.length > 50) {
				throw new Error('Category name must be between 2 and 50 characters')
			}
			requestBody.name = name
		}

		if (updateData.description !== undefined) {
			if (updateData.description !== null && typeof updateData.description !== 'string') {
				throw new Error('Description must be a string or null')
			}
			requestBody.description = updateData.description
				? updateData.description.trim()
				: ''
		}

		if (updateData.status !== undefined) {
			const validStatuses = ['ACTIVE', 'INACTIVE']
			const status = updateData.status.toUpperCase()
			if (!validStatuses.includes(status)) {
				throw new Error('Status must be either ACTIVE or INACTIVE')
			}
			requestBody.status = status
		}

		if (updateData.displayOrder !== undefined) {
			const displayOrder = Number(updateData.displayOrder)
			if (isNaN(displayOrder) || displayOrder < 0 || !Number.isInteger(displayOrder)) {
				throw new Error('Display order must be a non-negative integer')
			}
			requestBody.displayOrder = displayOrder
		}

		// Optional: imageUrl from cloud storage
		if (updateData.imageUrl !== undefined) {
			if (updateData.imageUrl && typeof updateData.imageUrl !== 'string') {
				throw new Error('Image URL must be a string')
			}
			const imageUrl = updateData.imageUrl ? updateData.imageUrl.trim() : ''
			if (imageUrl.length > 0) {
				// Basic URL validation
				try {
					new URL(imageUrl)
					requestBody.imageUrl = imageUrl
				} catch (urlError) {
					console.warn('⚠️ Invalid image URL format:', imageUrl)
					// Don't throw error, just skip adding invalid URL
				}
			} else {
				// Empty string to clear image
				requestBody.imageUrl = ''
			}
		}

		const url = `/tenants/${tenantId}/categories/${categoryId}`
		console.log('📤 Updating category:', requestBody)

		const response = await apiClient.patch(url, requestBody)

		const { code, message, data } = response.data

		if (code === 1000) {
			console.log('✅ Category updated successfully:', data)
			return {
				success: true,
				category: data,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				category: null,
				message: message || 'Failed to update category',
			}
		}
	} catch (error) {
		console.error('❌ Update category error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to update category. Please try again.'

		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2001:
				userMessage = 'Category not found.'
				break
			case 2901:
				userMessage = 'Invalid input. Please check your data.'
				break
			case 2902:
				userMessage = 'Category name already exists.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			category: null,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Update category status only
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {string} categoryId - Category ID (UUID format)
 * @param {string} status - New status: "ACTIVE" | "INACTIVE"
 * @returns {Promise<Object>} Response with updated category
 */
export const updateCategoryStatusAPI = async (tenantId, categoryId, status) => {
	try {
		// Validate IDs
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!categoryId || typeof categoryId !== 'string') {
			throw new Error('Category ID is required and must be a string')
		}

		// Validate status
		if (!status || typeof status !== 'string') {
			throw new Error('Status is required and must be a string')
		}
		const validStatuses = ['ACTIVE', 'INACTIVE']
		const normalizedStatus = status.toUpperCase()
		if (!validStatuses.includes(normalizedStatus)) {
			throw new Error('Status must be either ACTIVE or INACTIVE')
		}

		const url = `/tenants/${tenantId}/categories/${categoryId}/status`
		console.log('📤 Updating category status to:', normalizedStatus)

		// API Gateway will automatically add productApiKey from config
		const response = await apiClient.patch(url, { status: normalizedStatus })

		const { code, message, data } = response.data

		if (code === 1000) {
			console.log('✅ Category status updated successfully')
			return {
				success: true,
				category: data,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				category: null,
				message: message || 'Failed to update category status',
			}
		}
	} catch (error) {
		console.error('❌ Update category status error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to update category status. Please try again.'

		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2001:
				userMessage = 'Category not found.'
				break
			case 2901:
				userMessage = 'Invalid status value.'
				break
			case 9002:
				userMessage = 'Cannot connect to server. Please check your internet connection.'
				break
			default:
				userMessage = errorMessage || userMessage
		}

		return {
			success: false,
			category: null,
			message: userMessage,
			errorCode,
		}
	}
}

/**
 * Delete category (soft delete)
 * @param {string} tenantId - Tenant ID (UUID format)
 * @param {string} categoryId - Category ID (UUID format)
 * @returns {Promise<Object>} Response with success status
 */
export const deleteCategoryAPI = async (tenantId, categoryId) => {
	try {
		// Validate IDs
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}
		if (!categoryId || typeof categoryId !== 'string') {
			throw new Error('Category ID is required and must be a string')
		}

		const url = `/tenants/${tenantId}/categories/${categoryId}`
		console.log('🗑️ Deleting category:', categoryId)

		const response = await apiClient.delete(url)

		const { code, message } = response.data

		if (code === 1000) {
			console.log('✅ Category deleted successfully')
			return {
				success: true,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				message: message || 'Failed to delete category',
			}
		}
	} catch (error) {
		console.error('❌ Delete category error:', error)

		const errorCode = error?.code || error?.response?.data?.code
		const errorMessage = error?.message || error?.response?.data?.message
		let userMessage = 'Failed to delete category. Please try again.'

		switch (errorCode) {
			case 1002:
				userMessage = 'Session expired. Please login again.'
				break
			case 2001:
				userMessage = 'Category not found.'
				break
			case 2903:
				userMessage = 'Cannot delete category. It contains menu items.'
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

// Export all functions
export default {
	getCategoriesAPI,
	getCategoryByIdAPI,
	createCategoryAPI,
	updateCategoryAPI,
	updateCategoryStatusAPI,
	deleteCategoryAPI,
}
