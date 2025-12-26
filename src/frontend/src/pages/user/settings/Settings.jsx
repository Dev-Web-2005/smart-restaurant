import React, { useState, useEffect } from 'react'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API
import { useUser } from '../../../contexts/UserContext' // 👈 IMPORT CONTEXT
import { useTheme } from '../../../contexts/ThemeContext' // 👈 IMPORT THEME CONTEXT
import { useLoading } from '../../../contexts/LoadingContext'
import BasePageLayout from '../../../components/layout/BasePageLayout' // 👈 IMPORT LAYOUT CHUNG
import { ButtonLoader, InlineLoader } from '../../../components/common/LoadingSpinner'

// --- Dữ liệu Mock Cài đặt Hiện tại ---
const mockSettings = {
	theme: 'dark', // 'dark' or 'light'
	currency: 'VND - Vietnamese Dong',
	language: 'Vietnamese (Tiếng Việt)',
}

// --- Currency Options ---
const currencyOptions = [
	'VND - Vietnamese Dong',
	'USD - US Dollar',
	'EUR - Euro',
	'GBP - British Pound',
]

// --- Language Options ---
const languageOptions = ['Vietnamese (Tiếng Việt)', 'English', 'Spanish', 'French']

const ApplicationSettings = () => {
	const { user, loading: contextLoading } = useUser()
	const { backgroundImage, uploadBackgroundImage, resetBackground } = useTheme()

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
			alert('✅ Background image updated successfully!')
		} catch (error) {
			alert(`❌ ${error.message}`)
			console.error('Upload error:', error)
		} finally {
			setUploadingBackground(false)
		}
	}

	// 3c. Hàm reset background về mặc định
	const handleResetBackground = () => {
		if (confirm('Reset background to default image?')) {
			resetBackground()
			setBackgroundPreview(null)
			alert('✅ Background reset to default!')
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
					{/* 1. Theme / Display Mode */}
					<div className="settings-card bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
						<div className="card-header p-6 border-b border-white/10">
							<h2 className="text-xl font-bold text-white m-0">Theme / Display Mode</h2>
							<p className="text-sm text-gray-300 mt-1">
								Choose how the application looks and feels.
							</p>
						</div>
						<div className="card-body p-6">
							<div className="flex items-center gap-4">
								{/* Dark Theme */}
								<label
									className={`theme-label flex items-center gap-3 p-4 border border-white/20 rounded-lg cursor-pointer flex-1 transition-colors ${
										settings.theme === 'dark' ? 'bg-black/30' : 'hover:bg-black/20'
									}`}
								>
									<input
										type="radio"
										name="theme"
										value="dark"
										checked={settings.theme === 'dark'}
										onChange={handleChange}
										className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-black/40 checked:border-[#137fec] checked:shadow-[0_0_0_2px_rgba(0,0,0,0.4)] checked:after:content-[''] checked:after:absolute checked:after:w-2 checked:after:h-2 checked:after:rounded-full checked:after:bg-[#137fec] checked:after:left-1/2 checked:after:top-1/2 checked:after:transform checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 cursor-pointer relative"
									/>
									<div className="flex items-center gap-2">
										<span className="material-symbols-outlined text-white">
											dark_mode
										</span>
										<span
											className={`theme-name ${
												settings.theme === 'dark'
													? 'text-white font-medium'
													: 'text-gray-300 font-normal'
											}`}
										>
											Dark Theme
										</span>
									</div>
								</label>

								{/* Light Theme */}
								<label
									className={`theme-label flex items-center gap-3 p-4 border border-white/20 rounded-lg cursor-pointer flex-1 transition-colors ${
										settings.theme === 'light' ? 'bg-black/30' : 'hover:bg-black/20'
									}`}
								>
									<input
										type="radio"
										name="theme"
										value="light"
										checked={settings.theme === 'light'}
										onChange={handleChange}
										className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-black/40 checked:border-[#137fec] checked:shadow-[0_0_0_2px_rgba(0,0,0,0.4)] checked:after:content-[''] checked:after:absolute checked:after:w-2 checked:after:h-2 checked:after:rounded-full checked:after:bg-[#137fec] checked:after:left-1/2 checked:after:top-1/2 checked:after:transform checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 cursor-pointer relative"
									/>
									<div className="flex items-center gap-2">
										<span className="material-symbols-outlined text-white">
											light_mode
										</span>
										<span
											className={`theme-name ${
												settings.theme === 'light'
													? 'text-white font-medium'
													: 'text-gray-300 font-normal'
											}`}
										>
											Light Theme
										</span>
									</div>
								</label>
							</div>
						</div>
					</div>

					{/* 1.5 Background Image */}
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

					{/* 2. Currency Unit (Đơn vị tiền tệ) */}
					<div className="settings-card bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
						<div className="card-header p-6 border-b border-white/10">
							<h2 className="text-xl font-bold text-white m-0">Currency Unit</h2>
							<p className="text-sm text-gray-300 mt-1">
								Select the default currency for financial displays.
							</p>
						</div>
						<div className="card-body p-6">
							<div className="select-group-wrapper relative max-w-sm">
								<label className="sr-only" htmlFor="currency">
									Currency Unit
								</label>
								<select
									className="select-input appearance-none w-full h-10 px-4 rounded-lg bg-black/40 backdrop-blur-md text-white border border-white/20 focus:ring-2 focus:ring-[#137fec] focus:ring-offset-2 focus:ring-offset-transparent"
									id="currency"
									name="currency"
									value={settings.currency}
									onChange={handleChange}
								>
									{currencyOptions.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
								<div className="select-icon-addon pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
									<span className="material-symbols-outlined text-gray-300">
										expand_more
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* 3. Language (Ngôn ngữ) */}
					<div className="settings-card bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
						<div className="card-header p-6 border-b border-white/10">
							<h2 className="text-xl font-bold text-white m-0">Language</h2>
							<p className="text-sm text-gray-300 mt-1">
								Choose your preferred language for the interface.
							</p>
						</div>
						<div className="card-body p-6">
							<div className="select-group-wrapper relative max-w-sm">
								<label className="sr-only" htmlFor="language">
									Language
								</label>
								<select
									className="select-input appearance-none w-full h-10 px-4 rounded-lg bg-black/40 backdrop-blur-md text-white border border-white/20 focus:ring-2 focus:ring-[#137fec] focus:ring-offset-2 focus:ring-offset-transparent"
									id="language"
									name="language"
									value={settings.language}
									onChange={handleChange}
								>
									{languageOptions.map((option) => (
										<option key={option} value={option}>
											{option}
										</option>
									))}
								</select>
								<div className="select-icon-addon pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
									<span className="material-symbols-outlined text-gray-300">
										expand_more
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* 🚨 Form Footer (Save Button) */}
					<div className="form-footer-actions flex justify-end pt-4">
						<button
							type="submit"
							disabled={formLoading}
							className="save-button flex min-w-[120px] max-w-xs cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-[#137fec] text-white text-sm font-bold gap-2 transition-colors hover:bg-[#137fec]/90 disabled:opacity-50"
						>
							<span className="material-symbols-outlined">save</span>
							<span className="truncate">Save Changes</span>
						</button>
					</div>
				</div>
			</form>
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
