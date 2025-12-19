// components/BasePageLayout.jsx (Đã thêm tính năng toggle)

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import { useUser } from '../../contexts/UserContext'

/**
 * Component bao bọc (Wrapper) cung cấp cấu trúc layout chung cho các trang.
 * @param {object} props - Props cho component.
 * @param {React.ReactNode} props.children - Nội dung chính của trang.
 * @param {string} [props.activeRoute] - Tên của route đang hoạt động.
 */
const BasePageLayout = ({ children, activeRoute = 'Dashboard' }) => {
	const { user, logout } = useUser()
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

	const toggleSidebar = () => {
		setIsSidebarCollapsed(!isSidebarCollapsed)
	}

	// Transform user data to userProfile format for Sidebar
	const userProfile = user
		? {
				name: user.username || user.email,
				role: user.role || 'User',
				avatarUrl: user.avatarUrl,
		  }
		: null

	return (
		<div className="flex min-h-screen font-[Work_Sans] relative">
			{/* Background image with dark overlay */}
			<div
				className="fixed inset-0 -z-10"
				style={{
					backgroundImage:
						'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070")',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundAttachment: 'fixed',
				}}
			>
				{/* Dark overlay to reduce contrast */}
				<div className="absolute inset-0 bg-black/75" />
			</div>

			{/* TRUYỀN DỮ LIỆU TỚI SIDEBAR */}
			<Sidebar
				activeRoute={activeRoute}
				userProfile={userProfile}
				handleLogout={logout}
				isCollapsed={isSidebarCollapsed}
				onToggle={toggleSidebar}
			/>

			{/* Main content với transition mượt mà */}
			<main
				className={`flex-1 p-8 overflow-y-auto min-h-screen transition-all duration-300 ${
					isSidebarCollapsed ? 'ml-0' : 'ml-64'
				}`}
			>
				<div className="max-w-7xl mx-auto backdrop-blur-sm">{children}</div>
			</main>

			{/* Nút toggle sidebar nổi - di chuyển theo scroll */}
			<button
				onClick={toggleSidebar}
				className="fixed z-50 w-10 h-10 bg-black/60 backdrop-blur-md text-white rounded-full shadow-lg hover:bg-black/80 transition-all duration-300 flex items-center justify-center border border-white/20 hover:shadow-xl"
				style={{
					top: '20px',
					left: isSidebarCollapsed ? '20px' : '200px', // 264px (sidebar width) + 12px (margin)
					transition: 'left 0.3s ease, transform 0.2s ease',
				}}
			>
				<span className="material-symbols-outlined text-lg">
					{isSidebarCollapsed ? 'menu' : 'chevron_left'}
				</span>
			</button>

			{/* Overlay cho mobile (tùy chọn) */}
			{!isSidebarCollapsed && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
					onClick={() => setIsSidebarCollapsed(true)}
				/>
			)}
		</div>
	)
}

export default BasePageLayout
