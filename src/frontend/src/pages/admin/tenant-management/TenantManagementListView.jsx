import React, { useState, useEffect, useCallback, useRef } from 'react'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API
import { useUser } from '../../../contexts/UserContext' // 👈 IMPORT CONTEXT
import { useLoading } from '../../../contexts/LoadingContext'
import BasePageLayout from '../../../components/layout/BasePageLayout' // 👈 IMPORT LAYOUT CHUNG
import TenantDetails from './TenantManagementDetail' // 👈 IMPORT COMPONENT XEM CHI TIẾT
import { InlineLoader, TableSkeleton } from '../../../components/common/LoadingSpinner'

// ----------------------------------------------------------------------
// ⚡️ DỮ LIỆU GIẢ ĐỊNH (MOCK DATA)
// ----------------------------------------------------------------------
const initialTenantsData = [
	{
		id: 'T001',
		name: 'Culinary Creations',
		email: 'sara.c@culinary.com',
		date: '2023-10-26',
		status: 'Active',
		contactName: 'Sara Connor',
		phone: '+84 901 234 567',
		address: '123 Main St, Food City',
		description: 'A high-end restaurant focusing on fusion cuisine.',
	},
	{
		id: 'T002',
		name: 'Gourmet Grill',
		email: 'john.d@gourmet.co',
		date: '2023-09-15',
		status: 'Inactive',
		contactName: 'John Doe',
		phone: '+84 912 345 678',
		address: '456 Oak Ave, Grill Town',
		description: 'Specializes in charcoal-grilled meats and steaks.',
	},
	{
		id: 'T003',
		name: 'The Vegan Spot',
		email: 'emily.v@vegan.io',
		date: '2023-08-01',
		status: 'Active',
		contactName: 'Emily Vancamp',
		phone: '+84 923 456 789',
		address: '789 Pine Ln, Veggie Land',
		description: 'A popular spot for plant-based and healthy meals.',
	},
	{
		id: 'T004',
		name: 'Seafood Shack',
		email: 'mike.r@seafood.net',
		date: '2023-11-05',
		status: 'Active',
		contactName: 'Mike Ross',
		phone: '+84 934 567 890',
		address: '101 Beach Blvd, Ocean View',
		description: 'Fresh and sustainably sourced seafood dishes.',
	},
]

// ----------------------------------------------------------------------
// 🖼️ HELPER COMPONENT: Status Tag
// ----------------------------------------------------------------------
const StatusTag = ({ status }) => {
	const isInactive = status === 'Inactive'
	const tagClass = isInactive
		? 'bg-gray-600/30 text-gray-400'
		: 'bg-green-600/20 text-[#4ade80]' // green-400

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagClass}`}
		>
			{status}
		</span>
	)
}

// ----------------------------------------------------------------------
// 🧑‍💼 MAIN COMPONENT: TenantManagement
// ----------------------------------------------------------------------
const TenantManagement = () => {
	// 👈 SỬ DỤNG CONTEXT: Lấy user hiện tại và hàm logout
	const { loading: contextLoading } = useUser()

	// 1. State cho Dữ liệu & Lọc
	const [tenants, setTenants] = useState(initialTenantsData)
	const [searchTerm, setSearchTerm] = useState('')
	const [filterStatus, setFilterStatus] = useState('') // 'Active', 'Inactive', or ''
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(7) // Giả định
	const [totalTenants, setTotalTenants] = useState(28) // Giả định
	const [loading, setLoading] = useState(false) // Thêm loading state cho trang

	// State để quản lý chi tiết Tenant
	const [selectedTenantId, setSelectedTenantId] = useState(null) // null hoặc 'T001'
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

	// 2. Hàm Fetch Data (Chuẩn bị cho Axios)
	// Sử dụng useCallback để tránh tạo lại hàm khi component re-render
	const fetchTenants = useCallback(
		async (search, status, page) => {
			console.log(
				`Fetching tenants: Search='${search}', Status='${status}', Page=${page}`,
			)
			setLoading(true)

			/* // 🚀 CODE TÍCH HỢP API THỰC TẾ:
            try {
                const response = await axios.get('/api/tenants', {
                    params: {
                        search: search,
                        status: status,
                        page: page,
                        limit: 4 // Giả định 4 mục mỗi trang
                    }
                });
                setTenants(response.data.tenants);
                setTotalPages(response.data.totalPages);
                setTotalTenants(response.data.totalCount);
                setCurrentPage(page);
            } catch (error) {
                console.error("Error fetching tenants:", error);
            } finally {
                setLoading(false);
            }
            */

			// ⚠️ MOCK LOGIC: Giả định lọc và phân trang cục bộ
			setTimeout(() => {
				let filteredData = initialTenantsData.filter((tenant) => {
					const matchesSearch =
						tenant.name.toLowerCase().includes(search.toLowerCase()) ||
						tenant.email.toLowerCase().includes(search.toLowerCase())
					const matchesStatus = !status || tenant.status === status
					return matchesSearch && matchesStatus
				})

				// Giả định phân trang cục bộ đơn giản (chỉ hiển thị 4 mục đầu)
				const paginatedData = filteredData.slice((page - 1) * 4, (page - 1) * 4 + 4)

				setTenants(paginatedData)
				setTotalTenants(filteredData.length)
				setTotalPages(Math.ceil(filteredData.length / 4)) // Giả định 4 mục/trang
				setCurrentPage(page)
				setLoading(false)
			}, 300)
		},
		[], // Dependency trống vì initialTenantsData là hằng số
	)

	const toggleTenantStatus = async (tenantId, currentStatus) => {
		// Comment: Hàm này dùng để gọi API POST/PUT để thay đổi trạng thái tenant
		const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
		console.log(`Updating tenant ${tenantId} status to ${newStatus}`)

		/* // 🚀 CODE TÍCH HỢP API THỰC TẾ:
        try {
            await axios.put(`/api/tenants/${tenantId}/status`, { status: newStatus });
            fetchTenants(searchTerm, filterStatus, currentPage); // Fetch lại để cập nhật bảng
        } catch (error) {
            console.error("Error updating status:", error);
        }
        */

		// ⚠️ MOCK LOGIC: Giả định thành công, cập nhật state tạm thời
		setTenants((prev) =>
			prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t)),
		)
		// Cập nhật cả initialData để lọc và phân trang lại đúng (Quan trọng cho Mock Data)
		const index = initialTenantsData.findIndex((t) => t.id === tenantId)
		if (index !== -1) {
			initialTenantsData[index].status = newStatus
		}
	}

	// 3. useEffect để gọi dữ liệu khi thay đổi lọc/phân trang
	useEffect(() => {
		if (!contextLoading) {
			fetchTenants(searchTerm, filterStatus, currentPage)
		}
	}, [searchTerm, filterStatus, currentPage, contextLoading, fetchTenants])

	// 4. Các hàm xử lý sự kiện
	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value)
		setCurrentPage(1) // Reset trang khi tìm kiếm
	}

	const handleFilterChange = (e) => {
		setFilterStatus(e.target.value)
		setCurrentPage(1) // Reset trang khi lọc
	}

	// 👈 HÀM XỬ LÝ XEM CHI TIẾT
	const handleViewDetails = (tenantId) => {
		setSelectedTenantId(tenantId)
		setIsDetailModalOpen(true)
	}

	const handleCloseDetailModal = () => {
		setSelectedTenantId(null)
		setIsDetailModalOpen(false)
		// Gọi fetchTenants để cập nhật bảng danh sách sau khi Modal chi tiết đóng
		fetchTenants(searchTerm, filterStatus, currentPage)
	}

	// Hàm giả định cho nút phân trang
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
					className={`flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent text-[#9dabb9] hover:bg-[#2D3748] hover:text-white transition-colors ${
						i === currentPage ? 'bg-blue-600/20 text-white' : ''
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
					className={`flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent text-[#9dabb9] hover:bg-[#2D3748] hover:text-white transition-colors ${
						1 === currentPage ? 'bg-blue-600/20 text-white' : ''
					}`}
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
					className={`flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent text-[#9dabb9] hover:bg-[#2D3748] hover:text-white transition-colors ${
						totalPages === currentPage ? 'bg-blue-600/20 text-white' : ''
					}`}
				>
					{totalPages}
				</button>,
			)
		}

		return pages
	}

	// Xử lý loading state của Context
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
						Tenant Management
					</h1>
					<p className="text-[#9dabb9] text-base">
						View and manage all restaurants on the platform.
					</p>
				</div>
			</header>

			{/* Filter/Search Box */}
			<div className="bg-[#1A202C] rounded-xl p-4 mb-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-end">
					<div className="lg:col-span-2">
						<label className="flex flex-col w-full">
							<p className="text-sm font-medium text-[#9dabb9] mb-1">Search</p>
							<div className="flex w-full h-10 rounded-lg bg-[#2D3748] items-stretch">
								<div className="text-[#9dabb9] flex items-center justify-center pl-3">
									<span className="material-symbols-outlined">search</span>
								</div>
								<input
									className="flex-1 min-w-0 resize-none overflow-hidden text-white border-none bg-transparent h-full px-2 text-sm placeholder:text-[#9dabb9] focus:ring-0 focus:outline-none"
									placeholder="Search Restaurant Name or Owner Email..."
									value={searchTerm}
									onChange={handleSearchChange}
									type="text"
								/>
							</div>
						</label>
					</div>
					<div>
						<p className="text-sm font-medium text-[#9dabb9] mb-1">Status</p>
						<select
							// Thêm relative và mũi tên tùy chỉnh để trông đẹp hơn
							className="flex h-10 w-full items-center justify-between gap-2 rounded-lg bg-[#2D3748] px-4 text-white text-sm font-medium focus:ring-0 focus:border-transparent cursor-pointer appearance-none"
							value={filterStatus}
							onChange={handleFilterChange}
						>
							<option value="">All Statuses</option>
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</div>
				</div>
			</div>

			{/* Table Container (Khắc phục lỗi tràn ngang) */}
			<div className="bg-[#1A202C] rounded-xl overflow-hidden shadow-lg">
				{/* 🚨 Chỉ cho phép cuộn ngang trong container này - ẨN THANH CUỘN */}
				<div className="overflow-x-auto custom-scrollbar">
					{/* min-w-max: đảm bảo bảng chiếm đủ không gian cần thiết, nếu không đủ sẽ cuộn trong overflow-x-auto */}
					<table className="w-full text-left border-collapse min-w-max">
						{/* Table Header */}
						<thead>
							<tr className="bg-[#2D3748]">
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									ID
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									<div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
										Restaurant Name{' '}
										<span className="material-symbols-outlined text-base">swap_vert</span>
									</div>
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									Owner Email
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									<div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
										Registration Date{' '}
										<span className="material-symbols-outlined text-base">swap_vert</span>
									</div>
								</th>
								<th className="p-4 text-xs font-bold text-[#9dabb9] uppercase tracking-wider">
									Status
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
									<td colSpan="7" className="p-4 text-center text-[#9dabb9]">
										Loading tenants...
									</td>
								</tr>
							) : tenants.length === 0 ? (
								<tr>
									<td colSpan="7" className="p-4 text-center text-[#9dabb9]">
										No tenants found matching the criteria.
									</td>
								</tr>
							) : (
								tenants.map((tenant) => (
									<tr key={tenant.id} className="hover:bg-[#2D3748]/50 transition-colors">
										<td className="p-4 text-sm text-white border-b border-[#2D3748] whitespace-nowrap">
											{tenant.id}
										</td>
										{/* BẢO ĐẢM KHÔNG TRÀN CHỮ */}
										<td className="p-4 text-sm text-white border-b border-[#2D3748]">
											<span className="break-words">{tenant.name}</span>
										</td>
										<td className="p-4 text-sm text-[#9dabb9] border-b border-[#2D3748]">
											<span className="break-words">{tenant.email}</span>
										</td>
										<td className="p-4 text-sm text-[#9dabb9] border-b border-[#2D3748] whitespace-nowrap">
											{tenant.date}
										</td>
										<td className="p-4 text-sm border-b border-[#2D3748] whitespace-nowrap">
											<StatusTag status={tenant.status} />
										</td>

										<td className="p-4 text-sm text-right border-b border-[#2D3748] whitespace-nowrap">
											<div className="flex justify-end items-center space-x-4">
												<button
													// 👈 GỌI HÀM XEM CHI TIẾT
													onClick={() => handleViewDetails(tenant.id)}
													title="View Details"
													className="text-[#9dabb9] hover:text-white transition-colors"
												>
													<span className="material-symbols-outlined">visibility</span>
												</button>

												<button
													onClick={() => toggleTenantStatus(tenant.id, tenant.status)}
													title={
														tenant.status === 'Active'
															? 'Deactivate Tenant'
															: 'Activate Tenant'
													}
													className="text-[#9dabb9] hover:text-white transition-colors"
												>
													<span className="material-symbols-outlined">
														{tenant.status === 'Active' ? 'toggle_on' : 'toggle_off'}
													</span>
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer */}
				{totalTenants > 0 && (
					<div className="flex items-center justify-between p-4 border-t border-[#2D3748] flex-wrap">
						<p className="text-sm text-[#9dabb9] whitespace-nowrap">
							Showing {(currentPage - 1) * 4 + 1} to{' '}
							{Math.min(currentPage * 4, totalTenants)} of {totalTenants} tenants
						</p>
						<div className="flex items-center space-x-2 mt-2 sm:mt-0">
							<button
								className="flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent cursor-pointer text-[#9dabb9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D3748] hover:text-white transition-colors"
								disabled={currentPage === 1}
								onClick={() => setCurrentPage(currentPage - 1)}
							>
								<span className="material-symbols-outlined">chevron_left</span>
							</button>
							{renderPageNumbers()}
							<button
								className="flex items-center justify-center h-8 w-8 rounded-lg border-none bg-transparent cursor-pointer text-[#9dabb9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D3748] hover:text-white transition-colors"
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
			<div className="mt-6 p-4 bg-blue-600/10 rounded-lg flex items-start gap-3">
				<span className="material-symbols-outlined text-[#137fec] mt-0.5 flex-shrink-0">
					info
				</span>
				<p className="text-sm text-[#93c5fd] m-0">
					<strong>Platform Control:</strong> Manage tenant status directly. Changes may
					impact tenant access.
				</p>
			</div>

			{/* 👈 MODAL XEM CHI TIẾT */}
			{isDetailModalOpen && selectedTenantId && (
				<TenantDetails
					tenantId={selectedTenantId}
					onClose={handleCloseDetailModal}
					// Truyền hàm fetch lại data để cập nhật bảng sau khi hành động
					onUpdate={() => fetchTenants(searchTerm, filterStatus, currentPage)}
					// Giả định dữ liệu bổ sung để TenantDetails có thể mock chi tiết
					initialTenantsData={initialTenantsData}
				/>
			)}
		</>
	)

	return <BasePageLayout activeRoute="Tenant Management">{pageContent}</BasePageLayout>
}

export default TenantManagement
