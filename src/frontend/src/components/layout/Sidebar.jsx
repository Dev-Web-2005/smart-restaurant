// components/Sidebar.jsx (Phiên bản có toggle ẩn/hiện)

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// Menu cho Super Admin (Ví dụ)
const adminNavItems = [
	{ icon: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
	{
		icon: 'storefront',
		label: 'Tenant Management',
		route: '/admin/tenant-management',
	},
	{ icon: 'group', label: 'User Management', route: '/admin/user-management' },
	{ icon: 'settings', label: 'System Settings', route: '/admin/settings' },
]

// Menu cho Tenant Admin (Ví dụ, dựa trên code gốc bạn cung cấp)
const tenantNavItems = [
	{ icon: 'menu_book', label: 'Menu', route: '/user/menu' },
	{ icon: 'table_restaurant', label: 'Table', route: '/user/table' },
	{ icon: 'receipt_long', label: 'Order', route: '/user/order' },
	{ icon: 'analytics', label: 'Analytics', route: '/user/analytics' },
	{ icon: 'settings', label: 'Setting', route: '/user/settings' },
]

const Sidebar = ({ activeRoute, userProfile, handleLogout, isCollapsed, onToggle }) => {
	const navigate = useNavigate()
	const location = useLocation()

	// Comment: Mặc định, nếu userProfile là null (chưa load hoặc chưa đăng nhập), sử dụng giá trị placeholder
	const userName = userProfile?.name || 'Guest'
	const userRole = userProfile?.role || 'Loading Role...'

	// 💡 LOGIC QUYẾT ĐỊNH MENU DỰA TRÊN VAI TRÒ
	const isSuperAdmin = userRole.toLowerCase().includes('super administrator')
	const currentNavItems = isSuperAdmin ? adminNavItems : tenantNavItems

	// 🆕 Hàm xử lý click menu item để navigate
	const handleNavClick = (route) => {
		navigate(route)
	}

	// 🆕 Kiểm tra active route dựa trên location.pathname
	const isActiveRoute = (route) => {
		return location.pathname === route || location.pathname.startsWith(route + '/')
	}

	// Nếu là Tenant Admin, thay đổi tên Logo và Title cho phù hợp (Tùy chọn)

	return (
		<aside
			className={`bg-black/40 backdrop-blur-md flex flex-col fixed left-0 top-0 h-screen overflow-hidden transition-all duration-300 z-40 border-r border-white/10 ${
				isCollapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'
			}`}
		>
			{/* Phần trên: Logo và Navigation - có thể scroll nếu nội dung dài */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* User Profile Info */}
				<div className="flex-shrink-0 p-4 border-b border-white/10">
					<div className="flex items-center space-x-3">
						<div
							className="w-10 h-10 rounded-full flex-shrink-0 bg-cover bg-center"
							style={{
								backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuD7JrZNuWaltRcdkyyusCZMCZvusWCcdzvf4a6_jUqF2k6uYQ8z0w9H8FZblRcGp7W5KW92UOPxnmo9wYM5d9X08Gt6Rd8PEKQJgw6JYugGqMqnx_ik_WCdwU-QBTJ8gMb9AIEZHqJXSc62_ATa9Y2RxIBA_pE8HN7C7_2Zysr8zsOoPzMSWgX2qEzIe9OqGF0RR1wOc70IfqkjyurDnNDDtK3KC7-tN6D5Lre5cGEoIVniPcA5uGwzoh6g_ut7lW4J1NgVX08JzcLy")`,
							}}
						></div>
						<div className="leading-tight flex-1 min-w-0">
							<h2 className="text-white text-base font-medium truncate">{userName}</h2>
							<p className="text-gray-300 text-sm truncate">{userRole}</p>
						</div>
					</div>
				</div>

				{/* Navigation Menu - Scrollable */}
				<div className="flex-1 overflow-y-auto">
					<nav className="flex flex-col p-2">
						{currentNavItems.map((item) => (
							<button
								key={item.label}
								onClick={() => handleNavClick(item.route)}
								className={`flex items-center space-x-3 p-2 rounded-sm text-sm font-medium transition-colors w-full text-left ${
									isActiveRoute(item.route)
										? 'bg-white/20 text-white fill-1'
										: 'text-gray-300 hover:bg-white/10 hover:text-white'
								}`}
							>
								<span
									className={`material-symbols-outlined flex-shrink-0 ${
										isActiveRoute(item.route) ? 'fill-1' : ''
									}`}
								>
									{item.icon}
								</span>
								<p className="truncate">{item.label}</p>
							</button>
						))}
					</nav>
				</div>
			</div>

			{/* Footer and Logout - Luôn ở dưới cùng */}
			<div className="flex-shrink-0 p-4 border-t border-white/10">
				<div className="flex flex-col space-y-2">
					<a
						href="#"
						className="flex items-center space-x-3 p-2 rounded-sm text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
					>
						<span className="material-symbols-outlined flex-shrink-0">help</span>
						<p className="truncate">Support</p>
					</a>

					<button
						onClick={handleLogout}
						className="w-full h-10 px-4 rounded-sm text-sm font-bold tracking-wider text-red-300 bg-red-500/20 hover:bg-red-500/30 transition-colors border-none cursor-pointer flex items-center justify-center"
					>
						<span>Logout</span>
					</button>
				</div>
			</div>
		</aside>
	)
}

export default Sidebar
