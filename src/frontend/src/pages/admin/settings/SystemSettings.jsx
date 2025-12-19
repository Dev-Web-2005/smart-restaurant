import React, { useState, useEffect } from 'react'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API
import { useUser } from '../../../contexts/UserContext' // 👈 IMPORT CONTEXT
import BasePageLayout from '../../../components/layout/BasePageLayout' // 👈 IMPORT LAYOUT CHUNG

// Mock data (Sẽ được thay thế bằng API GET)
const mockSystemConfig = {
	defaultTimezone: '(UTC-08:00) Pacific Time',
	defaultLanguage: 'English (US)',
	maintenanceMode: true,
	maintenanceMessage: 'Undergoing scheduled maintenance.',
}

// --- Main Component ---

const SystemSettings = () => {
	// 👈 SỬ DỤNG CONTEXT: Lấy user hiện tại và hàm logout
	const { loading: contextLoading } = useUser()

	// 1. State cho Dữ liệu
	const [config, setConfig] = useState({
		defaultTimezone: '',
		defaultLanguage: '',
		maintenanceMode: false,
		maintenanceMessage: '',
	})
	const [loading, setLoading] = useState(true)

	// 2. Hàm Fetch Data (GET)
	const fetchSystemConfig = async () => {
		// Comment: Gọi API GET để lấy cấu hình hệ thống hiện tại
		console.log('Fetching system configuration...')
		setLoading(true)

		// try {
		//     const response = await axios.get('/api/settings/system');
		//     setConfig(response.data);
		// } catch (error) {
		//     console.error('Error fetching config:', error);
		// } finally {
		//     setLoading(false);
		// }

		// Giả định dữ liệu mock
		setTimeout(() => {
			setConfig(mockSystemConfig)
			setLoading(false)
		}, 500)
	}

	// 3. Hàm Xử lý Lưu Cấu hình (PUT/POST)
	const handleSaveConfig = async () => {
		// Comment: Gọi API PUT/POST để lưu toàn bộ cấu hình
		console.log('Saving system configuration...', config)

		// try {
		//     // const response = await axios.put('/api/settings/system', config);
		//     // alert('Configuration saved successfully!');
		// } catch (error) {
		//     // alert('Failed to save configuration. Check console.');
		//     // console.error('Error saving config:', error);
		// }

		alert('Configuration saved successfully! (Simulated)')
	}

	// 4. Hàm xử lý thay đổi input
	const handleChange = (e) => {
		const { id, value, checked, type } = e.target

		// Xử lý Maintenance Mode Toggle
		if (id === 'maintenanceMode') {
			setConfig((prev) => ({
				...prev,
				maintenanceMode: checked,
				// Khi bật/tắt, tin nhắn sẽ giữ nguyên giá trị cuối cùng.
			}))
			return
		}

		// Cập nhật các trường input/select khác
		setConfig((prev) => ({
			...prev,
			[id]: value,
		}))
	}

	// 5. useEffect để load dữ liệu ban đầu
	useEffect(() => {
		if (!contextLoading) {
			fetchSystemConfig()
		}
	}, [contextLoading])

	// Xử lý loading chung
	if (loading || contextLoading) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading System Settings...</p>
			</div>
		)
	}

	const pageContent = (
		<>
			{/* Header */}
			<header className="flex flex-wrap justify-between items-center gap-4 mb-6">
				<div className="flex flex-col gap-2">
					<h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
						System Settings
					</h1>
					<p className="text-[#9dabb9] text-base">
						Manage global platform configurations and settings.
					</p>
				</div>
			</header>

			<div className="bg-[#1A202C] rounded-xl overflow-hidden">
				<form
					onSubmit={(e) => {
						e.preventDefault()
						handleSaveConfig()
					}}
				>
					{/* Card Header */}
					<div className="p-6 border-b border-[#2D3748]">
						<h2 className="text-xl font-bold text-white mt-0 mb-1">
							Platform Configuration
						</h2>
						<p className="text-sm text-[#9dabb9] mt-0">
							Adjust core operational parameters of the platform.
						</p>
					</div>

					{/* Card Body */}
					<div className="p-6">
						<div className="space-y-8 flex flex-col">
							{/* Regional & Localization */}
							<div className="space-y-6 flex flex-col">
								<h3 className="text-lg font-semibold text-white mt-0 mb-0">
									Regional & Localization
								</h3>
								<div className="grid gap-6 md:grid-cols-2">
									{/* Default Timezone */}
									<div>
										<label
											htmlFor="defaultTimezone"
											className="text-sm font-medium text-[#9dabb9] mb-1.5 block"
										>
											Default Timezone
										</label>
										<div className="relative">
											<select
												className="w-full appearance-none rounded-lg bg-[#2D3748] border-none text-white h-10 px-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_2px_#137fec]"
												id="defaultTimezone"
												value={config.defaultTimezone}
												onChange={handleChange}
											>
												<option>(UTC-08:00) Pacific Time</option>
												<option>(UTC-05:00) Eastern Time</option>
												<option>(UTC+00:00) Greenwich Mean Time</option>
												<option>(UTC+01:00) Central European Time</option>
											</select>
											<span className="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#9dabb9] text-xl">
												expand_more
											</span>
										</div>
									</div>
									{/* Default Language */}
									<div>
										<label
											htmlFor="defaultLanguage"
											className="text-sm font-medium text-[#9dabb9] mb-1.5 block"
										>
											Default Language
										</label>
										<div className="relative">
											<select
												className="w-full appearance-none rounded-lg bg-[#2D3748] border-none text-white h-10 px-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_2px_#137fec]"
												id="defaultLanguage"
												value={config.defaultLanguage}
												onChange={handleChange}
											>
												<option>English (US)</option>
												<option>Spanish</option>
												<option>French</option>
												<option>German</option>
											</select>
											<span className="material-symbols-outlined absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#9dabb9] text-xl">
												expand_more
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* System Toggles */}
							<div className="space-y-6 flex flex-col">
								<h3 className="text-lg font-semibold text-white mt-0 mb-0">
									System Toggles
								</h3>
								<div className="flex flex-col gap-4">
									{/* Maintenance Mode Toggle */}
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium text-white">Maintenance Mode</p>
											<p className="text-sm text-[#9dabb9]">
												Temporarily disable access to the platform for tenants.
											</p>
										</div>
										<label className="relative inline-flex items-center cursor-pointer">
											<input
												id="maintenanceMode"
												type="checkbox"
												checked={config.maintenanceMode}
												onChange={handleChange}
												className="sr-only peer"
											/>
											<div className="w-11 h-6 bg-[#2D3748] rounded-full peer peer-checked:after:translate-x-[1.5rem] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#137fec] peer-checked:after:border-white transition-colors"></div>
										</label>
									</div>

									{/* Custom Maintenance Message Input (Visibility controlled by maintenanceMode state) */}
									<div
										className={`${
											config.maintenanceMode ? 'block' : 'hidden'
										} transition-all`}
									>
										<label
											htmlFor="maintenanceMessage"
											className="text-sm font-medium text-[#9dabb9] mb-1.5 block"
										>
											Custom Maintenance Message
										</label>
										<input
											id="maintenanceMessage"
											className="w-full text-white outline-none border-none bg-[#2D3748] rounded-lg h-10 px-3 text-sm transition-shadow focus:shadow-[0_0_0_2px_#137fec]"
											placeholder="e.g., We'll be back online shortly."
											type="text"
											value={config.maintenanceMessage}
											onChange={handleChange}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="flex justify-end items-center gap-3 p-6 bg-[#1A202C] border-t border-[#2D3748] rounded-b-xl">
						<button
							type="button"
							className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-[#2D3748] text-white text-sm font-bold transition-colors hover:bg-[#4A5568] cursor-pointer border-none"
						>
							<span className="truncate">Cancel</span>
						</button>
						<button
							type="submit"
							className="flex items-center justify-center min-w-[84px] h-10 px-4 rounded-lg bg-[#137fec] text-white text-sm font-bold gap-2 transition-colors hover:bg-blue-600/90 cursor-pointer border-none"
						>
							<span className="material-symbols-outlined text-xl">save</span>
							<span className="truncate">Save Configuration</span>
						</button>
					</div>
				</form>
			</div>
		</>
	)

	return <BasePageLayout activeRoute="System Settings">{pageContent}</BasePageLayout>
}

export default SystemSettings
