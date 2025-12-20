import React from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

// ProtectedRoute - Yêu cầu người dùng đã đăng nhập
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
	const { user, loading } = useUser()

	if (loading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading...</p>
			</div>
		)
	}

	// Nếu chưa đăng nhập, chuyển về login
	if (!user) {
		return <Navigate to="/login" replace />
	}

	// Nếu có yêu cầu về role và user không có role phù hợp
	if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
		// Admin redirect to dashboard, User redirect to menu
		const redirectPath = user.role.toLowerCase().includes('administrator')
			? '/admin/dashboard'
			: '/user/menu'
		return <Navigate to={redirectPath} replace />
	}

	return children
}

export default ProtectedRoute
