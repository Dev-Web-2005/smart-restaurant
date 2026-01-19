// services/api/reportAPI.js
// Report API Service - For fetching report and analytics data

import apiClient from '../apiClient'

/**
 * Time range options for revenue report
 * @readonly
 * @enum {string}
 */
export const TIME_RANGE = {
	DAILY: 'DAILY',
	WEEKLY: 'WEEKLY',
	MONTHLY: 'MONTHLY',
	CUSTOM: 'CUSTOM',
}

/**
 * Payment status filter options
 * @readonly
 * @enum {string}
 */
export const PAYMENT_STATUS = {
	PAID: 'PAID',
	PENDING: 'PENDING',
	PROCESSING: 'PROCESSING',
	FAILED: 'FAILED',
	REFUNDED: 'REFUNDED',
}

// ==================== CACHE UTILITIES ====================

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Get cached data if valid
 * @param {string} cacheKey - Cache key
 * @returns {Object|null} Cached data or null if expired/not found
 */
const getCachedData = (cacheKey) => {
	try {
		const cached = localStorage.getItem(cacheKey)
		if (!cached) return null

		const { data, timestamp } = JSON.parse(cached)
		if (Date.now() - timestamp > CACHE_DURATION) {
			localStorage.removeItem(cacheKey)
			return null
		}
		return data
	} catch (error) {
		console.warn('⚠️ Cache read error:', error)
		return null
	}
}

/**
 * Set cached data
 * @param {string} cacheKey - Cache key
 * @param {Object} data - Data to cache
 */
const setCachedData = (cacheKey, data) => {
	try {
		localStorage.setItem(
			cacheKey,
			JSON.stringify({
				data,
				timestamp: Date.now(),
			}),
		)
	} catch (error) {
		console.warn('⚠️ Cache write error:', error)
	}
}

/**
 * Clear all report caches
 */
export const clearReportCache = () => {
	try {
		const keys = Object.keys(localStorage)
		keys.forEach((key) => {
			if (key.startsWith('report:')) {
				localStorage.removeItem(key)
			}
		})
		console.log('✅ Report cache cleared')
	} catch (error) {
		console.warn('⚠️ Cache clear error:', error)
	}
}

// ==================== REVENUE REPORT API ====================

/**
 * Get revenue report by time range
 *
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} params.timeRange - Time range: DAILY | WEEKLY | MONTHLY | CUSTOM
 * @param {string} [params.startDate] - Start date (ISO format, required for CUSTOM)
 * @param {string} [params.endDate] - End date (ISO format, required for CUSTOM)
 * @param {string} [params.paymentStatus='PAID'] - Payment status filter
 * @param {boolean} [params.useCache=true] - Whether to use cached data
 * @returns {Promise<Object>} Revenue report response
 *
 * @example
 * // Daily revenue for last 30 days
 * const report = await getRevenueReportAPI({ tenantId, timeRange: 'DAILY' })
 *
 * @example
 * // Custom date range
 * const report = await getRevenueReportAPI({
 *   tenantId,
 *   timeRange: 'CUSTOM',
 *   startDate: '2026-01-01',
 *   endDate: '2026-01-17'
 * })
 */
export const getRevenueReportAPI = async ({
	tenantId,
	timeRange,
	startDate,
	endDate,
	paymentStatus = 'PAID',
	useCache = true,
}) => {
	try {
		// Validate required fields
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		if (!timeRange || !Object.values(TIME_RANGE).includes(timeRange)) {
			throw new Error('Valid timeRange is required: DAILY, WEEKLY, MONTHLY, or CUSTOM')
		}

		// For CUSTOM time range, start and end dates are required
		if (timeRange === TIME_RANGE.CUSTOM) {
			if (!startDate || !endDate) {
				throw new Error('startDate and endDate are required for CUSTOM time range')
			}
		}

		// Build cache key
		const cacheKey = `report:revenue:${tenantId}:${timeRange}:${startDate || ''}:${endDate || ''}:${paymentStatus}`

		// Check cache first
		if (useCache) {
			const cachedData = getCachedData(cacheKey)
			if (cachedData) {
				console.log('📦 Using cached revenue report')
				return cachedData
			}
		}

		// Build query params
		const params = new URLSearchParams({ timeRange })

		if (startDate) params.append('startDate', startDate)
		if (endDate) params.append('endDate', endDate)
		if (paymentStatus) params.append('paymentStatus', paymentStatus)

		const response = await apiClient.get(
			`/tenants/${tenantId}/reports/revenue?${params.toString()}`,
		)

		// Cache the response
		if (response.data) {
			setCachedData(cacheKey, response.data)
		}

		return response.data
	} catch (error) {
		console.error('❌ Error getting revenue report:', error)
		throw error
	}
}

// ==================== TOP ITEMS REPORT API ====================

/**
 * Get top revenue items report
 *
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} [params.startDate] - Start date (ISO format, default: 30 days ago)
 * @param {string} [params.endDate] - End date (ISO format, default: now)
 * @param {number} [params.limit=10] - Number of top items (max: 50)
 * @param {string} [params.paymentStatus='PAID'] - Payment status filter
 * @param {boolean} [params.useCache=true] - Whether to use cached data
 * @returns {Promise<Object>} Top items report response
 *
 * @example
 * // Get top 10 items (default)
 * const report = await getTopItemsReportAPI({ tenantId })
 *
 * @example
 * // Get top 20 items for specific date range
 * const report = await getTopItemsReportAPI({
 *   tenantId,
 *   startDate: '2026-01-01',
 *   endDate: '2026-01-17',
 *   limit: 20
 * })
 */
export const getTopItemsReportAPI = async ({
	tenantId,
	startDate,
	endDate,
	limit = 10,
	paymentStatus = 'PAID',
	useCache = true,
}) => {
	try {
		// Validate required fields
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		// Validate limit
		if (limit < 1 || limit > 50) {
			throw new Error('Limit must be between 1 and 50')
		}

		// Build cache key
		const cacheKey = `report:topitems:${tenantId}:${startDate || ''}:${endDate || ''}:${limit}:${paymentStatus}`

		// Check cache first
		if (useCache) {
			const cachedData = getCachedData(cacheKey)
			if (cachedData) {
				console.log('📦 Using cached top items report')
				return cachedData
			}
		}

		// Build query params
		const params = new URLSearchParams()

		if (startDate) params.append('startDate', startDate)
		if (endDate) params.append('endDate', endDate)
		if (limit) params.append('limit', limit.toString())
		if (paymentStatus) params.append('paymentStatus', paymentStatus)

		const response = await apiClient.get(
			`/tenants/${tenantId}/reports/top-items?${params.toString()}`,
		)

		// Cache the response
		if (response.data) {
			setCachedData(cacheKey, response.data)
		}

		return response.data
	} catch (error) {
		console.error('❌ Error getting top items report:', error)
		throw error
	}
}

// ==================== ANALYTICS REPORT API ====================

/**
 * Get analytics dashboard report
 * Returns comprehensive analytics data including:
 * - Daily orders trend (30 days)
 * - Peak hours distribution (24 hours)
 * - Popular items with trends (top 5)
 * - Summary statistics
 *
 * @param {Object} params - Request parameters
 * @param {string} params.tenantId - Tenant ID (UUID)
 * @param {string} [params.startDate] - Start date (ISO format, default: 30 days ago)
 * @param {string} [params.endDate] - End date (ISO format, default: now)
 * @param {string} [params.paymentStatus='PAID'] - Payment status filter
 * @param {boolean} [params.useCache=true] - Whether to use cached data
 * @returns {Promise<Object>} Analytics report response
 *
 * @example
 * const analytics = await getAnalyticsReportAPI({ tenantId })
 * const { dailyOrders, peakHours, popularItems, summary } = analytics.data
 */
export const getAnalyticsReportAPI = async ({
	tenantId,
	startDate,
	endDate,
	paymentStatus = 'PAID',
	useCache = true,
}) => {
	try {
		// Validate required fields
		if (!tenantId || typeof tenantId !== 'string') {
			throw new Error('Tenant ID is required and must be a string')
		}

		// Build cache key
		const cacheKey = `report:analytics:${tenantId}:${startDate || ''}:${endDate || ''}:${paymentStatus}`

		// Check cache first
		if (useCache) {
			const cachedData = getCachedData(cacheKey)
			if (cachedData) {
				console.log('📦 Using cached analytics report')
				return cachedData
			}
		}

		// Build query params
		const params = new URLSearchParams()

		if (startDate) params.append('startDate', startDate)
		if (endDate) params.append('endDate', endDate)
		if (paymentStatus) params.append('paymentStatus', paymentStatus)

		const response = await apiClient.get(
			`/tenants/${tenantId}/reports/analytics?${params.toString()}`,
		)

		// Cache the response
		if (response.data) {
			setCachedData(cacheKey, response.data)
		}

		return response.data
	} catch (error) {
		console.error('❌ Error getting analytics report:', error)
		throw error
	}
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format currency value for display (USD)
 * @param {number} value - The value to format
 * @param {string} [currency='USD'] - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD') => {
	if (value === null || value === undefined) return '$0'

	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value)
}

/**
 * Format number with thousand separators
 * @param {number} value - The value to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
	if (value === null || value === undefined) return '0'
	return new Intl.NumberFormat('vi-VN').format(value)
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
	if (!date) return ''

	const defaultOptions = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		...options,
	}

	return new Intl.DateTimeFormat('vi-VN', defaultOptions).format(new Date(date))
}

/**
 * Get date range for preset time ranges
 * @param {string} preset - Preset name: 'today', 'week', 'month', 'quarter', 'year'
 * @returns {Object} Object with startDate and endDate (ISO strings)
 */
export const getDateRangePreset = (preset) => {
	const now = new Date()
	const endDate = now.toISOString().split('T')[0]
	let startDate

	switch (preset) {
		case 'today':
			startDate = endDate
			break
		case 'week': {
			const weekAgo = new Date(now)
			weekAgo.setDate(weekAgo.getDate() - 7)
			startDate = weekAgo.toISOString().split('T')[0]
			break
		}
		case 'month': {
			const monthAgo = new Date(now)
			monthAgo.setDate(monthAgo.getDate() - 30)
			startDate = monthAgo.toISOString().split('T')[0]
			break
		}
		case 'quarter': {
			const quarterAgo = new Date(now)
			quarterAgo.setDate(quarterAgo.getDate() - 90)
			startDate = quarterAgo.toISOString().split('T')[0]
			break
		}
		case 'year': {
			const yearAgo = new Date(now)
			yearAgo.setFullYear(yearAgo.getFullYear() - 1)
			startDate = yearAgo.toISOString().split('T')[0]
			break
		}
		default: {
			// Default to last 30 days
			const defaultStart = new Date(now)
			defaultStart.setDate(defaultStart.getDate() - 30)
			startDate = defaultStart.toISOString().split('T')[0]
		}
	}

	return { startDate, endDate }
}

/**
 * Calculate growth percentage between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Growth percentage (can be negative)
 */
export const calculateGrowth = (current, previous) => {
	if (!previous || previous === 0) return current > 0 ? 100 : 0
	return ((current - previous) / previous) * 100
}
