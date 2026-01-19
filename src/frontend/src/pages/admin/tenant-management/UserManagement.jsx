import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '../../../contexts/UserContext'
import { useAlert } from '../../../contexts/AlertContext'
import BasePageLayout from '../../../components/layout/BasePageLayout'
import { TableSkeleton } from '../../../components/common/LoadingSpinner'
import {
	getUsersByRoleAPI,
	toggleUserStatusAPI,
} from '../../../services/api/adminUserAPI'

// ----------------------------------------------------------------------
// 🖼️ HELPER COMPONENT: Status Tag
// ----------------------------------------------------------------------
const StatusTag = ({ isActive }) => {
	const tagClass = isActive
		? 'bg-green-600/20 text-[#4ade80]'
		: 'bg-gray-600/30 text-gray-400'

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagClass}`}
		>
			{isActive ? 'Active' : 'Inactive'}
		</span>
	)
}

// ----------------------------------------------------------------------
// 🖼️ HELPER COMPONENT: Role Badge
// ----------------------------------------------------------------------
const RoleBadge = ({ roles }) => {
	const getRoleColor = (roleName) => {
		switch (roleName?.toUpperCase()) {
			case 'ADMIN':
				return 'bg-red-600/20 text-red-400'
			case 'USER':
				return 'bg-blue-600/20 text-blue-400'
			case 'STAFF':
				return 'bg-purple-600/20 text-purple-400'
			case 'CHEF':
				return 'bg-orange-600/20 text-orange-400'
			case 'CUSTOMER':
				return 'bg-green-600/20 text-green-400'
			default:
				return 'bg-gray-600/20 text-gray-400'
		}
	}

	const primaryRole = roles?.[0]?.name || 'Unknown'

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(primaryRole)}`}
		>
			{primaryRole}
		</span>
	)
}

// ----------------------------------------------------------------------
// 🖼️ HELPER COMPONENT: Email Verified Badge
// ----------------------------------------------------------------------
const EmailVerifiedBadge = ({ isVerified }) => {
	return isVerified ? (
		<span className="inline-flex items-center gap-1 text-green-400 text-xs">
			<span className="material-symbols-outlined text-sm">verified</span>
			Verified
		</span>
	) : (
		<span className="inline-flex items-center gap-1 text-yellow-400 text-xs">
			<span className="material-symbols-outlined text-sm">warning</span>
			Not Verified
		</span>
	)
}

// ----------------------------------------------------------------------
// 🧑‍💼 MAIN COMPONENT: UserManagement
// ----------------------------------------------------------------------
const UserManagement = () => {
	const { loading: contextLoading } = useUser()
	const { showConfirm, showSuccess, showError } = useAlert()

	// State cho Dữ liệu & Lọc
	const [users, setUsers] = useState([])
	const [searchTerm, setSearchTerm] = useState('')
	const [filterRole, setFilterRole] = useState('USER') // Default to USER (tenant owners)
	const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalUsers, setTotalUsers] = useState(0)
	const [itemsPerPage] = useState(10)
	const [loading, setLoading] = useState(false)
	const [togglingUserId, setTogglingUserId] = useState(null)

	// Fetch Users from API
	const fetchUsers = useCallback(async () => {
		setLoading(true)

		try {
			const result = await getUsersByRoleAPI(filterRole, {
				status: filterStatus,
				page: currentPage,
				limit: itemsPerPage,
			})

			if (result.success) {
				// Filter by search term locally (backend doesn't support search)
				let filteredUsers = result.users

				if (searchTerm) {
					const searchLower = searchTerm.toLowerCase()
					filteredUsers = filteredUsers.filter(
						(user) =>
							user.username?.toLowerCase().includes(searchLower) ||
							user.email?.toLowerCase().includes(searchLower),
					)
				}

				setUsers(filteredUsers)
				setTotalUsers(result.pagination.total)
				setTotalPages(result.pagination.totalPages)
			} else {
				console.error('❌ Failed to fetch users:', result.message)
				setUsers([])
				setTotalUsers(0)
				setTotalPages(1)
			}
		} catch (error) {
			console.error('❌ Error fetching users:', error)
			setUsers([])
		} finally {
			setLoading(false)
		}
	}, [filterRole, filterStatus, currentPage, itemsPerPage, searchTerm])

	// useEffect để gọi dữ liệu khi thay đổi lọc/phân trang
	useEffect(() => {
		if (!contextLoading) {
			fetchUsers()
		}
	}, [contextLoading, fetchUsers])

	// Handlers
	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value)
		setCurrentPage(1)
	}

	const handleRoleFilterChange = (e) => {
		setFilterRole(e.target.value)
		setCurrentPage(1)
	}

	const handleStatusFilterChange = (e) => {
		setFilterStatus(e.target.value)
		setCurrentPage(1)
	}

	const handleToggleStatus = async (user) => {
		// Không cho phép thay đổi trạng thái ADMIN
		const isAdmin = user.roles?.some((r) => r.name?.toUpperCase() === 'ADMIN')
		if (isAdmin) {
			showError('Cannot modify Admin users')
			return
		}

		const actionText = user.isActive ? 'deactivate' : 'activate'
		const confirmed = await showConfirm(
			'Confirm Status Change',
			`Are you sure you want to ${actionText} user "${user.username}"?`,
		)

		if (!confirmed) return

		setTogglingUserId(user.userId)

		try {
			const result = await toggleUserStatusAPI(user.userId, user.isActive)

			if (result.success) {
				showSuccess(result.message)
				// Update local state
				setUsers((prev) =>
					prev.map((u) =>
						u.userId === user.userId ? { ...u, isActive: result.isActive } : u,
					),
				)
			} else {
				showError(result.message)
			}
		} catch (error) {
			console.error('❌ Toggle status error:', error)
			showError('Failed to update user status')
		} finally {
			setTogglingUserId(null)
		}
	}

	// Pagination
	const renderPageNumbers = () => {
		const pages = []
		const maxPagesToShow = 5
		const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
		const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

		for (let i = startPage; i <= endPage; i++) {
			pages.push(
				<button
					key={i}
					onClick={() => setCurrentPage(i)}
					className={`flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent text-[#9dabb9] hover:bg-white/10 hover:text-white transition-colors ${
						i === currentPage ? 'bg-white/10 text-white' : ''
					}`}
				>
					{i}
				</button>,
			)
		}

		if (startPage > 1) {
			pages.unshift(
				<span key="start-dots" className="text-[#9dabb9]">
					...
				</span>,
			)
			pages.unshift(
				<button
					key={1}
					onClick={() => setCurrentPage(1)}
					className="flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent text-[#9dabb9] hover:bg-white/10 hover:text-white transition-colors"
				>
					1
				</button>,
			)
		}

		if (endPage < totalPages) {
			pages.push(
				<span key="end-dots" className="text-[#9dabb9]">
					...
				</span>,
			)
			pages.push(
				<button
					key={totalPages}
					onClick={() => setCurrentPage(totalPages)}
					className="flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent text-[#9dabb9] hover:bg-white/10 hover:text-white transition-colors"
				>
					{totalPages}
				</button>,
			)
		}

		return pages
	}

	// Loading state
	if (contextLoading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Authenticating user...</p>
			</div>
		)
	}

	const pageContent = (
		<>
			{/* Header */}
			<header className="flex flex-wrap justify-between items-center gap-4 mb-6">
				<div className="flex flex-col space-y-2">
					<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
						User Management
					</h1>
					<p className="text-[#9dabb9] text-base">
						View and manage all users on the platform.
					</p>
				</div>
			</header>

			{/* Filter/Search Box */}
			<div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
					{/* Search */}
					<div className="lg:col-span-2">
						<label className="flex flex-col w-full">
							<p className="text-sm font-medium text-[#9dabb9] mb-1">Search</p>
							<div className="flex w-full h-10 rounded-lg bg-white/5 border border-white/10 items-stretch">
								<div className="text-[#9dabb9] flex items-center justify-center pl-3">
									<span className="material-symbols-outlined">search</span>
								</div>
								<input
									className="flex-1 min-w-0 resize-none overflow-hidden text-white border-none bg-transparent h-full px-2 text-sm placeholder:text-[#9dabb9] focus:ring-0 focus:outline-none"
									placeholder="Search by username or email..."
									value={searchTerm}
									onChange={handleSearchChange}
									type="text"
								/>
							</div>
						</label>
					</div>

					{/* Role Filter */}
					<div>
						<p className="text-sm font-medium text-[#9dabb9] mb-1">Role</p>
						<select
							className="flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-white/5 border border-white/10 px-4 text-white text-sm font-medium focus:ring-0 focus:border-white/20 cursor-pointer appearance-none"
							value={filterRole}
							onChange={handleRoleFilterChange}
						>
							<option value="USER">Restaurant Owners</option>
							<option value="STAFF">Staff</option>
							<option value="CHEF">Chefs</option>
							<option value="CUSTOMER">Customers</option>
						</select>
					</div>

					{/* Status Filter */}
					<div>
						<p className="text-sm font-medium text-[#9dabb9] mb-1">Status</p>
						<select
							className="flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-white/5 border border-white/10 px-4 text-white text-sm font-medium focus:ring-0 focus:border-white/20 cursor-pointer appearance-none"
							value={filterStatus}
							onChange={handleStatusFilterChange}
						>
							<option value="all">All Status</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
				</div>
			</div>

			{/* Table Container */}
			<div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
				<div className="overflow-x-auto custom-scrollbar">
					<table className="w-full text-left border-collapse min-w-max">
						{/* Table Header */}
						<thead>
							<tr className="bg-white/5 border-b border-white/10">
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									Username
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									Email
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									Role
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									Email Status
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									Account Status
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider text-right">
									Actions
								</th>
							</tr>
						</thead>

						{/* Table Body */}
						<tbody>
							{loading ? (
								<tr>
									<td colSpan="6" className="p-4">
										<TableSkeleton rows={5} columns={6} />
									</td>
								</tr>
							) : users.length === 0 ? (
								<tr>
									<td colSpan="6" className="p-8 text-center text-[#9dabb9]">
										<div className="flex flex-col items-center gap-2">
											<span className="material-symbols-outlined text-4xl">
												person_off
											</span>
											<p>No users found matching the criteria.</p>
										</div>
									</td>
								</tr>
							) : (
								users.map((user) => {
									const isAdmin = user.roles?.some(
										(r) => r.name?.toUpperCase() === 'ADMIN',
									)
									const isToggling = togglingUserId === user.userId

									return (
										<tr key={user.userId} className="hover:bg-white/5 transition-colors">
											<td className="p-4 text-sm text-white border-b border-white/10">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
														{user.username?.[0]?.toUpperCase() || '?'}
													</div>
													<span className="font-medium">{user.username}</span>
												</div>
											</td>
											<td className="p-4 text-sm text-[#9dabb9] border-b border-white/10">
												{user.email}
											</td>
											<td className="p-4 text-sm border-b border-white/10">
												<RoleBadge roles={user.roles} />
											</td>
											<td className="p-4 text-sm border-b border-white/10">
												<EmailVerifiedBadge isVerified={user.isEmailVerified} />
											</td>
											<td className="p-4 text-sm border-b border-white/10">
												<StatusTag isActive={user.isActive} />
											</td>
											<td className="p-4 text-sm text-right border-b border-white/10">
												<div className="flex justify-end items-center space-x-4">
													{/* Toggle Status Button */}
													<button
														onClick={() => handleToggleStatus(user)}
														disabled={isAdmin || isToggling}
														title={
															isAdmin
																? 'Cannot modify Admin users'
																: user.isActive
																	? 'Deactivate User'
																	: 'Activate User'
														}
														className={`transition-colors ${
															isAdmin
																? 'text-gray-600 cursor-not-allowed'
																: isToggling
																	? 'text-gray-500 cursor-wait'
																	: 'text-[#9dabb9] hover:text-white'
														}`}
													>
														{isToggling ? (
															<span className="material-symbols-outlined animate-spin">
																sync
															</span>
														) : (
															<span
																className={`material-symbols-outlined ${
																	user.isActive ? 'text-green-400' : 'text-gray-500'
																}`}
															>
																{user.isActive ? 'toggle_on' : 'toggle_off'}
															</span>
														)}
													</button>
												</div>
											</td>
										</tr>
									)
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{totalUsers > 0 && (
					<div className="flex items-center justify-between p-4 border-t border-white/10 flex-wrap gap-4">
						<p className="text-sm text-[#9dabb9] whitespace-nowrap">
							Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
							{Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
						</p>
						<div className="flex items-center space-x-2">
							<button
								className="flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent cursor-pointer text-[#9dabb9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 hover:text-white transition-colors"
								disabled={currentPage === 1}
								onClick={() => setCurrentPage(currentPage - 1)}
							>
								<span className="material-symbols-outlined">chevron_left</span>
							</button>
							{renderPageNumbers()}
							<button
								className="flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent cursor-pointer text-[#9dabb9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 hover:text-white transition-colors"
								disabled={currentPage === totalPages || totalPages === 0}
								onClick={() => setCurrentPage(currentPage + 1)}
							>
								<span className="material-symbols-outlined">chevron_right</span>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Info Box */}
			<div className="mt-6 p-4 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-lg flex items-start gap-3">
				<span className="material-symbols-outlined text-[#137fec] mt-0.5 shrink-0">
					info
				</span>
				<p className="text-sm text-[#93c5fd] m-0">
					<strong>Platform Control:</strong> Manage user status directly. Deactivating a
					user will prevent them from logging in. Admin users cannot be modified.
				</p>
			</div>
		</>
	)

	return <BasePageLayout activeRoute="Dashboard">{pageContent}</BasePageLayout>
}

export default UserManagement
