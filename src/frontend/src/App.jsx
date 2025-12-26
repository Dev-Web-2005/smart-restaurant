import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './contexts/UserContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { AlertProvider } from './contexts/AlertContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './routes/ProtectedRoute'

// Import pages
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import RestaurantSetupWizard from './pages/onboarding/RestaurantSetupWizard'
import KYCCallback from './pages/kyc/KYCCallback'

// Admin pages
import Dashboard from './pages/admin/Dashboard'
import TenantManagementListView from './pages/admin/tenant-management/TenantManagementListView'
import SystemSettings from './pages/admin/settings/SystemSettings'

// User pages
import Menu from './pages/user/menu/Menu'
import CategoryDishes from './pages/user/menu/CategoryDishes'
import TableManagement from './pages/user/table/TableManagement'
import OrderManagement from './pages/user/order/OrderManagement'
import Reports from './pages/user/analytics/Reports'
import Settings from './pages/user/settings/Settings'
import Profile from './pages/profile/Profile'

// Customer pages (public)
import OrderingInterface from './pages/customer/ordering/OrderingInterface'

// Component chuyển hướng dựa trên role
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

	// Admin redirect to dashboard, User redirect to menu
	if (user.role.toLowerCase().includes('administrator')) {
		return <Navigate to="/admin/dashboard" replace />
	} else {
		return <Navigate to="/user/menu" replace />
	}
}

function App() {
	return (
		<ThemeProvider>
			<UserProvider>
				<LoadingProvider>
					<AlertProvider>
						<BrowserRouter>
							<Routes>
								{/* Public routes */}
								<Route path="/login" element={<Login />} />
								<Route path="/signup" element={<SignUp />} />
								<Route path="/onboarding" element={<RestaurantSetupWizard />} />
								<Route path="/kyc/callback" element={<KYCCallback />} />

								{/* Customer ordering - Public route (no auth required) */}
								<Route path="/order/:tenantId/:tableId" element={<OrderingInterface />} />

								{/* Root redirect based on role */}
								<Route path="/" element={<RoleBasedRedirect />} />

								{/* Admin routes - Only for Super Administrator */}
								<Route
									path="/admin/dashboard"
									element={
										<ProtectedRoute allowedRoles={['Super Administrator']}>
											<Dashboard />
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
									path="/user/order"
									element={
										<ProtectedRoute allowedRoles={['User']}>
											<OrderManagement />
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
					</AlertProvider>
				</LoadingProvider>
			</UserProvider>
		</ThemeProvider>
	)
}

export default App
