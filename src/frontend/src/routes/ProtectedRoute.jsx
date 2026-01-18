import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

/**
 * ProtectedRoute - Multi-tenant aware route protection
 *
 * Features:
 * - Role-based access control
 * - Tenant context validation for Staff/Chef/Customer
 * - Smart redirects based on user role and tenant
 *
 * Multi-tenant URL pattern: /r/:ownerId/...
 * - /r/:ownerId/kitchen - Chef kitchen display
 * - /r/:ownerId/waiter - Staff waiter panel
 * - /r/:ownerId/order/table/:tableId - Customer ordering
 */
const ProtectedRoute = ({ children, allowedRoles = [], requireTenant = false }) => {
	const { user, loading } = useUser()
	const { ownerId, tenantId } = useParams()

	if (loading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading...</p>
			</div>
		)
	}

	// Get tenant context from URL or storage
	const urlTenantId = ownerId || tenantId
	const storedTenantId = localStorage.getItem('currentTenantId')
	const currentTenantId = urlTenantId || storedTenantId

	// Nếu chưa đăng nhập, chuyển về login
	if (!user) {
		// If there's a tenant context in URL, redirect to tenant login
		if (currentTenantId) {
			return <Navigate to={`/login/${currentTenantId}`} replace />
		}
		return <Navigate to="/login" replace />
	}

	// Map role từ backend sang frontend - STRICT validation
	const getUserRole = () => {
		// Always prefer roles array from backend
		const roles = user.roles || []

		// Check for ADMIN role first (highest priority)
		if (roles.includes('ADMIN')) return 'Super Administrator'
		// Check for CHEF role - tenant-specific role
		if (roles.includes('CHEF')) return 'Chef'
		// Check for STAFF (waiter) role - tenant-specific role
		if (roles.includes('STAFF')) return 'Staff'
		// Check for CUSTOMER role - tenant-specific role
		if (roles.includes('CUSTOMER')) return 'Customer'
		// Check for USER (restaurant owner) role
		if (roles.includes('USER')) return 'User'

		// Fallback to user.role if roles array is empty (legacy support)
		// But validate it's a known role
		const knownRoles = ['Super Administrator', 'Chef', 'Staff', 'Customer', 'User']
		if (user.role && knownRoles.includes(user.role)) {
			return user.role
		}

		// SECURITY: Unknown role - return null to trigger redirect to login
		return null
	}

	const userRole = getUserRole()

	// SECURITY: If role is unknown/invalid, redirect to login
	if (!userRole) {
		console.warn('🚫 Invalid or unknown user role - redirecting to login')
		localStorage.removeItem('user')
		localStorage.removeItem('currentTenantId')
		return (
			<Navigate
				to="/login"
				replace
				state={{ error: 'Invalid session. Please login again.' }}
			/>
		)
	}

	// Admin không có ownerId - chỉ USER (owner) mới là ownerId của restaurant
	// Chef/Staff/Customer có ownerId = userId của owner (nhà hàng họ thuộc về)
	const isAdmin = userRole === 'Super Administrator'
	const userOwnerId = isAdmin ? null : user.ownerId || storedTenantId

	// ========== SECURITY: STRICT ROLE-BASED ACCESS CONTROL ==========
	// Chef can ONLY access kitchen routes with tenant context
	// Staff can ONLY access waiter routes with tenant context
	// Customer can ONLY access ordering routes with tenant context

	const isTenantSpecificRole = ['Chef', 'Staff', 'Customer'].includes(userRole)

	// SECURITY: Tenant-specific roles MUST have ownerId to access any page
	if (isTenantSpecificRole && !userOwnerId) {
		console.warn(`🚫 ${userRole} role requires tenant context - redirecting to login`)
		localStorage.removeItem('user')
		localStorage.removeItem('currentTenantId')
		return (
			<Navigate
				to="/login"
				replace
				state={{ error: 'Session expired. Please login via your restaurant login page.' }}
			/>
		)
	}

	// SECURITY: Tenant-specific roles MUST access via tenant URL (/r/:ownerId/...)
	// Block direct access to non-tenant routes like /user/menu
	if (isTenantSpecificRole && !urlTenantId) {
		console.warn(
			`🚫 ${userRole} trying to access non-tenant route - redirecting to proper route`,
		)
		// Force redirect to their correct tenant-specific page
		if (userRole === 'Chef') {
			return <Navigate to={`/r/${userOwnerId}/kitchen`} replace />
		} else if (userRole === 'Staff') {
			return <Navigate to={`/r/${userOwnerId}/waiter`} replace />
		} else if (userRole === 'Customer') {
			return <Navigate to={`/r/${userOwnerId}/order/table/0`} replace />
		}
	}

	// Validate tenant access - user must belong to the restaurant they're accessing
	if (requireTenant) {
		// Must have tenant context
		if (!userOwnerId) {
			return <Navigate to="/login" replace state={{ error: 'Tenant context required' }} />
		}

		// If URL has ownerId, validate it matches user's ownerId
		if (urlTenantId && userOwnerId !== urlTenantId) {
			console.warn(
				`🚫 Tenant mismatch: User belongs to ${userOwnerId} but accessing ${urlTenantId}`,
			)
			// Redirect to correct tenant URL based on role
			if (userRole === 'Chef') {
				return <Navigate to={`/r/${userOwnerId}/kitchen`} replace />
			} else if (userRole === 'Staff') {
				return <Navigate to={`/r/${userOwnerId}/waiter`} replace />
			} else if (userRole === 'Customer') {
				return <Navigate to={`/r/${userOwnerId}/order/table/0`} replace />
			}
			return <Navigate to={`/r/${userOwnerId}/kitchen`} replace />
		}
	}

	// Nếu có yêu cầu về role và user không có role phù hợp
	if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
		// Redirect based on role with tenant context
		let redirectPath = '/login'

		if (userRole === 'Super Administrator') {
			redirectPath = '/admin/dashboard'
		} else if (userRole === 'Chef' && userOwnerId) {
			redirectPath = `/r/${userOwnerId}/kitchen`
		} else if (userRole === 'Staff' && userOwnerId) {
			redirectPath = `/r/${userOwnerId}/waiter`
		} else if (userRole === 'User') {
			redirectPath = '/user/menu'
		} else if (userRole === 'Customer' && userOwnerId) {
			redirectPath = `/r/${userOwnerId}/order/table/0`
		}

		return <Navigate to={redirectPath} replace />
	}

	// Store tenant context if from URL
	if (urlTenantId && urlTenantId !== storedTenantId) {
		localStorage.setItem('currentTenantId', urlTenantId)
	}

	return children
}

export default ProtectedRoute
