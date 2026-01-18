import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './contexts/UserContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { AlertProvider } from './contexts/AlertContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { KitchenSocketProvider } from './contexts/KitchenSocketContext'
import ProtectedRoute from './routes/ProtectedRoute'

import UnifiedLogin from './pages/auth/UnifiedLogin'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import RestaurantSetupWizard from './pages/onboarding/RestaurantSetupWizard'
import EmailConfirmation from './pages/onboarding/EmailConfirmation'
import KYCCallback from './pages/kyc/KYCCallback'
import GoogleAuthenticate from './pages/auth/GoogleAuthenticate/GoogleAuthenticate'
import SetPassword from './pages/auth/SetPassword/SetPassword'
import CustomerLogin from './pages/auth/CustomerLogin/CustomerLogin'

import Dashboard from './pages/admin/Dashboard'
import TenantManagementListView from './pages/admin/tenant-management/TenantManagementListView'
import SystemSettings from './pages/admin/settings/SystemSettings'

import Menu from './pages/user/menu/Menu'
import CategoryDishes from './pages/user/menu/CategoryDishes'
import TableManagement from './pages/user/table/TableManagement'
import OrderManagement from './pages/user/order/OrderManagement'
import HelpRequests from './pages/user/notifications/HelpRequests'
import Reports from './pages/user/analytics/Reports'
import Settings from './pages/user/settings/Settings'
import Profile from './pages/profile/Profile'

import OrderingInterface from './pages/customer/ordering/OrderingInterface'
import QRScanHandler from './pages/customer/scan/QRScanHandler'
import RestaurantQRHandler from './pages/customer/scan/RestaurantQRHandler'
import SelectTable from './pages/customer/scan/SelectTable'

import RestaurantQRGenerator from './pages/user/qr/RestaurantQRGenerator'
import KitchenManagement from './pages/user/kitchen/KitchenManagement'

// Kitchen Display System
import KitchenDisplay from './pages/kitchen/KitchenDisplay'

// Waiter Panel
import WaiterPanel from './pages/waiter/WaiterPanel'

/**
 * Role-based redirect component
 * Redirects users to appropriate dashboard based on their role and tenant context
 */
const RoleBasedRedirect = () => {
	const { user, loading } = useUser()

	if (loading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading...</p>
			</div>
		)
	}

	if (!user) {
		return <Navigate to="/login" replace />
	}

	const roles = user.roles || []
	const userOwnerId = user.ownerId || localStorage.getItem('currentTenantId')

	// Admin redirect to dashboard
	if (roles.includes('ADMIN') || user.role?.toLowerCase().includes('administrator')) {
		return <Navigate to="/admin/dashboard" replace />
	}

	// Chef redirect to kitchen (with tenant context) - STRICT: must have ownerId
	if (roles.includes('CHEF')) {
		if (userOwnerId) {
			return <Navigate to={`/r/${userOwnerId}/kitchen`} replace />
		}
		// SECURITY: Chef without ownerId = invalid session, clear and redirect to login
		console.warn('🚫 Chef without ownerId - clearing session')
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

	// Staff redirect to waiter panel (with tenant context) - STRICT: must have ownerId
	if (roles.includes('STAFF')) {
		if (userOwnerId) {
			return <Navigate to={`/r/${userOwnerId}/waiter`} replace />
		}
		// SECURITY: Staff without ownerId = invalid session, clear and redirect to login
		console.warn('🚫 Staff without ownerId - clearing session')
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

	// Customer redirect to ordering interface (with tenant context) - STRICT: must have ownerId
	if (roles.includes('CUSTOMER')) {
		if (userOwnerId) {
			return <Navigate to={`/r/${userOwnerId}/order/table/0`} replace />
		}
		// SECURITY: Customer without ownerId = invalid session, clear and redirect to login
		console.warn('🚫 Customer without ownerId - clearing session')
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

	// User (Owner) redirect to menu - ONLY for USER role explicitly
	if (roles.includes('USER')) {
		return <Navigate to="/user/menu" replace />
	}

	// SECURITY: Unknown role - don't default to user/menu, redirect to login
	console.warn('🚫 Unknown role detected - redirecting to login:', roles)
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

function App() {
	return (
		<ThemeProvider>
			<UserProvider>
				<LoadingProvider>
					<AlertProvider>
						<NotificationProvider>
							<BrowserRouter>
								<Routes>
									{/* ========== Authentication Routes ========== */}
									{/* Unified login - handles all roles */}
									<Route path="/login" element={<UnifiedLogin />} />
									{/* Login with tenant context (Staff/Chef/Customer) */}
									<Route path="/login/:ownerId" element={<UnifiedLogin />} />

									{/* Legacy customer login routes (redirect to unified) */}
									<Route path="/customer-login" element={<CustomerLogin />} />
									<Route path="/customer-login/:ownerId" element={<CustomerLogin />} />

									{/* Other auth routes */}
									<Route path="/signup" element={<SignUp />} />
									<Route path="/customer-signup/:ownerId" element={<SignUp />} />
									<Route path="/forgot-password" element={<ForgotPassword />} />
									<Route path="/reset-password" element={<ResetPassword />} />
									<Route path="/onboarding" element={<RestaurantSetupWizard />} />
									<Route path="/email-confirmation" element={<EmailConfirmation />} />

									{/* ========== QR Code Scan Routes ========== */}
									<Route
										path="/tenants/:tenantId/tables/scan/:token"
										element={<QRScanHandler />}
									/>

									<Route
										path="/restaurant/:ownerId/:token/:tableNumber"
										element={<RestaurantQRHandler />}
									/>

									{/* Fallback route for QR without table number */}
									<Route
										path="/restaurant/:ownerId/:token"
										element={<RestaurantQRHandler />}
									/>

									{/* Table selection after restaurant QR login */}
									<Route path="/select-table/:ownerId" element={<SelectTable />} />

									{/* Customer ordering interface */}
									<Route
										path="/order/:tenantId/table/:tableId"
										element={<OrderingInterface />}
									/>

									{/* ========== Admin Routes ========== */}
									<Route
										path="/admin/dashboard"
										element={
											<ProtectedRoute allowedRoles={['Super Administrator']}>
												<TenantManagementListView />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/admin/tenant-management"
										element={
											<ProtectedRoute allowedRoles={['Super Administrator']}>
												<TenantManagementListView />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/admin/user-management"
										element={
											<ProtectedRoute allowedRoles={['Super Administrator']}>
												{/* TODO: Create UserManagement component */}
												<div className="flex min-h-screen bg-[#101922] items-center justify-center">
													<p className="text-white text-xl">
														👥 User Management - Coming Soon
													</p>
												</div>
											</ProtectedRoute>
										}
									/>
									<Route
										path="/admin/settings"
										element={
											<ProtectedRoute allowedRoles={['Super Administrator']}>
												<SystemSettings />
											</ProtectedRoute>
										}
									/>

									{/* User routes - Only for User role */}
									<Route
										path="/user/menu"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<Menu />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/user/menu/:categorySlug"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<CategoryDishes />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/user/table"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<TableManagement />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/user/restaurant-qr"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<RestaurantQRGenerator />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/user/order"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<OrderManagement />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/user/kitchen"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<KitchenManagement />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/user/help-requests"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<HelpRequests />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/user/analytics"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<Reports />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/user/settings"
										element={
											<ProtectedRoute allowedRoles={['User']}>
												<Settings />
											</ProtectedRoute>
										}
									/>

									{/* ========== Multi-tenant Routes (/r/:ownerId/...) ========== */}
									{/* Kitchen Display System - For Chef role */}
									<Route
										path="/r/:ownerId/kitchen"
										element={
											<ProtectedRoute allowedRoles={['User', 'Chef']} requireTenant>
												<KitchenSocketProvider>
													<KitchenDisplay />
												</KitchenSocketProvider>
											</ProtectedRoute>
										}
									/>

									{/* Waiter Panel - For Staff role */}
									<Route
										path="/r/:ownerId/waiter"
										element={
											<ProtectedRoute allowedRoles={['User', 'Staff']} requireTenant>
												<WaiterPanel />
											</ProtectedRoute>
										}
									/>

									{/* Customer Order Interface - Multi-tenant */}
									<Route
										path="/r/:ownerId/order/table/:tableId"
										element={<OrderingInterface />}
									/>

									{/* Legacy routes - redirect to new pattern */}
									<Route path="/kitchen" element={<RoleBasedRedirect />} />
									<Route path="/waiter" element={<RoleBasedRedirect />} />

									{/* Profile - Available for both roles */}
									<Route
										path="/profile"
										element={
											<ProtectedRoute>
												<Profile />
											</ProtectedRoute>
										}
									/>

									{/* 404 - Redirect to role-based home */}
									<Route path="*" element={<RoleBasedRedirect />} />
								</Routes>
							</BrowserRouter>
						</NotificationProvider>
					</AlertProvider>
				</LoadingProvider>
			</UserProvider>
		</ThemeProvider>
	)
}

export default App
