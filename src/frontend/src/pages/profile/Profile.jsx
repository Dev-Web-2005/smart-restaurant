import React, { useState, useEffect } from 'react'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API
import { useUser } from '../../contexts/UserContext' // 👈 IMPORT CONTEXT
import { useLoading } from '../../contexts/LoadingContext'
import BasePageLayout from '../../components/layout/BasePageLayout' // 👈 IMPORT LAYOUT CHUNG
import { ButtonLoader, InlineLoader } from '../../components/common/LoadingSpinner'

// --- Dữ liệu Mock User Info ---
const mockAccountData = {
	userId: 'USR-001',
	username: 'alexgrim',
	email: 'alex.grim@flavorfleet.com',
	role: 'Restaurant Administrator',
	// avatarUrl được giữ nguyên trong mock nhưng không được dùng trong Card
	avatarUrl:
		'https://lh3.googleusercontent.com/aida-public/AB6AXuBxEyA08x0aFUBYpnwUeBJpU8y99W-HWB60HDNzgfj6kBYVfyUV-FkYAS40L3vgH_95eNhi8GoEA8hvmoLvS_l1jI-sZwnBSSwMVgl_qwxJtM53MsdLQVmUg7Gjb7sNEl8MWg3q7bs0KJ30FT3lv1UzPGmzb90jhBEcxoiui9m0tU20SD1-pGtvJgfT2p3e4uqON_aAZ2WUPRoawdA3Sx6jaG3m-M1p8nkrqKR4sb6ehw9JwSNyUnNsavx7jewHOCfbpXNu_YTW1F9m',
}

const UserAccount = ({ onBack }) => {
	// 🚨 Nhận onBack prop để mô phỏng quay lại
	// 👈 SỬ DỤNG CONTEXT: Lấy user hiện tại và hàm logout
	const { user, loading: contextLoading, logout } = useUser()

	// 1. State cho thông tin hiển thị
	const [accountInfo, setAccountInfo] = useState(null)
	const [pageLoading, setPageLoading] = useState(true)

	// 2. State cho Form Đổi Mật khẩu
	const [passwordForm, setPasswordForm] = useState({
		oldPassword: '',
		newPassword: '',
		confirmNewPassword: '',
	})
	const [formLoading, setFormLoading] = useState(false)
	const [formError, setFormError] = useState('')

	// 🚨 STATE MỚI: Điều khiển hiển thị form Đổi mật khẩu
	const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false)

	// 🚨 FIX: ĐỊNH NGHĨA HAM HANDLER CHUNG CHO INPUT FORM
	const handleChange = (e) => {
		const { name, value } = e.target
		setPasswordForm((prev) => ({ ...prev, [name]: value }))
	}

	// Hàm reset form
	const resetPasswordForm = () => {
		setPasswordForm({
			oldPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		})
		setFormError('')
	}

	// 3. Hàm Fetch Account Data
	const fetchAccountData = async () => {
		// Comment: BẮT ĐẦU: Logic gọi API GET thông tin tài khoản
		console.log('Fetching account information...')
		setPageLoading(true)

		// try {
		//     // Gửi kèm token/ID user để lấy thông tin chi tiết
		//     const response = await axios.get('/api/tenant/user/account');
		//     setAccountInfo(response.data);
		// } catch (error) {
		//     console.error("Error fetching account data:", error);
		// } finally {
		//     setPageLoading(false);
		// }

		// Giả định dữ liệu mock
		setTimeout(() => {
			// Merge mock data với info từ context (để đảm bảo đồng bộ Avatar/Name)
			setAccountInfo({
				...mockAccountData,
				username: user?.name?.toLowerCase().replace(/ /g, '') || 'alexgrim',
				email: user?.email || mockAccountData.email,
				avatarUrl: user?.avatarUrl || mockAccountData.avatarUrl,
				// Comment: Thêm Role từ Context nếu cần hiển thị
				role: user?.role || mockAccountData.role,
			})
			setPageLoading(false)
		}, 500)
		// Comment: KẾT THÚC: Logic gọi API GET thông tin thông tin tài khoản
	}

	// 4. Hàm Xử lý Đổi Mật khẩu (POST/PUT)
	const handlePasswordChange = async (e) => {
		e.preventDefault()
		setFormError('')

		const { oldPassword, newPassword, confirmNewPassword } = passwordForm

		if (newPassword !== confirmNewPassword) {
			setFormError('New passwords do not match.')
			return
		}
		if (newPassword.length < 8) {
			setFormError('New password must be at least 8 characters long.')
			return
		}

		setFormLoading(true)

		// Comment: BẮT ĐẦU: Logic gọi API Đổi Mật khẩu
		const payload = { oldPassword, newPassword }
		console.log('Submitting password change...')

		// try {
		//     // API endpoint: PUT /api/tenant/user/password
		//     await axios.put('/api/tenant/user/password', payload);
		//
		//     alert("Password updated successfully! Please log in again.");
		//     logout(); // Buộc người dùng đăng nhập lại
		// } catch (error) {
		//     setFormError(error.response?.data?.message || "Failed to update password.");
		// } finally {
		//     setFormLoading(false);
		//     // Reset form and hide it only on success
		//     if (!formError) {
		//         resetPasswordForm();
		//         setIsPasswordFormVisible(false);
		//     }
		// }

		// Giả định thành công
		setTimeout(() => {
			alert('Password updated successfully! (Simulated)')
			setFormLoading(false)
			// Sau khi thành công, reset form và ẩn nó
			resetPasswordForm()
			setIsPasswordFormVisible(false)
		}, 1000)
		// Comment: KẾT THÚC: Logic gọi API Đổi Mật khẩu
	}

	// 5. useEffect để load dữ liệu ban đầu
	useEffect(() => {
		// Comment: Chỉ fetch khi user context đã load xong và có user
		if (user && !contextLoading) {
			fetchAccountData()
		}
	}, [user, contextLoading]) // Thêm dependencies user và contextLoading

	// Xử lý loading chung
	if (contextLoading || pageLoading || !accountInfo) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading Account Details...</p>
			</div>
		)
	}

	// Tạo đối tượng profile đơn giản để truyền cho BasePageLayout
	const simpleUserProfile = {
		name: user?.name,
		role: user?.role,
		avatarUrl: user?.avatarUrl,
	}

	const pageContent = (
		<div className="max-w-4xl">
			{/* Header */}
			<header className="page-header flex flex-col gap-2 mb-8">
				<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
					User Account
				</h1>
				<p className="text-gray-400 text-base mt-2">
					Manage your account details and password.
				</p>
			</header>

			<div className="card-stack space-y-8">
				{/* 1. User Information Card (ƯA NHÌN HƠN) */}
				<div className="info-card bg-[#1A202C] rounded-xl p-8">
					<div className="flex items-center justify-between border-b border-[#334155] pb-4 mb-6">
						<h2 className="text-2xl font-bold text-white m-0">User Information</h2>
						{/* Status (Thêm hiển thị vai trò ở đây) */}
						<div className="text-sm font-medium bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full">
							{accountInfo.role}
						</div>
					</div>

					{/* Grid thông tin chi tiết */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
						{/* Item 1: User ID */}
						<div className="detail-item">
							<label className="block text-sm font-medium text-gray-400 mb-1">
								User ID
							</label>
							<p className="text-white text-base font-semibold">{accountInfo.userId}</p>
						</div>

						{/* Item 2: Username */}
						<div className="detail-item">
							<label className="block text-sm font-medium text-gray-400 mb-1">
								Username
							</label>
							<p className="text-white text-base">{accountInfo.username}</p>
						</div>

						{/* Item 3: Email */}
						<div className="detail-item">
							<label className="block text-sm font-medium text-gray-400 mb-1">
								Email Address
							</label>
							<p className="text-white text-base">{accountInfo.email}</p>
						</div>

						{/* Item 4: Joined Date (Mới thêm) */}
						<div className="detail-item">
							<label className="block text-sm font-medium text-gray-400 mb-1">
								Joined Date
							</label>
							<p className="text-white text-base">2023-11-24</p>
						</div>
					</div>
				</div>

				{/* 2. Change Password Card */}
				<div className="info-card password-form-fields bg-[#1A202C] rounded-xl p-8">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-2xl font-bold text-white m-0">Change Password</h2>

						{/* NÚT EDIT PASSWORD (Primary Button) */}
						{!isPasswordFormVisible && (
							<button
								onClick={() => {
									setIsPasswordFormVisible(true)
									resetPasswordForm()
								}}
								className="flex items-center justify-center h-10 px-4 rounded-lg bg-[#137fec] text-white text-sm font-bold transition-colors hover:bg-blue-600/90 border-none cursor-pointer"
							>
								Edit Password
							</button>
						)}
					</div>

					{/* 🚨 FORM ĐỔI MẬT KHẨU (Conditional Rendering) */}
					{isPasswordFormVisible && (
						<>
							{formError && (
								<div className="bg-red-600/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
									{formError}
								</div>
							)}

							<form onSubmit={handlePasswordChange} className="space-y-6 text-gray-300">
								<div>
									<label htmlFor="oldPassword">Old Password</label>
									<input
										className="input-field w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 block"
										id="oldPassword"
										name="oldPassword"
										value={passwordForm.oldPassword}
										onChange={handleChange}
										required
										type="password"
										disabled={formLoading}
									/>
								</div>
								<div>
									<label htmlFor="newPassword">New Password</label>
									<input
										className="input-field w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 block"
										id="newPassword"
										name="newPassword"
										value={passwordForm.newPassword}
										onChange={handleChange}
										required
										type="password"
										disabled={formLoading}
									/>
								</div>
								<div>
									<label htmlFor="confirmNewPassword">Confirm New Password</label>
									<input
										className="input-field w-full bg-[#2D3748] border border-[#4b5563] text-white rounded-lg p-2.5 block"
										id="confirmNewPassword"
										name="confirmNewPassword"
										value={passwordForm.confirmNewPassword}
										onChange={handleChange}
										required
										type="password"
										disabled={formLoading}
									/>
								</div>

								<div className="form-actions-footer flex justify-end items-center pt-4 gap-3">
									{/* NÚT CANCEL CHO FORM (Secondary) */}
									<button
										type="button"
										onClick={() => {
											setIsPasswordFormVisible(false)
											resetPasswordForm()
										}}
										className="flex items-center justify-center h-10 px-4 rounded-lg bg-transparent text-gray-300 text-sm font-bold hover:bg-[#4b5563] transition-colors"
										disabled={formLoading}
									>
										Cancel
									</button>

									{/* NÚT UPDATE PASSWORD (Primary) */}
									<button
										className="update-button bg-[#137fec] h-10 px-4 rounded-lg  text-gray-300 text-sm font-bold hover:bg-blue-600/90 border-none cursor-pointertransition-colors disabled:opacity-50"
										type="submit"
										disabled={formLoading}
									>
										<span className="truncate">
											{formLoading ? 'Updating...' : 'Update Password'}
										</span>
									</button>
								</div>
							</form>
						</>
					)}
				</div>
			</div>

			{/* 🚨 PAGE ACTION FOOTER (Hành động toàn trang: Cancel/Back) */}
			<div className="w-full mt-8 pt-6 border-t border-[#4b5563]">
				<button
					onClick={() => {
						// Giả sử onBack là hàm được truyền từ Router để quay lại
						alert('Navigating back to previous page/settings hub...')
						if (onBack) onBack()
					}}
					className="flex items-center justify-center h-10 px-4 rounded-lg bg-[#2D3748] text-white text-sm font-bold transition-colors hover:bg-[#4A5568] border-none cursor-pointer"
				>
					<span className="material-symbols-outlined text-xl mr-2">arrow_back</span>
					Back to Settings
				</button>
			</div>
		</div>
	)

	return (
		<BasePageLayout activeRoute="" userProfile={simpleUserProfile} handleLogout={logout}>
			<div className="main-content flex-1 md:p-8 overflow-y-auto">
				<div className="max-w-4xl mx-0 md:mx-auto">{pageContent}</div>
			</div>
		</BasePageLayout>
	)
}

export default UserAccount
