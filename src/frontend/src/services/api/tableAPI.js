// services/api/tableAPI.js
// Table Management API Service - Table Service via API Gateway
// Last Updated: 16/12/2025

/**
 * API STATUS (Updated: 16/12/2025 - All 6 QR APIs Integrated in UI)
 *
 * ✅ WORKING - Backend fully implemented (15 APIs):
 *    TABLE MANAGEMENT:
 *    - getTablesAPI: GET /tenants/:tenantId/tables
 *    - createTableAPI: POST /tenants/:tenantId/tables
 *    - updateTableStatusAPI: PATCH /tenants/:tenantId/tables/:tableId (status field)
 *    - updateTablePositionAPI: PATCH /tenants/:tenantId/tables/:tableId (gridX, gridY fields)
 *    - deleteTableAPI: DELETE /tenants/:tenantId/tables/:tableId (soft delete)
 *
 *    FLOOR MANAGEMENT:
 *    - createFloorAPI: POST /tenants/:tenantId/floors
 *    - updateGridConfigAPI: PATCH /tenants/:tenantId/floors/:floorId
 *
 *    QR CODE MANAGEMENT (All 6 APIs ✅ In Use):
 *    - getTableQRCodeAPI: GET /tenants/:tenantId/tables/:tableId/qrcode (Modal: View QR)
 *    - regenerateTableQRAPI: POST /tenants/:tenantId/tables/:tableId/qrcode (Modal: Regenerate button)
 *    - downloadTableQRCodeAPI: GET /tenants/:tenantId/tables/:tableId/qrcode/download (Modal: PNG/PDF/SVG buttons)
 *    - batchDownloadQRCodesAPI: GET /tenants/:tenantId/tables/qrcode/batch-download (Toolbar: Download All buttons)
 *    - bulkRegenerateQRCodesAPI: POST /tenants/:tenantId/tables/qrcode/bulk-regenerate (Toolbar: Regenerate All button)
 *    - validateQRScanAPI: GET /tenants/:tenantId/tables/scan/:token (public, available for future use)
 *
 * ❌ NOT IMPLEMENTED - Backend needs development (2 APIs):
 *    - getTableStatsAPI: GET /tenants/:tenantId/tables/stats
 *    - saveTableLayoutAPI: PUT /tenants/:tenantId/tables/layout
 *    → Workarounds: Client-side stats, individual PATCH calls
 *
 * 🔄 CLIENT-SIDE HELPERS (4 functions):
 *    - downloadTableQRCode: Downloads QR from backend URL
 *    - printTableQRCode: Opens browser print dialog
 *    - downloadAllTableQRCodes: Creates ZIP of all QRs
 *    - printAllTableQRCodes: Multi-page print layout
 *
 * 🔐 AUTHENTICATION FIX:
 *    - tenantId = userId (each user is their own tenant)
 *    - window.currentTenantId set after login
 *    - All APIs require valid JWT token in Authorization header
 *
 * 📋 FIELD MAPPING:
 *    - Backend: UUID strings for id, tenantId, floorId
 *    - CreateTableDto: name, capacity (required), floorId, gridX, gridY, status (optional)
 *    - UpdateTableDto: All fields optional
 *    - ListTablesDto: tenantId (required), isActive, status, floorId, includeFloor (optional)
 *    - Backend returns Array<TableDto> directly, not wrapped object
 *    - QR Response: { url, image (base64), tableId, tableName, tokenVersion }
 *    - Floor: gridWidth (cols), gridHeight (rows)
 */

import apiClient from '../apiClient'
import { getTenantId } from '../helpers/tenantHelper'

/**
 * Normalize backend status values to frontend format
 * Backend: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE (uppercase)
 * Frontend: Available, Occupied, Reserved, Cleaning (titlecase)
 * @param {string} status - Backend status value
 * @returns {string} Normalized frontend status value
 */
const normalizeStatus = (status) => {
	const statusMap = {
		AVAILABLE: 'Available',
		OCCUPIED: 'Occupied',
		RESERVED: 'Reserved',
		MAINTENANCE: 'Cleaning', // Backend MAINTENANCE → Frontend Cleaning
	}
	return statusMap[status] || status
}

/**
 * Convert frontend status to backend format
 * @param {string} status - Frontend status value
 * @returns {string} Backend status value
 */
const toBackendStatus = (status) => {
	const statusMap = {
		Available: 'AVAILABLE',
		Occupied: 'OCCUPIED',
		Reserved: 'RESERVED',
		Cleaning: 'MAINTENANCE', // Frontend Cleaning → Backend MAINTENANCE
	}
	return statusMap[status] || status
}

/**
 * Get table statistics by status (across all floors)
 * ⚠️ Backend endpoint not implemented - returns mock data to prevent 400 errors
 * @returns {Promise} Response with status counts
 */
export const getTableStatsAPI = async () => {
	// TODO: Enable when backend implements GET /tenants/:tenantId/tables/stats
	console.warn(
		'⚠️ getTableStatsAPI: Backend endpoint not implemented - returning empty stats',
	)
	return {
		success: true,
		stats: {},
		message: 'Stats API not implemented (using client-side calculation)',
	}

	/* Uncomment when backend is ready:
	try {
		const tenantId = getTenantId()
		const response = await apiClient.get(`/tenants/${tenantId}/tables/stats`)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				stats: data.stats || {},
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				stats: {},
				message: message || 'Failed to fetch table stats',
			}
		}
	} catch (error) {
		console.error('❌ Error fetching table stats:', error)
		return {
			success: false,
			stats: {},
			message: error?.response?.data?.message || 'Network error',
		}
	}
	*/
}

/**
 * Get tables by floor with optional filters and sorting
 * @param {number} floor - Floor number
 * @param {Object} options - Optional filters and sorting
 * @param {string} options.status - Filter by status (Available, Occupied, Cleaning)
 * @param {string} options.location - Filter by location
 * @param {string} options.sortBy - Sort field (id, capacity, createdAt)
 * @param {string} options.sortOrder - Sort order (asc, desc)
 * @returns {Promise} Response with tables array and total floors
 */
export const getTablesAPI = async (floor, options = {}) => {
	try {
		// ✅ Backend ListTablesDto supports: isActive, status, floorId, includeFloor
		// ⚠️ NOTE: location, sortBy, sortOrder are NOT supported by backend
		const params = new URLSearchParams()

		// Filter by status (backend supports this)
		if (options.status && options.status !== 'All') {
			params.append('status', options.status)
		}

		// Filter by floorId (if you have floorId mapping)
		// For now, we'll skip this since we only have floor number
		// TODO: Add floorId mapping when floor management is implemented

		// NOTE: Backend does NOT support:
		// - location filter (frontend-only field)
		// - sortBy/sortOrder (backend returns unsorted)
		// - floor number (backend uses floorId UUID)
		// Frontend will need to filter/sort locally

		const tenantId = getTenantId()
		const response = await apiClient.get(
			`/tenants/${tenantId}/tables?${params.toString()}`,
		)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			// ⚠️ Backend returns Array<TableDto> directly in data, NOT { tables: [...] }
			let tables = Array.isArray(data) ? data : []

			// 🔄 Normalize backend status values to frontend format
			tables = tables.map((table) => ({
				...table,
				status: normalizeStatus(table.status),
			}))

			// Calculate gridConfig from tables (backend doesn't provide this)
			let gridConfig = { rows: 5, cols: 10 }
			if (tables.length > 0) {
				const maxX = Math.max(...tables.map((t) => t.gridX || 0))
				const maxY = Math.max(...tables.map((t) => t.gridY || 0))
				gridConfig = {
					cols: Math.min(Math.max(maxX + 1, 1), 10),
					rows: Math.max(maxY + 1, 1),
				}
			}

			// Calculate total floors from data (backend doesn't provide this)
			const floorIds = [...new Set(tables.map((t) => t.floorId).filter(Boolean))]
			const totalFloors = Math.max(floorIds.length, 1)

			return {
				success: true,
				tables: tables,
				gridConfig: gridConfig,
				totalFloors: totalFloors,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				tables: [],
				gridConfig: { rows: 5, cols: 10 },
				totalFloors: 1,
				message: message || 'Failed to fetch tables',
			}
		}
	} catch (error) {
		console.error('❌ Error fetching tables:', {
			message: error.message,
			response: error?.response?.data,
			status: error?.response?.status,
			hasToken: !!window.accessToken,
		})

		// Check if it's authentication error
		if (error.response?.status === 401) {
			console.warn('⚠️ Authentication required - using mock data as fallback')
		}

		return {
			success: false,
			tables: [],
			gridConfig: { rows: 5, cols: 10 },
			totalFloors: 1,
			message:
				error?.response?.data?.message || error?.response?.status === 401
					? 'Please login to view tables'
					: 'Network error',
		}
	}
}

/**
 * Create new table
 * @param {Object} tableData - Table data
 * @param {number} tableData.id - Table ID
 * @param {string} tableData.name - Table name (Required, Unique)
 * @param {number} tableData.capacity - Seating capacity (1-20) (Required)
 * @param {string} tableData.location - Location/Zone (e.g., "Trong nhà", "Ngoài trời", "Phòng VIP")
 * @param {string} tableData.description - Description (Optional)
 * @param {number} tableData.floor - Floor number
 * @param {number} tableData.gridX - Grid X position
 * @param {number} tableData.gridY - Grid Y position
 * @param {string} tableData.status - Table status (Available, Occupied, Cleaning)
 * @returns {Promise} Response with created table
 */
export const createTableAPI = async (tableData) => {
	try {
		const tenantId = getTenantId()

		// 🔍 Debug: Check authentication
		const accessToken = window.accessToken
		if (!accessToken) {
			console.error('❌ No access token found! User needs to login first.')
			return {
				success: false,
				message: 'Authentication required. Please login first.',
			}
		}

		// Build payload with ONLY valid CreateTableDto fields
		const payload = {
			name: tableData.name,
			capacity: tableData.capacity,
			tenantId,
		}

		// Add optional fields if provided
		if (tableData.floorId) payload.floorId = tableData.floorId
		if (tableData.gridX !== undefined) payload.gridX = tableData.gridX
		if (tableData.gridY !== undefined) payload.gridY = tableData.gridY
		if (tableData.status) payload.status = toBackendStatus(tableData.status) // Convert to backend format

		// 🔍 Debug: Log request details
		console.log('📤 Creating table:', {
			url: `/tenants/${tenantId}/tables`,
			payload,
			hasToken: !!accessToken,
			ignoredFields: {
				location: tableData.location,
				description: tableData.description,
				floor: tableData.floor,
			},
		})

		const response = await apiClient.post(`/tenants/${tenantId}/tables`, payload)

		console.log('📥 Create table response:', response.data)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200 || code === 201) {
			console.log('✅ Table created successfully:', data)
			// Normalize status in response
			const normalizedTable = {
				...data,
				status: normalizeStatus(data.status),
			}
			return {
				success: true,
				table: normalizedTable,
				message: message || 'Table created successfully',
			}
		} else {
			console.warn('⚠️ Unexpected response code:', code)
			return {
				success: false,
				message: message || 'Failed to create table',
			}
		}
	} catch (error) {
		console.error('❌ Error creating table:', {
			message: error.message,
			response: error?.response?.data,
			status: error?.response?.status,
			headers: error?.response?.headers,
		})

		// More specific error messages
		if (error.response?.status === 401) {
			return {
				success: false,
				message: 'Authentication failed. Please login again.',
			}
		}
		if (error.response?.status === 403) {
			return {
				success: false,
				message: 'Permission denied. You do not have access to create tables.',
			}
		}
		if (!error.response) {
			return {
				success: false,
				message: 'Cannot connect to server. Please check if backend is running.',
			}
		}

		return {
			success: false,
			message:
				error?.response?.data?.message || `Server error: ${error.response?.status}`,
		}
	}
}

/**
 * Update table status
 * @param {number} tableId - Table ID
 * @param {string} status - New status (Available, Occupied, Cleaning)
 * @returns {Promise} Response with updated table
 */
export const updateTableStatusAPI = async (tableId, status) => {
	try {
		const tenantId = getTenantId()
		// TODO: Switch to PUT /tenants/:tenantId/tables/:tableId/status when backend implements it
		// Currently using PATCH as temporary solution
		const response = await apiClient.patch(`/tenants/${tenantId}/tables/${tableId}`, {
			status: toBackendStatus(status), // Convert to backend format
		})
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			// Normalize status in response
			const normalizedTable = {
				...data,
				status: normalizeStatus(data.status),
			}
			return {
				success: true,
				table: normalizedTable,
				message: message || 'Status updated successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to update status',
			}
		}
	} catch (error) {
		console.error('❌ Error updating table status:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Update single table position
 * @param {number} tableId - Table ID
 * @param {number} gridX - New grid X position
 * @param {number} gridY - New grid Y position
 * @param {number} floor - Floor number
 * @returns {Promise} Response with updated table
 */
export const updateTablePositionAPI = async (tableId, gridX, gridY, floorId) => {
	try {
		const tenantId = getTenantId()
		// Using PATCH to update position fields
		const response = await apiClient.patch(`/tenants/${tenantId}/tables/${tableId}`, {
			gridX,
			gridY,
			floorId, // Backend expects floorId (UUID), not floor (number)
		})
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				table: data,
				message: message || 'Position updated successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to update position',
			}
		}
	} catch (error) {
		console.error('❌ Error updating table position:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Batch update table positions (Save Layout)
 * @param {number} floor - Floor number
 * @param {Array} tables - Array of table objects with positions
 * @param {Object} gridConfig - Grid configuration (rows, cols)
 * @returns {Promise} Response with update result
 */
export const saveTableLayoutAPI = async (floor, tables, gridConfig) => {
	try {
		// Prepare data: Extract only necessary fields
		const tablePositions = tables.map((table) => ({
			id: table.id,
			gridX: table.gridX,
			gridY: table.gridY,
		}))

		// TODO: Backend needs to implement PUT /tenants/:tenantId/tables/layout
		// Temporarily disabled - returning mock success
		console.warn('⚠️ saveTableLayoutAPI: Backend endpoint not implemented yet')
		console.log('📦 Would save layout:', {
			floor,
			tableCount: tablePositions.length,
			gridConfig,
		})

		// TEMP: Return mock success
		return {
			success: true,
			updatedCount: tablePositions.length,
			message: 'Layout saved (mock - backend not implemented)',
		}

		/* Uncomment when backend is ready:
		const response = await apiClient.put(`/tenants/${tenantId}/tables/layout`, {
			floorId: floor, // Backend expects floorId (UUID)
			tables: tablePositions,
			gridConfig: {
				rows: gridConfig.rows,
				cols: gridConfig.cols,
			},
		})
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				updatedCount: data.updatedCount || tablePositions.length,
				message: message || 'Layout saved successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to save layout',
			}
		}
		*/
	} catch (error) {
		console.error('❌ Error saving table layout:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Delete table
 * @param {number} tableId - Table ID
 * @returns {Promise} Response with deletion result
 */
export const deleteTableAPI = async (tableId) => {
	try {
		const tenantId = getTenantId()
		const response = await apiClient.delete(`/tenants/${tenantId}/tables/${tableId}`)
		const { code, message } = response.data

		if (code === 1000 || code === 200 || code === 204) {
			return {
				success: true,
				message: message || 'Table deleted successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to delete table',
			}
		}
	} catch (error) {
		console.error('❌ Error deleting table:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Create new floor
 * @param {number} floorNumber - Floor number to create
 * @returns {Promise} Response with created floor info
 */
export const createFloorAPI = async (
	floorNumber,
	floorName = null,
	description = null,
) => {
	try {
		const tenantId = getTenantId()
		// Backend expects: name, floorNumber, gridWidth, gridHeight, description
		const response = await apiClient.post(`/tenants/${tenantId}/floors`, {
			name: floorName || `Tầng ${floorNumber}`,
			floorNumber,
			gridWidth: 10, // Default grid width
			gridHeight: 10, // Default grid height
			description: description || `Tầng ${floorNumber} của nhà hàng`,
			isActive: true,
		})
		const { code, message, data } = response.data

		if (code === 1000 || code === 200 || code === 201) {
			return {
				success: true,
				totalFloors: data.totalFloors,
				message: message || 'Floor created successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to create floor',
			}
		}
	} catch (error) {
		console.error('❌ Error creating floor:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Update grid configuration for a floor
 * @param {number} floor - Floor number
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Promise} Response with update result
 */
export const updateGridConfigAPI = async (floorId, gridWidth, gridHeight) => {
	try {
		const tenantId = getTenantId()
		// Backend: PATCH /tenants/:tenantId/floors/:floorId with gridWidth, gridHeight
		const response = await apiClient.patch(`/tenants/${tenantId}/floors/${floorId}`, {
			gridWidth,
			gridHeight,
		})
		const { code, message } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				message: message || 'Grid configuration updated',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to update grid config',
			}
		}
	} catch (error) {
		console.error('❌ Error updating grid config:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Get existing QR code without regenerating
 * Backend: GET /tenants/:tenantId/tables/:tableId/qrcode
 * @param {string} tableId - Table ID (UUID)
 * @returns {Promise} Response with QR code data
 */
export const getTableQRCodeAPI = async (tableId) => {
	try {
		const tenantId = getTenantId()
		const response = await apiClient.get(`/tenants/${tenantId}/tables/${tableId}/qrcode`)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			// Backend returns: { url, image, tableId, tableName, tokenVersion }
			return {
				success: true,
				url: data.url, // Scan URL
				image: data.image, // Base64 PNG
				tableId: data.tableId,
				tableName: data.tableName,
				tokenVersion: data.tokenVersion,
				message: message || 'QR code retrieved successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to get QR code',
			}
		}
	} catch (error) {
		console.error('❌ Error getting table QR code:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Regenerate QR code for a specific table (creates new token version)
 * Backend: POST /tenants/:tenantId/tables/:tableId/qrcode
 * @param {string} tableId - Table ID (UUID)
 * @returns {Promise} Response with new QR code URL
 */
export const regenerateTableQRAPI = async (tableId) => {
	try {
		const tenantId = getTenantId()
		const response = await apiClient.post(`/tenants/${tenantId}/tables/${tableId}/qrcode`)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			// Backend returns: { url, image, tableId, tableName, tokenVersion }
			return {
				success: true,
				url: data.url, // Scan URL
				image: data.image, // Base64 PNG
				tableId: data.tableId,
				tableName: data.tableName,
				tokenVersion: data.tokenVersion,
				message: message || 'QR code regenerated successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to regenerate QR code',
			}
		}
	} catch (error) {
		console.error('❌ Error regenerating table QR code:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Download QR code in specific format (PNG, PDF, SVG)
 * Backend: GET /tenants/:tenantId/tables/:tableId/qrcode/download?format=png|pdf|svg
 * @param {string} tableId - Table ID (UUID)
 * @param {string} format - Download format (png, pdf, svg)
 * @returns {Promise} File download initiated via browser
 */
export const downloadTableQRCodeAPI = async (tableId, format = 'png') => {
	try {
		const tenantId = getTenantId()
		const response = await apiClient.get(
			`/tenants/${tenantId}/tables/${tableId}/qrcode/download`,
			{
				params: { format },
				responseType: 'blob', // Important for file download
			},
		)

		// Create download link
		const blob = new Blob([response.data])
		const url = window.URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url

		// Extract filename from Content-Disposition header
		const contentDisposition = response.headers['content-disposition']
		let filename = `qr-code-${tableId}.${format}`
		if (contentDisposition) {
			const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
			if (filenameMatch) filename = filenameMatch[1]
		}

		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		return {
			success: true,
			message: 'QR code downloaded successfully',
		}
	} catch (error) {
		console.error('❌ Error downloading QR code:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Batch download QR codes for multiple tables
 * Backend: GET /tenants/:tenantId/tables/qrcode/batch-download?format=zip-png|zip-pdf|zip-svg|combined-pdf
 * @param {Array<string>} tableIds - Optional array of table IDs (if empty, downloads all)
 * @param {string} floorId - Optional floor ID to filter tables
 * @param {string} format - Batch format (zip-png, zip-pdf, zip-svg, combined-pdf)
 * @returns {Promise} File download initiated via browser
 */
export const batchDownloadQRCodesAPI = async (
	tableIds = null,
	floorId = null,
	format = 'combined-pdf',
) => {
	try {
		const tenantId = getTenantId()
		const params = { format }
		if (tableIds && tableIds.length > 0) params.tableIds = tableIds.join(',')
		if (floorId) params.floorId = floorId

		const response = await apiClient.get(
			`/tenants/${tenantId}/tables/qrcode/batch-download`,
			{
				params,
				responseType: 'blob', // Important for file download
			},
		)

		// Create download link
		const blob = new Blob([response.data])
		const url = window.URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url

		// Extract filename from Content-Disposition header
		const contentDisposition = response.headers['content-disposition']
		let filename = `qr-codes-batch.${format.includes('pdf') ? 'pdf' : 'zip'}`
		if (contentDisposition) {
			const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
			if (filenameMatch) filename = filenameMatch[1]
		}

		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		return {
			success: true,
			message: 'QR codes downloaded successfully',
		}
	} catch (error) {
		console.error('❌ Error batch downloading QR codes:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Bulk regenerate QR codes for multiple tables
 * Backend: POST /tenants/:tenantId/tables/qrcode/bulk-regenerate
 * @param {Array<string>} tableIds - Optional array of table IDs to regenerate (if empty, regenerates all)
 * @param {string} floorId - Optional floor ID to filter tables
 * @returns {Promise} Response with regeneration result
 */
export const bulkRegenerateQRCodesAPI = async (tableIds = null, floorId = null) => {
	try {
		const tenantId = getTenantId()
		// ✅ Backend endpoint: POST /tenants/:tenantId/tables/qrcode/bulk-regenerate
		const payload = {}
		if (tableIds && tableIds.length > 0) payload.tableIds = tableIds
		if (floorId) payload.floorId = floorId

		const response = await apiClient.post(
			`/tenants/${tenantId}/tables/qrcode/bulk-regenerate`,
			payload,
		)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			// Backend returns: { tableCount, tableIds, failedCount, failedTableIds, success }
			return {
				success: data.success,
				regeneratedCount: data.tableCount || 0,
				tableIds: data.tableIds || [],
				failedCount: data.failedCount || 0,
				failedTableIds: data.failedTableIds || [],
				message:
					message ||
					`Successfully regenerated ${data.tableCount} QR code(s)${
						data.failedCount > 0 ? `, ${data.failedCount} failed` : ''
					}`,
			}
		} else {
			return {
				success: false,
				regeneratedCount: 0,
				message: message || 'Failed to regenerate QR codes',
			}
		}
	} catch (error) {
		console.error('❌ Error regenerating QR codes:', error)
		return {
			success: false,
			regeneratedCount: 0,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Validate QR scan token (public endpoint)
 * Backend: GET /tenants/:tenantId/tables/scan/:token
 * @param {string} token - QR code token
 * @returns {Promise} Response with table info and redirect URL
 */
export const validateQRScanAPI = async (token) => {
	try {
		const tenantId = getTenantId()
		const response = await apiClient.get(`/tenants/${tenantId}/tables/scan/${token}`)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				tableId: data.tableId,
				tableName: data.tableName,
				redirect: data.redirect,
				message: message || 'QR code validated successfully',
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				message: message || 'Invalid QR code',
			}
		}
	} catch (error) {
		console.error('❌ Error validating QR scan:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'QR code validation failed',
		}
	}
}

/**
 * Download QR code image for a table
 * @param {string} qrCodeUrl - QR code URL
 * @param {string} tableName - Table name for filename
 * @returns {Promise<boolean>} Success status
 */
export const downloadTableQRCode = async (qrCodeUrl, tableName) => {
	try {
		// Fetch the image as blob
		const response = await fetch(qrCodeUrl)
		const blob = await response.blob()

		// Create download link
		const url = window.URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = `${tableName}_QR.png`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		return true
	} catch (error) {
		console.error('❌ Error downloading QR code:', error)
		return false
	}
}

/**
 * Print QR code for a table
 * @param {string} qrCodeUrl - QR code URL
 * @param {string} tableName - Table name
 * @param {Object} tableInfo - Additional table information
 */
export const printTableQRCode = (qrCodeUrl, tableName, tableInfo = {}) => {
	// Create print window
	const printWindow = window.open('', '_blank', 'width=800,height=600')

	if (!printWindow) {
		alert('Vui lòng cho phép popup để in QR code')
		return
	}

	// Build print content
	const printContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>In QR Code - ${tableName}</title>
			<style>
				body {
					font-family: Arial, sans-serif;
					display: flex;
					justify-content: center;
					align-items: center;
					min-height: 100vh;
					margin: 0;
					padding: 20px;
					background: white;
				}
				.qr-container {
					text-align: center;
					page-break-after: always;
				}
				.qr-title {
					font-size: 28px;
					font-weight: bold;
					margin-bottom: 10px;
					color: #1a202c;
				}
				.qr-subtitle {
					font-size: 16px;
					color: #4a5568;
					margin-bottom: 20px;
				}
				.qr-image {
					max-width: 400px;
					width: 100%;
					height: auto;
					border: 2px solid #e2e8f0;
					border-radius: 8px;
					padding: 20px;
					background: white;
				}
				.qr-info {
					margin-top: 20px;
					font-size: 14px;
					color: #718096;
				}
				@media print {
					body {
						background: white;
					}
					.no-print {
						display: none;
					}
				}
			</style>
		</head>
		<body>
			<div class="qr-container">
				<div class="qr-title">${tableName}</div>
				${
					tableInfo.location
						? `<div class="qr-subtitle">Vị trí: ${tableInfo.location}</div>`
						: ''
				}
				${
					tableInfo.capacity
						? `<div class="qr-subtitle">Sức chứa: ${tableInfo.capacity} người</div>`
						: ''
				}
				<img src="${qrCodeUrl}" alt="QR Code" class="qr-image" />
				<div class="qr-info">
					Quét mã QR để xem thông tin bàn và đặt món
				</div>
			</div>
			<script>
				window.onload = function() {
					setTimeout(function() {
						window.print();
					}, 500);
				};
				window.onafterprint = function() {
					window.close();
				};
			</script>
		</body>
		</html>
	`

	printWindow.document.write(printContent)
	printWindow.document.close()
}

/**
 * Download all table QR codes as a ZIP file
 * @param {Array} tables - Array of table objects with qrCodeUrl
 * @returns {Promise<boolean>} Success status
 */
export const downloadAllTableQRCodes = async (tables) => {
	try {
		// Import JSZip dynamically (needs to be installed: npm install jszip)
		const JSZip = (await import('jszip')).default
		const zip = new JSZip()

		// Folder name with timestamp
		const folderName = `QR_Codes_${new Date().toISOString().split('T')[0]}`
		const qrFolder = zip.folder(folderName)

		// Download all QR codes and add to zip
		const downloadPromises = tables.map(async (table) => {
			if (!table.qrCodeUrl) return

			try {
				// Fetch QR image
				const response = await fetch(table.qrCodeUrl)
				const blob = await response.blob()

				// Add to zip with table name
				const fileName = `${table.name.replace(/[^a-z0-9]/gi, '_')}_QR.png`
				qrFolder.file(fileName, blob)

				return { success: true, table: table.name }
			} catch (error) {
				console.error(`Failed to download QR for ${table.name}:`, error)
				return { success: false, table: table.name }
			}
		})

		// Wait for all downloads
		const results = await Promise.all(downloadPromises)
		const successCount = results.filter((r) => r?.success).length

		console.log(`Downloaded ${successCount}/${tables.length} QR codes`)

		// Generate zip file
		const zipBlob = await zip.generateAsync({ type: 'blob' })

		// Trigger download
		const url = window.URL.createObjectURL(zipBlob)
		const link = document.createElement('a')
		link.href = url
		link.download = `${folderName}.zip`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		return true
	} catch (error) {
		console.error('❌ Error downloading all QR codes:', error)

		// Fallback: show error and suggest manual download
		if (error.message?.includes('Cannot find module')) {
			alert(
				'Chức năng tải ZIP cần cài đặt thư viện JSZip. Vui lòng liên hệ quản trị viên.',
			)
		}

		return false
	}
}

/**
 * Print all table QR codes in a single print job
 * @param {Array} tables - Array of table objects with qrCodeUrl and info
 */
export const printAllTableQRCodes = (tables) => {
	// Create print window
	const printWindow = window.open('', '_blank', 'width=800,height=600')

	if (!printWindow) {
		alert('Vui lòng cho phép popup để in QR code')
		return
	}

	// Build QR containers for all tables
	const qrContainers = tables
		.filter((table) => table.qrCodeUrl)
		.map(
			(table) => `
			<div class="qr-container">
				<div class="qr-title">${table.name}</div>
				${table.location ? `<div class="qr-subtitle">Vị trí: ${table.location}</div>` : ''}
				${
					table.capacity
						? `<div class="qr-subtitle">Sức chứa: ${table.capacity} người</div>`
						: ''
				}
				<img src="${table.qrCodeUrl}" alt="QR Code ${
				table.name
			}" class="qr-image" onerror="this.src='https://via.placeholder.com/400x400?text=QR+Error'" />
				<div class="qr-info">
					Quét mã QR để xem thông tin bàn và đặt món
				</div>
			</div>
		`,
		)
		.join('')

	// Build print content with all QR codes
	const printContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<title>In tất cả QR Code - ${tables.length} bàn</title>
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
				body {
					font-family: Arial, sans-serif;
					background: white;
				}
				.qr-container {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					min-height: 100vh;
					padding: 40px 20px;
					page-break-after: always;
					page-break-inside: avoid;
				}
				.qr-container:last-child {
					page-break-after: auto;
				}
				.qr-title {
					font-size: 32px;
					font-weight: bold;
					margin-bottom: 10px;
					color: #1a202c;
					text-align: center;
				}
				.qr-subtitle {
					font-size: 18px;
					color: #4a5568;
					margin-bottom: 10px;
					text-align: center;
				}
				.qr-image {
					max-width: 450px;
					width: 100%;
					height: auto;
					border: 3px solid #e2e8f0;
					border-radius: 12px;
					padding: 20px;
					background: white;
					box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
					margin: 20px 0;
				}
				.qr-info {
					margin-top: 20px;
					font-size: 16px;
					color: #718096;
					text-align: center;
					max-width: 400px;
				}
				@media print {
					body {
						background: white;
					}
					.qr-container {
						min-height: 100vh;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					.no-print {
						display: none;
					}
				}
			</style>
		</head>
		<body>
			${qrContainers}
			<script>
				window.onload = function() {
					// Wait for all images to load before printing
					const images = document.querySelectorAll('img');
					let loadedCount = 0;
					
					images.forEach(img => {
						if (img.complete) {
							loadedCount++;
						} else {
							img.onload = () => {
								loadedCount++;
								if (loadedCount === images.length) {
									setTimeout(() => window.print(), 500);
								}
							};
							img.onerror = () => {
								loadedCount++;
								if (loadedCount === images.length) {
									setTimeout(() => window.print(), 500);
								}
							};
						}
					});
					
					if (loadedCount === images.length) {
						setTimeout(() => window.print(), 500);
					}
				};
				window.onafterprint = function() {
					window.close();
				};
			</script>
		</body>
		</html>
	`

	printWindow.document.write(printContent)
	printWindow.document.close()
}
