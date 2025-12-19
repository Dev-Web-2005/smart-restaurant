import React, { useState, useEffect, useCallback, useRef } from 'react'
// import axios from 'axios' // 👈 Bỏ comment khi tích hợp API thật
import { useUser } from '../../../contexts/UserContext'

// ----------------------------------------------------------------------
// ⚡️ DỮ LIỆU GIẢ ĐỊNH (MOCK DATA)
// ----------------------------------------------------------------------
const mockTenantDetails = {
	// Dữ liệu từ initialTenantsData (id, name, status, email, contactName, phone, address)
	// được merge sau.

	// THÔNG TIN BỔ SUNG
	timezone: 'Pacific Standard Time (PST)',
	tableCount: 25,
	totalOrders: '8,432',
	estimatedRevenue: '$126,480.00',
	// lastUpdatedDate: '2024-03-15', // 👈 Đã bỏ trường này

	// 🆕 TRƯỜNG MỚI BỔ SUNG (Logo và Giấy tờ tùy thân)
	logoUrl: 'https://via.placeholder.com/150/4ade80/000000?text=LOGO', // 150x150
	ownerIdFrontUrl:
		'https://www.jitoe.com/wp-content/uploads/2022/10/KTP-Hilang-atau-Ingin-Ubah-Data-akan-Dirujuk-Buat-KTP-Digital.png', // 300x200
	ownerIdBackUrl:
		'https://www.jitoe.com/wp-content/uploads/2022/10/KTP-Hilang-atau-Ingin-Ubah-Data-akan-Dirujuk-Buat-KTP-Digital.png', // 300x200
}

// ----------------------------------------------------------------------
// 🖼️ HELPER COMPONENT: Status Tag
// ----------------------------------------------------------------------
const StatusTag = ({ status }) => {
	const isInactive = status === 'Inactive'
	const tagClass = isInactive
		? 'bg-gray-600/30 text-gray-400'
		: 'bg-green-600/20 text-[#4ade80]'

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagClass}`}
		>
			{status}
		</span>
	)
}

// ----------------------------------------------------------------------
// 🏠 HELPER COMPONENT: Modal Layout
// ----------------------------------------------------------------------
const ModalLayout = ({ children, title, onClose }) => (
	<div className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar bg-black bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300">
		<div className="bg-[#1A202C] rounded-xl w-full max-w-5xl transform transition-all duration-300 shadow-2xl">
			<div className="flex justify-between items-center p-5 border-b border-[#2D3748]">
				<h3 className="text-2xl font-extrabold text-white tracking-wider">{title}</h3>
				<button
					onClick={onClose}
					className="text-[#9dabb9] hover:text-white p-2 rounded-full hover:bg-[#2D3748] transition-colors"
				>
					<span className="material-symbols-outlined">close</span>
				</button>
			</div>
			{/* 🚨 Đã thêm class custom-scrollbar vào đây để ẩn thanh cuộn nội dung modal */}
			<div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">{children}</div>
		</div>
	</div>
)

// ----------------------------------------------------------------------
// ✏️ HELPER COMPONENT: Editable Detail Item (GIỮ LẠI LOGIC NỘI BỘ VÌ COMPONENT GỐC CÓ CHỨA NÓ)
// ----------------------------------------------------------------------
// Lưu ý: Mặc dù bạn đã yêu cầu xóa nút cây bút ở component cha, tôi giữ nguyên logic này
// trong file chi tiết này theo yêu cầu của code bạn cung cấp, chỉ xóa các trường Read-only
// và giữ lại các hàm không dùng tới (handleEditToggle, handleSaveChanges, vv.) để code
// không bị lỗi tham chiếu.
const EditableDetailItem = ({
	label,
	value,
	name,
	onEdit,
	isEditing,
	onChange,
	onBlurSave,
}) => {
	const isEditingField = isEditing === name
	const itemRef = useRef(null)

	// Logic Click Outside vẫn hoạt động nếu chế độ edit được kích hoạt
	useEffect(() => {
		if (!isEditingField) return

		const handleClickOutside = (event) => {
			if (itemRef.current && !itemRef.current.contains(event.target)) {
				onBlurSave(name)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isEditingField, onBlurSave, name])

	return (
		<div className="min-w-0" ref={itemRef}>
			<label className="text-sm font-medium text-[#9dabb9] mb-1 block">{label}</label>
			<div className="flex items-center gap-2 min-w-0">
				{isEditingField ? (
					// ⚙️ INPUT FIELD KHI ĐANG CHỈNH SỬA
					<input
						type={name === 'email' ? 'email' : 'text'}
						name={name}
						value={value}
						onChange={onChange}
						className="flex-grow bg-[#2D3748] border border-[#4A5568] text-white text-base font-medium p-2 rounded-lg focus:ring-2 focus:ring-[#4ade80] focus:border-transparent transition-all min-w-0"
					/>
				) : (
					// 📄 TEXT KHI KHÔNG CHỈNH SỬA
					<p className="text-white text-base font-medium break-words flex-grow min-w-0">
						{value}
					</p>
				)}

				{/* 🖊️ NÚT CHỈNH SỬA/HỦY - GIỮ NGUYÊN NẾU CẦN TÍCH HỢP LẠI */}
				<button
					onClick={() => onEdit(name)}
					className={`p-2 rounded-full transition-colors flex-shrink-0 flex justify-center ${
						isEditingField
							? 'text-red-400 hover:bg-red-400/20'
							: 'text-[#9dabb9] hover:text-[#4ade80] hover:bg-[#4ade80]/20'
					}`}
					title={isEditingField ? 'Cancel Edit' : 'Edit'}
				>
					<span className="material-symbols-outlined text-base">
						{isEditingField ? 'cancel' : 'edit'}
					</span>
				</button>
			</div>
		</div>
	)
}

// ----------------------------------------------------------------------
// 🧑‍💼 MAIN COMPONENT: TenantDetails
// ----------------------------------------------------------------------
const TenantDetails = ({ tenantId, onClose, onUpdate, initialTenantsData }) => {
	const { loading: contextLoading } = useUser()

	// 1. State
	const [tenant, setTenant] = useState(null)
	const [loading, setLoading] = useState(true)
	const [isEditing, setIsEditing] = useState(null) // Tên trường đang được edit
	const [editData, setEditData] = useState({}) // Dữ liệu đang được chỉnh sửa

	// 2. Hàm Fetch Data (GET)
	const fetchTenantData = useCallback(
		async (id) => {
			console.log(`Fetching tenant details for ID: ${id}`)
			setLoading(true)

			// ⚠️ MOCK LOGIC: Tìm kiếm và merge dữ liệu giả
			const baseData = initialTenantsData.find((t) => t.id === id)

			// Giả lập độ trễ API
			setTimeout(() => {
				if (baseData) {
					const fullTenantData = { ...baseData, ...mockTenantDetails }
					setTenant(fullTenantData)
					setEditData({
						// Khởi tạo dữ liệu chỉnh sửa
						name: fullTenantData.name,
						address: fullTenantData.address,
						phone: fullTenantData.phone,
						contactName: fullTenantData.contactName,
						email: fullTenantData.email,
					})
				}
				setLoading(false)
			}, 500)

			/* // 🚀 CODE TÍCH HỢP API THỰC TẾ:
            try {
                const response = await axios.get(`/api/tenants/${id}`);
                const fullTenantData = { ...response.data, ...mockTenantDetails };
                setTenant(fullTenantData);
                setEditData({
                    name: fullTenantData.name,
                    address: fullTenantData.address,
                    phone: fullTenantData.phone,
                    contactName: fullTenantData.contactName,
                    email: fullTenantData.email,
                });
            } catch (error) {
                console.error("Error fetching tenant details:", error);
                // Có thể hiển thị thông báo lỗi
            } finally {
                setLoading(false);
            }
            */
		},
		[initialTenantsData],
	)

	// 3. Hàm Xử lý Chỉnh sửa (Update UI)
	const handleEditToggle = useCallback(
		(fieldName) => {
			if (isEditing === fieldName) {
				// Nếu đang chỉnh sửa trường này, thì là hành động Hủy. Revert dữ liệu.
				setEditData((prev) => ({ ...prev, [fieldName]: tenant[fieldName] }))
				setIsEditing(null)
			} else if (isEditing) {
				// Nếu đang chỉnh sửa trường khác, tắt trường cũ (coi như click outside)
				setIsEditing(fieldName)
			} else {
				// Bắt đầu chỉnh sửa
				setIsEditing(fieldName)
			}
		},
		[isEditing, tenant],
	)

	// 4. Hàm xử lý Click Outside (Tắt chế độ Edit và giữ lại dữ liệu trong editData)
	const handleBlurSave = useCallback(
		(fieldName) => {
			if (isEditing === fieldName) {
				console.log(`Auto-exiting edit mode for ${fieldName}. Data retained in editData.`)
				setIsEditing(null)
			}
		},
		[isEditing],
	)

	const handleInputChange = useCallback((e) => {
		const { name, value } = e.target
		setEditData((prev) => ({ ...prev, [name]: value }))
	}, [])

	// 5. Hàm Save Changes (PUT)
	const handleSaveChanges = async () => {
		if (isEditing) {
			alert('Vui lòng hoàn tất hoặc hủy chỉnh sửa trường đang mở trước khi lưu.')
			return
		}
		if (!tenant) return

		console.log('Attempting to save changes:', editData)

		const originalData = {
			name: tenant.name,
			address: tenant.address,
			phone: tenant.phone,
			contactName: tenant.contactName,
			email: tenant.email,
		}

		// Kiểm tra nếu không có thay đổi nào
		const hasChanges = Object.keys(editData).some(
			(key) => editData[key] !== originalData[key],
		)
		if (!hasChanges) {
			alert('Không có thay đổi nào để lưu.')
			return
		}

		// 🚀 BƯỚC 1: CẬP NHẬT UI NGAY LẬP TỨC (Optimistic Update)
		setTenant((prev) => ({ ...prev, ...editData }))
		console.log('UI updated optimistically with new data.')

		/* // 🚀 CODE TÍCH HỢP API THỰC TẾ:
        try {
            // Lọc ra các trường có thay đổi để gửi đi (optional)
            const changes = Object.keys(editData).reduce((acc, key) => {
                if (editData[key] !== originalData[key]) {
                    acc[key] = editData[key];
                }
                return acc;
            }, {});

            if (Object.keys(changes).length > 0) {
                // Endpoint cập nhật thông tin chi tiết
                await axios.put(`/api/tenants/${tenant.id}`, changes); 
                console.log("Update successful via API.");
                // Gọi onUpdate của component cha để làm mới danh sách (nếu cần)
                if (onUpdate) onUpdate('', '', 1); 
            } else {
                console.log("No actual changes to send to API.");
            }

        } catch (error) {
            console.error("Error saving tenant details:", error);
            // KHẮC PHỤC TRẠNG THÁI (Revert UI nếu API thất bại)
            setTenant((prev) => ({ ...prev, ...originalData }));
            setEditData(originalData); // Quan trọng: Revert editData nếu muốn người dùng thấy giá trị cũ khi nhấn edit lần nữa
            alert("Cập nhật thông tin thất bại. Vui lòng thử lại.");
        }
        */

		// ⚠️ MOCK LOGIC: Giả lập thành công:
		const index = initialTenantsData.findIndex((t) => t.id === tenantId)
		if (index !== -1) {
			// Cập nhật dữ liệu giả trong initialTenantsData (vì nó được truyền vào)
			initialTenantsData[index].name = editData.name
			initialTenantsData[index].address = editData.address
			initialTenantsData[index].phone = editData.phone
			initialTenantsData[index].contactName = editData.contactName
			initialTenantsData[index].email = editData.email
		}
		if (onUpdate) onUpdate('', '', 1) // Kích hoạt làm mới danh sách cha (nếu có)
		alert('Thông tin đã được lưu thành công! (Mock Success)')
	}

	// 6. Hàm Xử lý Hành động Khác (PUT/POST)
	const handleAction = async (actionType, payload = {}) => {
		if (!tenant) return
		console.log(`Executing action: ${actionType} for tenant ${tenant.name}`)

		// Cảnh báo nếu đang chỉnh sửa nhưng chưa lưu
		if (isEditing) {
			alert(
				'Vui lòng lưu hoặc hủy thay đổi đang chỉnh sửa trước khi thực hiện hành động này.',
			)
			return
		}

		const currentStatus = tenant.status
		const newStatus = payload.newStatus

		// 🚀 BƯỚC 1: CẬP NHẬT UI NGAY LẬP TỨC (Optimistic Update)
		if (actionType === 'TOGGLE_STATUS') {
			setTenant((prev) => ({ ...prev, status: newStatus }))
			console.log(`UI updated optimistically to status: ${newStatus}`)
		} else if (actionType !== 'TOGGLE_STATUS') {
			alert(`${actionType} simulated successfully for ${tenant.name}.`)
		}

		/* // 🚀 CODE TÍCH HỢP API THỰC TẾ:
        try {
            if (actionType === "TOGGLE_STATUS") {
                await axios.put(`/api/tenants/${tenant.id}/status`, { status: newStatus });
            } else if (actionType === "RESET_PASSWORD") {
                await axios.post(`/api/tenants/${tenant.id}/reset-password`, { email: payload.email });
            }
            if (onUpdate) onUpdate();

        } catch (error) {
            console.error(`Error executing ${actionType}:`, error);
            // KHẮC PHỤC TRẠNG THÁI (Revert UI nếu API thất bại)
            if (actionType === "TOGGLE_STATUS") {
                setTenant((prev) => ({ ...prev, status: currentStatus }));
                alert("Cập nhật trạng thái thất bại. Vui lòng thử lại.");
            } else {
                alert(`${actionType} thất bại. Vui lòng kiểm tra console.`);
            }
        }
        */

		// ⚠️ MOCK LOGIC: Giả lập thành công:
		if (actionType === 'TOGGLE_STATUS') {
			const index = initialTenantsData.findIndex((t) => t.id === tenantId)
			if (index !== -1) {
				initialTenantsData[index].status = newStatus
			}
			if (onUpdate) onUpdate('', '', 1)
		}
	}

	// 7. useEffect để fetch data
	useEffect(() => {
		if (!contextLoading && tenantId) {
			fetchTenantData(tenantId)
		}
	}, [tenantId, contextLoading, fetchTenantData])

	// 8. Xử lý Loading và Lỗi
	if (loading || contextLoading || !tenantId) {
		return (
			<ModalLayout onClose={onClose} title="Loading Tenant Details...">
				<div className="text-center py-12 text-lg text-[#9dabb9]">
					<span className="material-symbols-outlined animate-spin text-3xl mb-3">
						progress_activity
					</span>
					<p>Loading Tenant Details...</p>
				</div>
			</ModalLayout>
		)
	}

	if (!tenant) {
		return (
			<ModalLayout onClose={onClose} title="Tenant Details">
				<p className="text-[#f87171] py-8 text-center text-lg">
					Error: Tenant not found for ID: **{tenantId}**
				</p>
			</ModalLayout>
		)
	}

	// 9. Tính toán Dữ liệu Động
	const isChecked = tenant.status === 'Active'
	const statusTextClass = isChecked ? 'text-[#4ade80]' : 'text-[#f87171]'
	const toggleButtonIcon = isChecked ? 'toggle_on' : 'toggle_off'
	const toggleButtonText = isChecked ? 'Deactivate Tenant' : 'Activate Tenant'

	// Helper component cho Metric
	const MetricCard = ({ label, value, icon }) => (
		<div className="bg-[#2D3748]/50 rounded-lg p-4 flex items-center justify-between">
			<div>
				<p className="text-sm font-medium text-[#9dabb9]">{label}</p>
				<p className="text-xl font-bold text-[#4ade80] mt-1">{value}</p>
			</div>
			<span className="material-symbols-outlined text-3xl text-[#4ade80] opacity-70">
				{icon}
			</span>
		</div>
	)

	// 10. Render UI
	return (
		<ModalLayout onClose={onClose} title={`Details: ${tenant.name}`}>
			<div className="grid gap-8 lg:grid-cols-3">
				{/* 👈 Cột Chính (Basic Info, Owner Info, Documents) */}
				<div className="flex flex-col gap-8 lg:col-span-2 min-w-0">
					{/* Section 1: Basic Information */}
					<section className="bg-[#1F2937] rounded-xl p-6 shadow-lg border border-[#2D3748] min-w-0">
						<h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
							<span className="material-symbols-outlined text-[#4ade80]">info</span>
							Restaurant & Deployment Info
						</h2>
						<div className="grid gap-6 sm:grid-cols-3">
							<div className="sm:col-span-1 flex justify-center items-center">
								<img
									src={tenant.logoUrl}
									alt={`${tenant.name} Logo`}
									className="w-28 h-28 object-contain rounded-full border-4 border-[#4ade80]/50 shadow-xl"
								/>
							</div>
							<div className="col-span-2">
								{/* ✏️ Restaurant Name */}
								<EditableDetailItem
									label="Restaurant Name"
									value={editData.name}
									name="name"
									onEdit={handleEditToggle}
									isEditing={isEditing}
									onChange={handleInputChange}
									onBlurSave={handleBlurSave} // Truyền hàm xử lý click outside
								/>

								<div className="col-span-2">
									{/* ✏️ Address */}
									<EditableDetailItem
										label="Address"
										value={editData.address}
										name="address"
										onEdit={handleEditToggle}
										isEditing={isEditing}
										onChange={handleInputChange}
										onBlurSave={handleBlurSave} // Truyền hàm xử lý click outside
									/>
								</div>
								{/* ✏️ Restaurant Phone */}
								<EditableDetailItem
									label="Restaurant Phone"
									value={editData.phone}
									name="phone"
									onEdit={handleEditToggle}
									isEditing={isEditing}
									onChange={handleInputChange}
									onBlurSave={handleBlurSave} // Truyền hàm xử lý click outside
								/>
							</div>
						</div>
					</section>
					{/* Section 2: Owner Information */}
					<section className="bg-[#1F2937] rounded-xl p-6 shadow-lg border border-[#2D3748] min-w-0">
						<h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
							<span className="material-symbols-outlined text-[#4ade80]">person</span>
							Owner Information
						</h2>
						<div className="grid gap-6 sm:grid-cols-2">
							{/* ✏️ Owner Name */}
							<EditableDetailItem
								label="Owner Name"
								value={editData.contactName}
								name="contactName"
								onEdit={handleEditToggle}
								isEditing={isEditing}
								onChange={handleInputChange}
								onBlurSave={handleBlurSave} // Truyền hàm xử lý click outside
							/>
							{/* ✏️ Owner Email */}
							<EditableDetailItem
								label="Owner Email"
								value={editData.email}
								name="email"
								onEdit={handleEditToggle}
								isEditing={isEditing}
								onChange={handleInputChange}
								onBlurSave={handleBlurSave} // Truyền hàm xử lý click outside
							/>
							{/* ✏️ Owner Phone Number - Dùng chung phone giả lập */}
							<EditableDetailItem
								label="Owner Phone Number (As Contact)"
								value={editData.phone}
								name="phone" // Dùng chung phone name
								onEdit={handleEditToggle}
								isEditing={isEditing}
								onChange={handleInputChange}
								onBlurSave={handleBlurSave} // Truyền hàm xử lý click outside
							/>
						</div>
					</section>
					{/* NÚT SAVE CHANGES */}
					<div className="flex justify-end">
						<button
							onClick={handleSaveChanges}
							disabled={isEditing !== null}
							className={`flex items-center px-6 py-3 rounded-lg text-lg font-bold gap-2 transition-all ${
								isEditing !== null
									? 'bg-gray-600 text-gray-400 cursor-not-allowed'
									: 'bg-[#4ade80] hover:bg-[#22c55e] text-[#1A202C] shadow-lg shadow-[#4ade80]/30'
							}`}
						>
							<span className="material-symbols-outlined text-xl">save</span>
							Save Changes
						</button>
					</div>
					{/* 🆕 Section 3: Identity Documents (CCCD) */}
					<section className="bg-[#1F2937] rounded-xl p-6 shadow-lg border border-[#2D3748]">
						<h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
							<span className="material-symbols-outlined text-[#4ade80]">badge</span>
							Identity Documents (Owner's ID Card)
						</h2>
						<div className="grid gap-6 md:grid-cols-2">
							<div className="flex flex-col items-center">
								<label className="text-sm font-medium text-[#9dabb9] mb-3 block">
									Front Side
								</label>
								<img
									src={tenant.ownerIdFrontUrl}
									alt="Owner ID Card Front"
									className="w-full max-w-xs object-cover rounded-lg border border-[#2D3748] shadow-md transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
								/>
							</div>
							<div className="flex flex-col items-center">
								<label className="text-sm font-medium text-[#9dabb9] mb-3 block">
									Back Side
								</label>
								<img
									src={tenant.ownerIdBackUrl}
									alt="Owner ID Card Back"
									className="w-full max-w-xs object-cover rounded-lg border border-[#2D3748] shadow-md transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
								/>
							</div>
						</div>
						<p className="text-xs text-[#9dabb9] mt-4 text-center italic">
							(These images are mock placeholders and not real data.)
						</p>
					</section>
				</div>

				{/* 👈 Cột Sidebar (Metrics & Actions) */}
				<div className="flex flex-col gap-8 lg:col-span-1">
					{/* Section 4: Metrics */}
					<section className="bg-[#1F2937] rounded-xl p-6 shadow-lg border border-[#2D3748]">
						<h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
							<span className="material-symbols-outlined text-[#4ade80]">
								query_stats
							</span>
							Usage Metrics
						</h2>
						<div className="flex flex-col gap-4">
							<MetricCard
								label="Total Tables"
								value={tenant.tableCount}
								icon="table_restaurant"
							/>
							<MetricCard
								label="Total Orders"
								value={tenant.totalOrders}
								icon="receipt_long"
							/>
							<MetricCard
								label="Estimated Revenue"
								value={tenant.estimatedRevenue}
								icon="paid"
							/>
						</div>
					</section>

					{/* Section 5: Actions */}
					<section className="bg-[#1F2937] rounded-xl p-6 shadow-lg border border-[#2D3748]">
						<h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
							<span className="material-symbols-outlined text-[#4ade80]">
								construction
							</span>
							Management Tools
						</h2>
						<div className="flex flex-col gap-4">
							{/* Nút Action Button: TOGGLE_STATUS */}
							<button
								className={`flex items-center justify-center w-full h-12 px-4 rounded-lg text-white text-base font-bold gap-2 transition-colors border-none ${
									isChecked
										? 'bg-[#f87171] hover:bg-[#ef4444]'
										: 'bg-[#4ade80] hover:bg-[#22c55e]'
								}`}
								onClick={() =>
									handleAction('TOGGLE_STATUS', {
										newStatus: isChecked ? 'Inactive' : 'Active',
									})
								}
							>
								<span className="material-symbols-outlined text-xl">
									{toggleButtonIcon}
								</span>
								<span>{toggleButtonText}</span>
							</button>

							{/* Nút Action Button: RESET_PASSWORD */}
							<button
								className="flex items-center justify-center w-full h-12 px-4 rounded-lg bg-[#2D3748] text-white text-base font-bold gap-2 transition-colors hover:bg-[#4A5568] cursor-pointer border-none"
								onClick={() =>
									handleAction('RESET_PASSWORD', {
										email: tenant.email,
									})
								}
							>
								<span className="material-symbols-outlined text-xl">key</span>
								<span>Reset Password for Owner</span>
							</button>
						</div>

						{/* System Status Display */}
						<div className="mt-6 pt-6 border-t border-[#2D3748] flex items-center justify-between">
							<label className="text-sm font-medium text-[#9dabb9]">
								Current System Status:
							</label>
							<div className="flex items-center gap-2">
								<StatusTag status={tenant.status} />
								<span className={`font-bold text-sm ${statusTextClass}`}>
									({tenant.status})
								</span>
							</div>
						</div>
					</section>
				</div>
			</div>
		</ModalLayout>
	)
}

export default TenantDetails
