// services/api/tableAPI.js
// Table Management API Service - Profile Service via API Gateway

import apiClient from '../apiClient'

/**
 * Get tables by floor
 * @param {number} floor - Floor number
 * @returns {Promise} Response with tables array and total floors
 */
export const getTablesAPI = async (floor) => {
	try {
		const response = await apiClient.get(`/profile/tables?floor=${floor}`)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				tables: data.tables || [],
				totalFloors: data.totalFloors || 1,
				message,
			}
		} else {
			console.warn('⚠️ Unexpected response:', response.data)
			return {
				success: false,
				tables: [],
				totalFloors: 1,
				message: message || 'Failed to fetch tables',
			}
		}
	} catch (error) {
		console.error('❌ Error fetching tables:', error)
		return {
			success: false,
			tables: [],
			totalFloors: 1,
			message: error?.response?.data?.message || 'Network error',
		}
	}
}

/**
 * Create new table
 * @param {Object} tableData - Table data
 * @param {number} tableData.id - Table ID
 * @param {string} tableData.name - Table name
 * @param {number} tableData.floor - Floor number
 * @param {number} tableData.gridX - Grid X position
 * @param {number} tableData.gridY - Grid Y position
 * @param {string} tableData.status - Table status (Available, Occupied, Cleaning)
 * @returns {Promise} Response with created table
 */
export const createTableAPI = async (tableData) => {
	try {
		const response = await apiClient.post('/profile/tables', tableData)
		const { code, message, data } = response.data

		if (code === 1000 || code === 200 || code === 201) {
			return {
				success: true,
				table: data,
				message: message || 'Table created successfully',
			}
		} else {
			return {
				success: false,
				message: message || 'Failed to create table',
			}
		}
	} catch (error) {
		console.error('❌ Error creating table:', error)
		return {
			success: false,
			message: error?.response?.data?.message || 'Network error',
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
		const response = await apiClient.put(`/profile/tables/${tableId}/status`, {
			status,
		})
		const { code, message, data } = response.data

		if (code === 1000 || code === 200) {
			return {
				success: true,
				table: data,
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
export const updateTablePositionAPI = async (tableId, gridX, gridY, floor) => {
	try {
		const response = await apiClient.put(`/profile/tables/${tableId}/position`, {
			gridX,
			gridY,
			floor,
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

		const response = await apiClient.put('/profile/tables/layout', {
			floor,
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
		const response = await apiClient.delete(`/profile/tables/${tableId}`)
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
export const createFloorAPI = async (floorNumber) => {
	try {
		const response = await apiClient.post('/profile/tables/floors', {
			floorNumber,
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
export const updateGridConfigAPI = async (floor, rows, cols) => {
	try {
		const response = await apiClient.put('/profile/tables/grid-config', {
			floor,
			rows,
			cols,
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
