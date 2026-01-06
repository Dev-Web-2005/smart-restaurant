import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './contexts/UserContext'
import { LoadingProvider } from './contexts/LoadingContext'
import { AlertProvider } from './contexts/AlertContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ProtectedRoute from './routes/ProtectedRoute'

import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import RestaurantSetupWizard from './pages/onboarding/RestaurantSetupWizard'
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
						<NotificationProvider>
							<BrowserRouter>
								<Routes>
								<Route path="/login" element={<Login />} />
								<Route path="/signup" element={<SignUp />} />
								<Route path="/forgot-password" element={<ForgotPassword />} />
								<Route path="/reset-password" element={<ResetPassword />} />
								<Route path="/onboarding" element={<RestaurantSetupWizard />} />
								<Route path="/kyc/callback" element={<KYCCallback />} />
								<Route path="/google-authenticate" element={<GoogleAuthenticate />} />
								<Route path="/set-password" element={<SetPassword />} />
								
								{/* Customer Login Routes */}
								<Route path="/customer-login" element={<CustomerLogin />} />
								<Route path="/customer-login/:ownerId" element={<CustomerLogin />} />

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
				<Route
					path="/select-table/:ownerId"
					element={<SelectTable />}
				/>

				{/* Customer ordering interface */}
				<Route
					path="/order/:tenantId/table/:tableId"
					element={<OrderingInterface />}
				/>

									<Route
										path="/admin/dashboard"
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
