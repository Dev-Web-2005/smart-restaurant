import React, { useState, useEffect } from 'react'
import { useUser } from '../../contexts/UserContext'
import { useAlert } from '../../contexts/AlertContext'
import BasePageLayout from '../../components/layout/BasePageLayout'
import {
	updateProfileAPI,
	getMyProfileAPI,
	sendVerificationEmailAPI,
	verifyEmailCodeAPI,
	resendVerificationEmailAPI,
	checkEmailVerificationStatusAPI,
} from '../../services/api/authAPI'

/**
 * Profile Page - User Account Information and Settings
 *
 * Features:
 * - Display user account information from backend
 * - Email verification and profile management
 * - Transparent glassmorphism design
 * - Works for all roles (Admin, User, Staff, Chef)
 * - LocalStorage caching for optimized performance
 */

const PROFILE_CACHE_KEY = 'user_profile_cache'
const PROFILE_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const Profile = () => {
	const { user, logout } = useUser()
	const { showAlert } = useAlert()

	// State for profile data from backend
	const [profileData, setProfileData] = useState(null)
	const [loadingProfile, setLoadingProfile] = useState(true)

	// State for profile edit forms
	const [isEditingPersonal, setIsEditingPersonal] = useState(false)
	const [isEditingRestaurant, setIsEditingRestaurant] = useState(false)
	const [profileForm, setProfileForm] = useState({
		phoneNumber: '',
		address: '',
		birthDay: '',
		restaurantName: '',
		businessAddress: '',
		contractNumber: '',
		contractEmail: '',
	})
	const [profileFormLoading, setProfileFormLoading] = useState(false)

	// Email Verification State
	const [emailVerified, setEmailVerified] = useState(false)
	const [checkingEmailStatus, setCheckingEmailStatus] = useState(true)
	const [showOTPInput, setShowOTPInput] = useState(false)
	const [otpCode, setOtpCode] = useState('')
	const [sendingEmail, setSendingEmail] = useState(false)
	const [verifyingOTP, setVerifyingOTP] = useState(false)
	const [otpError, setOtpError] = useState('')
	const [otpSuccess, setOtpSuccess] = useState('')

	// Fetch profile data on mount
	useEffect(() => {
		fetchProfileData()
	}, [])

	// Debug: Log profileData changes
	useEffect(() => {
		console.log('🔄 profileData state updated:', profileData)
	}, [profileData])

	// Check email verification status when user loads
	useEffect(() => {
		if (user?.email) {
			checkEmailVerificationStatus()
		}
	}, [user?.email])

	const fetchProfileData = async (forceRefresh = false) => {
		setLoadingProfile(true)
		try {
			// Check cache first (unless force refresh)
			if (!forceRefresh) {
				const cachedData = localStorage.getItem(PROFILE_CACHE_KEY)
				if (cachedData) {
					try {
						const { data, timestamp } = JSON.parse(cachedData)
						const cacheAge = Date.now() - timestamp

						if (cacheAge < PROFILE_CACHE_DURATION) {
							console.log(
								'💾 Using cached profile data (age:',
								Math.round(cacheAge / 1000),
								'seconds)',
							)
							setProfileData(data)
							// Pre-fill form with cached data
							setProfileForm({
								phoneNumber: data.phoneNumber || '',
								address: data.address || '',
								birthDay: data.birthDay
									? new Date(data.birthDay).toISOString().split('T')[0]
									: '',
								restaurantName: data.restaurantName || '',
								businessAddress: data.businessAddress || '',
								contractNumber: data.contractNumber || '',
								contractEmail: data.contractEmail || '',
							})
							setLoadingProfile(false)
							return
						} else {
							console.log('⏱️ Cache expired, fetching fresh data')
						}
					} catch (parseError) {
						console.warn('Failed to parse cached profile data:', parseError)
						localStorage.removeItem(PROFILE_CACHE_KEY)
					}
				}
			}

			// Fetch from API
			console.log('🌐 Fetching profile data from API...')
			const result = await getMyProfileAPI()
			console.log('📥 Profile fetch result:', result)

			if (result.success && result.data) {
				console.log('✅ Profile data received:', result.data)
				setProfileData(result.data)

				// Cache the data
				localStorage.setItem(
					PROFILE_CACHE_KEY,
					JSON.stringify({
						data: result.data,
						timestamp: Date.now(),
					}),
				)
				console.log('💾 Profile data cached')

				// Pre-fill form with fresh data
				setProfileForm({
					phoneNumber: result.data.phoneNumber || '',
					address: result.data.address || '',
					birthDay: result.data.birthDay
						? new Date(result.data.birthDay).toISOString().split('T')[0]
						: '',
					restaurantName: result.data.restaurantName || '',
					businessAddress: result.data.businessAddress || '',
					contractNumber: result.data.contractNumber || '',
					contractEmail: result.data.contractEmail || '',
				})
			} else if (result.success && !result.data) {
				// Profile not found - first time user
				setProfileData(null)
				console.log('📝 Profile not found - will be created on first update')
			} else {
				console.error('Failed to fetch profile:', result.message)
			}
		} catch (error) {
			console.error('Error fetching profile:', error)
		} finally {
			setLoadingProfile(false)
		}
	}

	// Email Verification Functions
	const checkEmailVerificationStatus = async () => {
		if (!user?.email) {
			setCheckingEmailStatus(false)
			return
		}

		setCheckingEmailStatus(true)
		try {
			const result = await checkEmailVerificationStatusAPI(user.email)

			if (result.success) {
				setEmailVerified(result.isVerified)
				console.log('📧 Email verification status:', result.isVerified)
			} else {
				console.error('Failed to check email status:', result.message)
			}
		} catch (error) {
			console.error('Error checking email verification status:', error)
		} finally {
			setCheckingEmailStatus(false)
		}
	}

	const handleSendVerificationEmail = async () => {
		setSendingEmail(true)
		setOtpError('')
		setOtpSuccess('')

		try {
			const result = await sendVerificationEmailAPI()

			if (result.success) {
				setShowOTPInput(true)
				setOtpSuccess('✅ Verification code sent to your email! Check your inbox.')
				showAlert('success', 'Verification code sent to your email!')
			} else {
				setOtpError(result.message || '❌ Failed to send verification email')
				showAlert('error', result.message || 'Failed to send verification email')
			}
		} catch (error) {
			setOtpError('❌ An error occurred. Please try again.')
			showAlert('error', 'An error occurred. Please try again.')
			console.error('Send verification email error:', error)
		} finally {
			setSendingEmail(false)
		}
	}

	const handleVerifyOTP = async () => {
		if (!otpCode || otpCode.length !== 6) {
			setOtpError('Please enter a valid 6-digit code')
			return
		}

		setVerifyingOTP(true)
		setOtpError('')

		try {
			const result = await verifyEmailCodeAPI(otpCode)

			if (result.success) {
				setShowOTPInput(false)
				setOtpCode('')
				showAlert('success', 'Email verified successfully!')

				// Re-check email status via API
				await checkEmailVerificationStatus()

				// Update user context
				const updatedUser = { ...user, isEmailVerified: true }
				localStorage.setItem('user', JSON.stringify(updatedUser))
			} else {
				setOtpError(result.message || '❌ Invalid verification code')
				showAlert('error', result.message || 'Invalid verification code')
			}
		} catch (error) {
			setOtpError('❌ Verification failed. Please try again.')
			showAlert('error', 'Verification failed. Please try again.')
			console.error('Verify OTP error:', error)
		} finally {
			setVerifyingOTP(false)
		}
	}

	const handleResendOTP = async () => {
		if (!user?.email) {
			setOtpError('Email not found. Please contact support.')
			return
		}

		setSendingEmail(true)
		setOtpError('')

		try {
			const result = await resendVerificationEmailAPI(user.email)

			if (result.success) {
				setOtpSuccess('✅ New verification code sent!')
				showAlert('success', 'New verification code sent!')
			} else {
				setOtpError(result.message || '❌ Failed to resend code')
				showAlert('error', result.message || 'Failed to resend code')
			}
		} catch (error) {
			setOtpError('❌ An error occurred. Please try again.')
			showAlert('error', 'An error occurred. Please try again.')
			console.error('Resend OTP error:', error)
		} finally {
			setSendingEmail(false)
		}
	}

	const handleOTPInputChange = (e) => {
		const value = e.target.value.replace(/\D/g, '').slice(0, 6)
		setOtpCode(value)
		setOtpError('')
	}

	// Handle profile form input changes
	const handleProfileChange = (e) => {
		const { name, value } = e.target
		setProfileForm((prev) => ({ ...prev, [name]: value }))
	}

	// Handle profile update submission
	const handleProfileUpdate = async (e) => {
		e.preventDefault()
		setProfileFormLoading(true)

		try {
			// Prepare update data - only send non-empty fields
			const updateData = {}

			// Personal information
			if (profileForm.phoneNumber && profileForm.phoneNumber.trim())
				updateData.phoneNumber = profileForm.phoneNumber.trim()
			if (profileForm.address && profileForm.address.trim())
				updateData.address = profileForm.address.trim()
			if (profileForm.birthDay) {
				// Convert to ISO date string for backend
				updateData.birthDay = new Date(profileForm.birthDay).toISOString()
			}

			// Restaurant information (for Owner)
			if (profileForm.restaurantName && profileForm.restaurantName.trim())
				updateData.restaurantName = profileForm.restaurantName.trim()
			if (profileForm.businessAddress && profileForm.businessAddress.trim())
				updateData.businessAddress = profileForm.businessAddress.trim()
			if (profileForm.contractNumber && profileForm.contractNumber.trim())
				updateData.contractNumber = profileForm.contractNumber.trim()
			if (profileForm.contractEmail && profileForm.contractEmail.trim())
				updateData.contractEmail = profileForm.contractEmail.trim()

			// Validate at least one field is being updated
			if (Object.keys(updateData).length === 0) {
				showAlert('warning', 'Please update at least one field')
				setProfileFormLoading(false)
				return
			}

			console.log('📤 Sending profile update:', updateData)

			const result = await updateProfileAPI(updateData)

			console.log('📥 Profile update result:', result)

			if (result.success) {
				showAlert('success', 'Profile updated successfully!')
				setIsEditingPersonal(false)
				setIsEditingRestaurant(false)
				await fetchProfileData(true) // Force refresh after update
			} else {
				showAlert('error', result.message || 'Failed to update profile')
			}
		} catch (error) {
			console.error('Error updating profile:', error)
			showAlert(
				'error',
				error.response?.data?.message || 'Failed to update profile. Please try again.',
			)
		} finally {
			setProfileFormLoading(false)
		}
	}

	// Format date
	const formatDate = (dateString) => {
		if (!dateString) return 'N/A'
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}

	// Get role display name
	// RoleEnum: ADMIN=1, USER=2, STAFF=3, CHEF=4, CUSTOMER=5
	const getRoleDisplay = () => {
		// Check user.role (can be number or string)
		if (user?.role === 1 || user?.role === 'ADMIN') return 'Super Administrator'
		if (user?.role === 2 || user?.role === 'USER') return 'USER'
		if (user?.role === 3 || user?.role === 'STAFF') return 'Staff'
		if (user?.role === 4 || user?.role === 'CHEF') return 'Chef'
		if (user?.role === 5 || user?.role === 'CUSTOMER') return 'Customer'

		// Fallback: check user.roles array
		if (user?.roles?.includes('ADMIN') || user?.roles?.includes(1))
			return 'Super Administrator'
		if (user?.roles?.includes('USER') || user?.roles?.includes(2)) return 'USER'
		if (user?.roles?.includes('STAFF') || user?.roles?.includes(3)) return 'Staff'
		if (user?.roles?.includes('CHEF') || user?.roles?.includes(4)) return 'Chef'
		if (user?.roles?.includes('CUSTOMER') || user?.roles?.includes(5)) return 'Customer'

		return 'User'
	}

	// Get role badge color
	const getRoleBadgeColor = () => {
		const role = getRoleDisplay()
		if (role.includes('Administrator'))
			return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
		if (role === 'USER') return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
		if (role.includes('Staff'))
			return 'bg-green-500/20 text-green-300 border-green-500/30'
		if (role.includes('Chef'))
			return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
		if (role.includes('Customer'))
			return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
		return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
	}

	if (!user) {
		return (
			<div className="flex min-h-screen bg-[#101922] w-full items-center justify-center">
				<p className="text-white">Loading Profile...</p>
			</div>
		)
	}

	return (
		<BasePageLayout activeRoute="/profile">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<header className="mb-8">
					<h1 className="text-white text-4xl font-bold mb-2">Profile</h1>
					<p className="text-gray-400 text-base">
						Manage your account information and security settings
					</p>
				</header>

				<div className="space-y-6">
					{/* Email Verification Card */}
					<div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
									<span className="material-symbols-outlined">
										{emailVerified ? 'verified' : 'mail'}
									</span>
									Email Verification
								</h2>
								<p className="text-sm text-gray-400">
									Verify your email to enable all features
								</p>
							</div>
						</div>

						{/* Email Status Display */}
						<div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10 mb-4">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">mail</span>
								<div>
									<p className="text-white font-medium">{user?.email || 'No email'}</p>
									<p className="text-xs text-gray-400">Your registered email address</p>
								</div>
							</div>

							{/* Verification Badge */}
							<div
								className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
									checkingEmailStatus
										? 'bg-gray-500/20 border border-gray-500/30'
										: emailVerified
											? 'bg-green-500/20 border border-green-500/30'
											: 'bg-amber-500/20 border border-amber-500/30'
								}`}
							>
								<span
									className={`material-symbols-outlined text-sm ${
										checkingEmailStatus
											? 'text-gray-400 animate-spin'
											: emailVerified
												? 'text-green-400'
												: 'text-amber-400'
									}`}
								>
									{checkingEmailStatus
										? 'progress_activity'
										: emailVerified
											? 'check_circle'
											: 'pending'}
								</span>
								<span
									className={`text-xs font-medium ${
										checkingEmailStatus
											? 'text-gray-400'
											: emailVerified
												? 'text-green-400'
												: 'text-amber-400'
									}`}
								>
									{checkingEmailStatus
										? 'Checking...'
										: emailVerified
											? 'Verified'
											: 'Not Verified'}
								</span>
							</div>
						</div>

						{/* Verification Actions */}
						{!checkingEmailStatus && !emailVerified && (
							<div className="space-y-4">
								{/* Info Message */}
								<div className="text-sm text-blue-400 flex items-start gap-2 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
									<span className="material-symbols-outlined text-sm">info</span>
									<span>
										Verify your email to access all features and receive important
										notifications.
									</span>
								</div>

								{/* Send Verification Button */}
								{!showOTPInput && (
									<button
										type="button"
										onClick={handleSendVerificationEmail}
										disabled={sendingEmail}
										className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
									>
										<span className="material-symbols-outlined">
											{sendingEmail ? 'progress_activity' : 'send'}
										</span>
										<span>
											{sendingEmail ? 'Sending Code...' : 'Send Verification Code'}
										</span>
									</button>
								)}

								{/* OTP Input Section */}
								{showOTPInput && (
									<div className="space-y-4">
										{/* Success Message */}
										{otpSuccess && (
											<div className="text-sm text-green-400 flex items-start gap-2 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
												<span className="material-symbols-outlined text-sm">
													check_circle
												</span>
												<span>{otpSuccess}</span>
											</div>
										)}

										{/* OTP Input */}
										<div className="space-y-2">
											<label className="text-sm font-medium text-gray-300">
												Enter 6-Digit Code
											</label>
											<input
												type="text"
												inputMode="numeric"
												pattern="[0-9]*"
												maxLength={6}
												value={otpCode}
												onChange={handleOTPInputChange}
												placeholder="000000"
												className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												disabled={verifyingOTP}
											/>
											<p className="text-xs text-gray-400">
												Check your email for the 6-digit verification code
											</p>
										</div>

										{/* Error Message */}
										{otpError && (
											<div className="text-sm text-red-400 flex items-start gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
												<span className="material-symbols-outlined text-sm">error</span>
												<span>{otpError}</span>
											</div>
										)}

										{/* Action Buttons */}
										<div className="flex gap-3">
											<button
												type="button"
												onClick={handleVerifyOTP}
												disabled={verifyingOTP || otpCode.length !== 6}
												className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
											>
												<span className="material-symbols-outlined">
													{verifyingOTP ? 'progress_activity' : 'verified'}
												</span>
												<span>{verifyingOTP ? 'Verifying...' : 'Verify Code'}</span>
											</button>

											<button
												type="button"
												onClick={handleResendOTP}
												disabled={sendingEmail}
												className="px-6 py-3 bg-black/40 hover:bg-black/60 text-white border border-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
											>
												<span className="material-symbols-outlined text-sm">refresh</span>
												<span>Resend</span>
											</button>
										</div>

										{/* Info Note */}
										<div className="text-xs text-gray-400 flex items-start gap-2">
											<span className="material-symbols-outlined text-sm">schedule</span>
											<span>
												The verification code expires in 5 minutes. If you don't receive
												it, check your spam folder or click Resend.
											</span>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Verified Success Message */}
						{emailVerified && (
							<div className="text-sm text-green-400 flex items-center gap-2 bg-green-500/10 p-4 rounded-lg border border-green-500/20">
								<span className="material-symbols-outlined">check_circle</span>
								<span>Your email is verified! You have access to all features.</span>
							</div>
						)}
					</div>

					{/* Personal Information Card */}
					<div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
						<div className="flex justify-between items-center mb-6">
							<div>
								<h2 className="text-2xl font-bold text-white mb-1">
									Personal Information
								</h2>
								<p className="text-sm text-gray-400">Update your personal details</p>
							</div>

							{!isEditingPersonal && !loadingProfile && (
								<button
									onClick={() => setIsEditingPersonal(true)}
									className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
								>
									<span className="material-symbols-outlined text-lg">edit</span>
									Edit Info
								</button>
							)}
						</div>

						{loadingProfile ? (
							<div className="flex justify-center items-center py-8">
								<span className="material-symbols-outlined text-4xl text-blue-400 animate-spin">
									progress_activity
								</span>
							</div>
						) : !isEditingPersonal ? (
							// Display Mode
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Phone Number */}
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-2">
										Phone Number
									</label>
									<div className="bg-black/30 rounded-lg px-4 py-3 border border-white/5">
										<p className="text-white">{profileData?.phoneNumber || 'Not set'}</p>
									</div>
								</div>

								{/* Birth Date */}
								<div>
									<label className="block text-sm font-medium text-gray-400 mb-2">
										Birth Date
									</label>
									<div className="bg-black/30 rounded-lg px-4 py-3 border border-white/5">
										<p className="text-white">
											{profileData?.birthDay
												? formatDate(profileData.birthDay)
												: 'Not set'}
										</p>
									</div>
								</div>

								{/* Address */}
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-400 mb-2">
										Address
									</label>
									<div className="bg-black/30 rounded-lg px-4 py-3 border border-white/5">
										<p className="text-white">{profileData?.address || 'Not set'}</p>
									</div>
								</div>
							</div>
						) : (
							// Edit Mode
							<form onSubmit={handleProfileUpdate} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Phone Number */}
									<div>
										<label
											htmlFor="phoneNumber"
											className="block text-sm font-medium text-gray-400 mb-2"
										>
											Phone Number
										</label>
										<input
											type="tel"
											id="phoneNumber"
											name="phoneNumber"
											value={profileForm.phoneNumber}
											onChange={handleProfileChange}
											disabled={profileFormLoading}
											className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
											placeholder="Enter phone number"
										/>
									</div>

									{/* Birth Date */}
									<div>
										<label
											htmlFor="birthDay"
											className="block text-sm font-medium text-gray-400 mb-2"
										>
											Birth Date
										</label>
										<input
											type="date"
											id="birthDay"
											name="birthDay"
											value={profileForm.birthDay}
											onChange={handleProfileChange}
											disabled={profileFormLoading}
											className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
										/>
									</div>

									{/* Address */}
									<div className="md:col-span-2">
										<label
											htmlFor="address"
											className="block text-sm font-medium text-gray-400 mb-2"
										>
											Address
										</label>
										<textarea
											id="address"
											name="address"
											value={profileForm.address}
											onChange={handleProfileChange}
											disabled={profileFormLoading}
											rows={3}
											className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
											placeholder="Enter your address"
										/>
									</div>
								</div>

								{/* Form Actions */}
								<div className="flex justify-end gap-3 pt-4">
									<button
										type="button"
										onClick={() => {
											setIsEditingPersonal(false)
											// Reset to original values
											setProfileForm({
												...profileForm,
												phoneNumber: profileData?.phoneNumber || '',
												address: profileData?.address || '',
												birthDay: profileData?.birthDay
													? new Date(profileData.birthDay).toISOString().split('T')[0]
													: '',
											})
										}}
										disabled={profileFormLoading}
										className="px-4 py-2 rounded-lg bg-transparent border border-white/20 text-gray-300 hover:bg-white/5 font-semibold transition-colors disabled:opacity-50"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={profileFormLoading}
										className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
									>
										{profileFormLoading ? (
											<>
												<span className="material-symbols-outlined text-lg animate-spin">
													progress_activity
												</span>
												Updating...
											</>
										) : (
											<>
												<span className="material-symbols-outlined text-lg">
													check_circle
												</span>
												Update Info
											</>
										)}
									</button>
								</div>
							</form>
						)}
					</div>

					{/* Restaurant Information Card (Only for USER role - RoleEnum.USER = 2) */}
					{(user?.role === 2 ||
						user?.role === 'USER' ||
						user?.role === 'User' ||
						user?.roles?.includes('USER') ||
						user?.roles?.includes(2)) && (
						<div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
							<div className="flex justify-between items-center mb-6">
								<div>
									<h2 className="text-2xl font-bold text-white mb-1">
										Restaurant Information
									</h2>
									<p className="text-sm text-gray-400">Manage your restaurant details</p>
								</div>

								{!isEditingRestaurant && (
									<button
										onClick={() => setIsEditingRestaurant(true)}
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
									>
										<span className="material-symbols-outlined text-lg">edit</span>
										Edit Info
									</button>
								)}
							</div>

							{!isEditingRestaurant ? (
								// Display Mode
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* Restaurant Name */}
									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-400 mb-2">
											Restaurant Name
										</label>
										<div className="bg-black/30 rounded-lg px-4 py-3 border border-white/5">
											<p className="text-white">
												{profileData?.restaurantName || 'Not set'}
											</p>
										</div>
									</div>

									{/* Business Address */}
									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-400 mb-2">
											Business Address
										</label>
										<div className="bg-black/30 rounded-lg px-4 py-3 border border-white/5">
											<p className="text-white">
												{profileData?.businessAddress || 'Not set'}
											</p>
										</div>
									</div>

									{/* Contract Number */}
									<div>
										<label className="block text-sm font-medium text-gray-400 mb-2">
											Contract Number
										</label>
										<div className="bg-black/30 rounded-lg px-4 py-3 border border-white/5">
											<p className="text-white">
												{profileData?.contractNumber || 'Not set'}
											</p>
										</div>
									</div>

									{/* Contract Email */}
									<div>
										<label className="block text-sm font-medium text-gray-400 mb-2">
											Contract Email
										</label>
										<div className="bg-black/30 rounded-lg px-4 py-3 border border-white/5">
											<p className="text-white">
												{profileData?.contractEmail || 'Not set'}
											</p>
										</div>
									</div>
								</div>
							) : (
								// Edit Mode
								<form onSubmit={handleProfileUpdate} className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* Restaurant Name */}
										<div className="md:col-span-2">
											<label
												htmlFor="restaurantName"
												className="block text-sm font-medium text-gray-400 mb-2"
											>
												Restaurant Name
											</label>
											<input
												type="text"
												id="restaurantName"
												name="restaurantName"
												value={profileForm.restaurantName}
												onChange={handleProfileChange}
												disabled={profileFormLoading}
												className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
												placeholder="Enter restaurant name"
											/>
										</div>

										{/* Business Address */}
										<div className="md:col-span-2">
											<label
												htmlFor="businessAddress"
												className="block text-sm font-medium text-gray-400 mb-2"
											>
												Business Address
											</label>
											<textarea
												id="businessAddress"
												name="businessAddress"
												value={profileForm.businessAddress}
												onChange={handleProfileChange}
												disabled={profileFormLoading}
												rows={2}
												className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
												placeholder="Enter business address"
											/>
										</div>

										{/* Contract Number */}
										<div>
											<label
												htmlFor="contractNumber"
												className="block text-sm font-medium text-gray-400 mb-2"
											>
												Contract Number
											</label>
											<input
												type="text"
												id="contractNumber"
												name="contractNumber"
												value={profileForm.contractNumber}
												onChange={handleProfileChange}
												disabled={profileFormLoading}
												className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
												placeholder="Enter contract number"
											/>
										</div>

										{/* Contract Email */}
										<div>
											<label
												htmlFor="contractEmail"
												className="block text-sm font-medium text-gray-400 mb-2"
											>
												Contract Email
											</label>
											<input
												type="email"
												id="contractEmail"
												name="contractEmail"
												value={profileForm.contractEmail}
												onChange={handleProfileChange}
												disabled={profileFormLoading}
												className="w-full bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
												placeholder="Enter contract email"
											/>
										</div>
									</div>

									{/* Form Actions */}
									<div className="flex justify-end gap-3 pt-4">
										<button
											type="button"
											onClick={() => {
												setIsEditingRestaurant(false)
												// Reset to original values
												setProfileForm({
													...profileForm,
													restaurantName: profileData?.restaurantName || '',
													businessAddress: profileData?.businessAddress || '',
													contractNumber: profileData?.contractNumber || '',
													contractEmail: profileData?.contractEmail || '',
												})
											}}
											disabled={profileFormLoading}
											className="px-4 py-2 rounded-lg bg-transparent border border-white/20 text-gray-300 hover:bg-white/5 font-semibold transition-colors disabled:opacity-50"
										>
											Cancel
										</button>
										<button
											type="submit"
											disabled={profileFormLoading}
											className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
										>
											{profileFormLoading ? (
												<>
													<span className="material-symbols-outlined text-lg animate-spin">
														progress_activity
													</span>
													Updating...
												</>
											) : (
												<>
													<span className="material-symbols-outlined text-lg">
														check_circle
													</span>
													Update Restaurant
												</>
											)}
										</button>
									</div>
								</form>
							)}
						</div>
					)}
				</div>
			</div>
		</BasePageLayout>
	)
}

export default Profile
