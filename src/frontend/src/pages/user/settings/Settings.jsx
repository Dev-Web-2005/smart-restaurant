import React, { useState, useEffect } from 'react'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API
import { useUser } from '../../../contexts/UserContext' // 👈 IMPORT CONTEXT
import { useTheme } from '../../../contexts/ThemeContext' // 👈 IMPORT THEME CONTEXT
import { useLoading } from '../../../contexts/LoadingContext'
import { useAlert } from '../../../contexts/AlertContext' // 👈 IMPORT ALERT CONTEXT
import BasePageLayout from '../../../components/layout/BasePageLayout' // 👈 IMPORT LAYOUT CHUNG
import { ButtonLoader, InlineLoader } from '../../../components/common/LoadingSpinner'
import AccountManagement from './AccountManagement' // 👈 IMPORT ACCOUNT MANAGEMENT

// --- Dữ liệu Mock Cài đặt Hiện tại ---
const mockSettings = {
	theme: 'dark', // 'dark' or 'light'
}

const ApplicationSettings = () => {
	const { user, loading: contextLoading } = useUser()
	const { backgroundImage, uploadBackgroundImage, resetBackground } = useTheme()
	const { showSuccess, showError, showConfirm } = useAlert() // 👈 USE ALERT CONTEXT

	// 1. State chính cho form settings
	const [settings, setSettings] = useState(mockSettings)
	const [loading, setLoading] = useState(true)
	const [formLoading, setFormLoading] = useState(false)
	const [uploadingBackground, setUploadingBackground] = useState(false)
	const [backgroundPreview, setBackgroundPreview] = useState(null)

	// 2. Hàm Fetch Settings (GET)
	const fetchSettings = async () => {
		// Comment: BẮT ĐẦU: Logic gọi API GET để lấy cấu hình hiện tại
		console.log('Fetching current application settings...')
		setLoading(true)

		// try {
		//     const response = await axios.get('/api/tenant/settings/app');
		//     setSettings(response.data);
		// } catch (error) {
		//     console.error("Error fetching settings:", error);
		// } finally {
		//     setLoading(false);
		// }

		// Giả định dữ liệu mock
		setTimeout(() => {
			setLoading(false)
		}, 500)
		// Comment: KẾT THÚC: Logic gọi API GET để lấy cấu hình hiện tại
	}

	// 3. Hàm Xử lý thay đổi Input/Select
	const handleChange = (e) => {
		const { name, value } = e.target
		setSettings((prev) => ({ ...prev, [name]: value }))
	}

	// 3b. Hàm xử lý upload background image
	const handleBackgroundUpload = async (e) => {
		const file = e.target.files?.[0]
		if (!file) return

		setUploadingBackground(true)
		try {
			const imageUrl = await uploadBackgroundImage(file)
			setBackgroundPreview(imageUrl)
			showSuccess('Background Updated', 'Background image has been updated successfully!')
		} catch (error) {
			showError('Upload Failed', error.message || 'Failed to upload background image')
			console.error('Upload error:', error)
		} finally {
			setUploadingBackground(false)
		}
	}

	// 3c. Hàm reset background về mặc định
	const handleResetBackground = async () => {
		const confirmed = await showConfirm(
			'Reset Background',
			'Are you sure you want to reset background to default image?'
		)
		if (confirmed) {
			setUploadingBackground(true)
			try {
				await resetBackground()
				setBackgroundPreview(null)
				showSuccess('Background Reset', 'Background has been reset to default!')
			} catch (error) {
				showError('Reset Failed', error.message || 'Failed to reset background')
				console.error('Reset error:', error)
			} finally {
				setUploadingBackground(false)
			}
		}
	}

	// 4. Hàm Xử lý Lưu (POST/PUT)
	const handleSave = async (e) => {
		e.preventDefault()
		setFormLoading(true)

		// Comment: BẮT ĐẦU: Logic gọi API PUT để lưu cấu hình
		console.log('Saving application settings...', settings)

		// try {
		//     // API endpoint: PUT /api/tenant/settings/app
		//     // Payload là toàn bộ đối tượng settings
		//     await axios.put('/api/tenant/settings/app', settings);
		//
		//     alert("Settings saved successfully!");
		// } catch (error) {
		//     alert("Failed to save settings. Check console.");
		//     console.error("Save error:", error);
		// } finally {
		//     setFormLoading(false);
		// }

		// Giả định thành công
		setTimeout(() => {
			alert('Settings saved successfully! (Simulated)')
			setFormLoading(false)
		}, 800)
		// Comment: KẾT THÚC: Logic gọi API PUT để lưu cấu hình
	}

	// 5. useEffect để load dữ liệu ban đầu
	useEffect(() => {
		if (!contextLoading) {
			fetchSettings()
		}
	}, [contextLoading])

	// Xử lý loading chung
	if (contextLoading || loading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading Settings...</p>
			</div>
		)
	}

	const pageContent = (
		<div className="max-w-4xl">
			{/* Header */}
			<header className="page-header flex flex-col gap-2 mb-8">
				<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
					Application Settings
				</h1>
				<p className="text-gray-400 text-base mt-2">
					Manage your application preferences and settings.
				</p>
			</header>

			<form onSubmit={handleSave}>
				<div className="card-stack space-y-8">
					{/* Background Image */}
					<div className="settings-card bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
						<div className="card-header p-6 border-b border-white/10">
							<h2 className="text-xl font-bold text-white m-0 flex items-center gap-2">
								<span className="material-symbols-outlined">wallpaper</span>
								Background Image
							</h2>
							<p className="text-sm text-gray-300 mt-1">
								Customize the background image for the entire application.
							</p>
						</div>
						<div className="card-body p-6 space-y-4">
							{/* Current Background Preview */}
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-300">
									Current Background
								</label>
								<div
									className="w-full h-32 rounded-lg bg-cover bg-center border-2 border-white/20"
									style={{
										backgroundImage: `url("${backgroundPreview || backgroundImage}")`,
									}}
								/>
							</div>

							{/* Upload Button */}
							<div className="flex gap-3">
								<label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#137fec] hover:bg-[#1068c4] text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
									<span className="material-symbols-outlined">upload</span>
									<span>{uploadingBackground ? 'Uploading...' : 'Upload New Image'}</span>
									<input
										type="file"
										accept="image/*"
										onChange={handleBackgroundUpload}
										className="hidden"
										disabled={uploadingBackground}
									/>
								</label>

								<button
									type="button"
									onClick={handleResetBackground}
									className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white border border-white/20 rounded-lg transition-colors flex items-center gap-2"
									disabled={uploadingBackground}
								>
									<span className="material-symbols-outlined">refresh</span>
									<span>Reset to Default</span>
								</button>
							</div>

							{/* Info */}
							<div className="text-xs text-gray-400 flex items-start gap-2">
								<span className="material-symbols-outlined text-sm">info</span>
								<span>
									Recommended: High-resolution image (1920x1080 or higher). Max file size:
									5MB. Supported formats: JPG, PNG, WebP.
								</span>
							</div>
						</div>
					</div>
				</div>
			</form>

			{/* 🆕 Account Management Section - Outside form to prevent unwanted submissions */}
			<div className="mt-12">
				<AccountManagement />
			</div>

			{/* Save Changes Button - At the bottom of the page */}
			<div className="form-footer-actions flex justify-end pt-6 mt-8">
				<button
					onClick={handleSave}
					disabled={formLoading}
					className="save-button flex min-w-[120px] max-w-xs cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-[#137fec] text-white text-sm font-bold gap-2 transition-colors hover:bg-[#137fec]/90 disabled:opacity-50"
				>
					<span className="material-symbols-outlined">save</span>
					<span className="truncate">Save Changes</span>
				</button>
			</div>
		</div>
	)

	return (
		<BasePageLayout activeRoute="Setting">
			<div className="main-content flex-1 p-8 overflow-y-auto">
				<div className="max-w-4xl mx-auto">{pageContent}</div>
			</div>
		</BasePageLayout>
	)
}

export default ApplicationSettings
