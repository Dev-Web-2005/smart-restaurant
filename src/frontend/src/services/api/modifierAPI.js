import apiClient from '../apiClient'

// ==================== MODIFIER GROUPS ====================

/**
 * Create a new modifier group
 * @param {string} tenantId - Tenant ID
 * @param {Object} data - Modifier group data
 * @param {string} data.name - Group name (2-100 characters) *required
 * @param {string} [data.description] - Group description
 * @param {number} [data.displayOrder] - Display order (min: 0)
 * @param {boolean} [data.isActive] - Is active (default: true)
 * @returns {Promise<Object>} Created modifier group
 */
export const createModifierGroupAPI = async (tenantId, data) => {
	// Validation
	if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 100) {
		throw new Error('Group name must be between 2 and 100 characters')
	}
	if (data.displayOrder !== undefined && data.displayOrder < 0) {
		throw new Error('Display order must be >= 0')
	}

	try {
		const response = await apiClient.post(`/tenants/${tenantId}/modifier-groups`, {
			name: data.name.trim(),
			description: data.description?.trim() || undefined,
			displayOrder:
				data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
			isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
		})

		return response.data
	} catch (error) {
		console.error(
			'❌ Error creating modifier group:',
			error.response?.data || error.message,
		)
		throw error
	}
}

/**
 * Get all modifier groups for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} [params] - Query parameters
 * @param {boolean} [params.isActive] - Filter by active status
 * @param {string} [params.search] - Search by name
 * @returns {Promise<Array>} List of modifier groups
 */
export const getModifierGroupsAPI = async (tenantId, params = {}) => {
	try {
		const queryParams = new URLSearchParams()
		if (params.isActive !== undefined) {
			queryParams.append('isActive', params.isActive)
		}
		if (params.search) {
			queryParams.append('search', params.search.trim())
		}

		const url = `/tenants/${tenantId}/modifier-groups${
			queryParams.toString() ? `?${queryParams.toString()}` : ''
		}`

		const response = await apiClient.get(url)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error fetching modifier groups:',
			error.response?.data || error.message,
		)
		throw error
	}
}

/**
 * Update a modifier group
 * @param {string} tenantId - Tenant ID
 * @param {string} groupId - Modifier group ID
 * @param {Object} data - Updated data
 * @param {string} [data.name] - Group name (2-100 characters)
 * @param {string} [data.description] - Group description
 * @param {number} [data.displayOrder] - Display order (min: 0)
 * @param {boolean} [data.isActive] - Is active
 * @returns {Promise<Object>} Updated modifier group
 */
export const updateModifierGroupAPI = async (tenantId, groupId, data) => {
	// Validation
	if (
		data.name !== undefined &&
		(data.name.trim().length < 2 || data.name.trim().length > 100)
	) {
		throw new Error('Group name must be between 2 and 100 characters')
	}
	if (data.displayOrder !== undefined && data.displayOrder < 0) {
		throw new Error('Display order must be >= 0')
	}

	try {
		const updateData = {}
		if (data.name !== undefined) updateData.name = data.name.trim()
		if (data.description !== undefined)
			updateData.description = data.description?.trim() || undefined
		if (data.displayOrder !== undefined)
			updateData.displayOrder = Number(data.displayOrder)
		if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive)

		const response = await apiClient.patch(
			`/tenants/${tenantId}/modifier-groups/${groupId}`,
			updateData,
		)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error updating modifier group:',
			error.response?.data || error.message,
		)
		throw error
	}
}

/**
 * Delete a modifier group
 * @param {string} tenantId - Tenant ID
 * @param {string} groupId - Modifier group ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteModifierGroupAPI = async (tenantId, groupId) => {
	try {
		const response = await apiClient.delete(
			`/tenants/${tenantId}/modifier-groups/${groupId}`,
		)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error deleting modifier group:',
			error.response?.data || error.message,
		)
		throw error
	}
}

// ==================== MODIFIER OPTIONS ====================

/**
 * Create a new modifier option
 * @param {string} tenantId - Tenant ID
 * @param {string} groupId - Modifier group ID
 * @param {Object} data - Modifier option data
 * @param {string} data.label - Option label (2-100 characters) *required
 * @param {number} [data.priceDelta] - Price adjustment (-999999 to 999999)
 * @param {number} [data.displayOrder] - Display order (min: 0)
 * @param {boolean} [data.isActive] - Is active (default: true)
 * @returns {Promise<Object>} Created modifier option
 */
export const createModifierOptionAPI = async (tenantId, groupId, data) => {
	// Validation
	if (!data.label || data.label.trim().length < 2 || data.label.trim().length > 100) {
		throw new Error('Option label must be between 2 and 100 characters')
	}
	if (
		data.priceDelta !== undefined &&
		(data.priceDelta < -999999 || data.priceDelta > 999999)
	) {
		throw new Error('Price delta must be between -999999 and 999999')
	}
	if (data.displayOrder !== undefined && data.displayOrder < 0) {
		throw new Error('Display order must be >= 0')
	}

	try {
		const response = await apiClient.post(
			`/tenants/${tenantId}/modifier-groups/${groupId}/options`,
			{
				label: data.label.trim(),
				priceDelta: data.priceDelta !== undefined ? Number(data.priceDelta) : 0,
				displayOrder:
					data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
				isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
			},
		)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error creating modifier option:',
			error.response?.data || error.message,
		)
		throw error
	}
}

/**
 * Get all modifier options in a group
 * @param {string} tenantId - Tenant ID
 * @param {string} groupId - Modifier group ID
 * @param {Object} [params] - Query parameters
 * @param {boolean} [params.isActive] - Filter by active status
 * @returns {Promise<Array>} List of modifier options
 */
export const getModifierOptionsAPI = async (tenantId, groupId, params = {}) => {
	try {
		const queryParams = new URLSearchParams()
		if (params.isActive !== undefined) {
			queryParams.append('isActive', params.isActive)
		}

		const url = `/tenants/${tenantId}/modifier-groups/${groupId}/options${
			queryParams.toString() ? `?${queryParams.toString()}` : ''
		}`

		const response = await apiClient.get(url)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error fetching modifier options:',
			error.response?.data || error.message,
		)
		throw error
	}
}

/**
 * Update a modifier option
 * @param {string} tenantId - Tenant ID
 * @param {string} groupId - Modifier group ID
 * @param {string} optionId - Modifier option ID
 * @param {Object} data - Updated data
 * @param {string} [data.label] - Option label (2-100 characters)
 * @param {number} [data.priceDelta] - Price adjustment (-999999 to 999999)
 * @param {number} [data.displayOrder] - Display order (min: 0)
 * @param {boolean} [data.isActive] - Is active
 * @returns {Promise<Object>} Updated modifier option
 */
export const updateModifierOptionAPI = async (tenantId, groupId, optionId, data) => {
	// Validation
	if (
		data.label !== undefined &&
		(data.label.trim().length < 2 || data.label.trim().length > 100)
	) {
		throw new Error('Option label must be between 2 and 100 characters')
	}
	if (
		data.priceDelta !== undefined &&
		(data.priceDelta < -999999 || data.priceDelta > 999999)
	) {
		throw new Error('Price delta must be between -999999 and 999999')
	}
	if (data.displayOrder !== undefined && data.displayOrder < 0) {
		throw new Error('Display order must be >= 0')
	}

	try {
		const updateData = {}
		if (data.label !== undefined) updateData.label = data.label.trim()
		if (data.priceDelta !== undefined) updateData.priceDelta = Number(data.priceDelta)
		if (data.displayOrder !== undefined)
			updateData.displayOrder = Number(data.displayOrder)
		if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive)

		const response = await apiClient.patch(
			`/tenants/${tenantId}/modifier-groups/${groupId}/options/${optionId}`,
			updateData,
		)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error updating modifier option:',
			error.response?.data || error.message,
		)
		throw error
	}
}

/**
 * Delete a modifier option
 * @param {string} tenantId - Tenant ID
 * @param {string} groupId - Modifier group ID
 * @param {string} optionId - Modifier option ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteModifierOptionAPI = async (tenantId, groupId, optionId) => {
	try {
		const response = await apiClient.delete(
			`/tenants/${tenantId}/modifier-groups/${groupId}/options/${optionId}`,
		)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error deleting modifier option:',
			error.response?.data || error.message,
		)
		throw error
	}
}

// ==================== MENU ITEM MODIFIERS ====================

/**
 * Attach modifier groups to a menu item
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @param {Object} data - Attachment data
 * @param {Array} data.modifierGroups - Array of modifier group configurations
 * @param {string} data.modifierGroups[].modifierGroupId - Modifier group ID *required
 * @param {number} [data.modifierGroups[].displayOrder] - Display order (min: 0)
 * @param {boolean} [data.modifierGroups[].isRequired] - Is required selection
 * @param {number} [data.modifierGroups[].minSelections] - Min selections (min: 0)
 * @param {number} [data.modifierGroups[].maxSelections] - Max selections (min: 1)
 * @returns {Promise<Object>} Attachment result
 */
export const attachModifierGroupsAPI = async (tenantId, itemId, data) => {
	// Validation
	if (!Array.isArray(data.modifierGroups) || data.modifierGroups.length === 0) {
		throw new Error('modifierGroups must be a non-empty array')
	}

	for (const group of data.modifierGroups) {
		if (!group.modifierGroupId) {
			throw new Error('Each modifier group must have a modifierGroupId')
		}
		if (group.displayOrder !== undefined && group.displayOrder < 0) {
			throw new Error('Display order must be >= 0')
		}
		if (group.minSelections !== undefined && group.minSelections < 0) {
			throw new Error('Min selections must be >= 0')
		}
		if (group.maxSelections !== undefined && group.maxSelections < 1) {
			throw new Error('Max selections must be >= 1')
		}
	}

	try {
		const response = await apiClient.post(
			`/tenants/${tenantId}/items/${itemId}/modifiers`,
			{
				modifierGroups: data.modifierGroups.map((group) => ({
					modifierGroupId: group.modifierGroupId,
					displayOrder:
						group.displayOrder !== undefined ? Number(group.displayOrder) : undefined,
					isRequired: group.isRequired !== undefined ? Boolean(group.isRequired) : false,
					minSelections:
						group.minSelections !== undefined ? Number(group.minSelections) : 0,
					maxSelections:
						group.maxSelections !== undefined ? Number(group.maxSelections) : 1,
				})),
			},
		)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error attaching modifier groups:',
			error.response?.data || error.message,
		)
		throw error
	}
}

/**
 * Get modifier groups attached to a menu item
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @returns {Promise<Array>} List of attached modifier groups with configurations
 */
export const getMenuItemModifierGroupsAPI = async (tenantId, itemId) => {
	try {
		const response = await apiClient.get(`/tenants/${tenantId}/items/${itemId}/modifiers`)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error fetching menu item modifier groups:',
			error.response?.data || error.message,
		)
		throw error
	}
}

/**
 * Detach a modifier group from a menu item
 * @param {string} tenantId - Tenant ID
 * @param {string} itemId - Menu item ID
 * @param {string} groupId - Modifier group ID
 * @returns {Promise<Object>} Detachment result
 */
export const detachModifierGroupAPI = async (tenantId, itemId, groupId) => {
	try {
		const response = await apiClient.delete(
			`/tenants/${tenantId}/items/${itemId}/modifiers/${groupId}`,
		)

		return response.data
	} catch (error) {
		console.error(
			'❌ Error detaching modifier group:',
			error.response?.data || error.message,
		)
		throw error
	}
}
