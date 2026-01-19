import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { customerLogoutAPI } from '../../../../services/api/customerAPI'
import {
	sendVerificationEmailAPI,
	verifyEmailCodeAPI,
	checkEmailVerificationStatusAPI,
	resendVerificationEmailAPI,
} from '../../../../services/api/authAPI'
import { getOrderHistoryAPI } from '../../../../services/api/orderAPI'
import CustomerAuth from './CustomerAuth'

const ProfilePage = ({ onBack }) => {
	const [customerAuth, setCustomerAuth] = useState(null)

	// Order History State
	const [showOrderHistory, setShowOrderHistory] = useState(false)
	const [orderHistory, setOrderHistory] = useState([])
	const [orderHistoryLoading, setOrderHistoryLoading] = useState(false)
	const [orderHistoryError, setOrderHistoryError] = useState('')
	const [orderHistoryPagination, setOrderHistoryPagination] = useState({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0,
	})
	const [historyFilter, setHistoryFilter] = useState('all') // all, COMPLETED, IN_PROGRESS, CANCELLED
	const [historySortOrder, setHistorySortOrder] = useState('DESC')

	// Email Verification State
	const [emailVerified, setEmailVerified] = useState(false)
	const [checkingEmailStatus, setCheckingEmailStatus] = useState(true)
	const [showOTPInput, setShowOTPInput] = useState(false)
	const [otpCode, setOtpCode] = useState('')
	const [sendingEmail, setSendingEmail] = useState(false)
	const [verifyingOTP, setVerifyingOTP] = useState(false)
	const [otpError, setOtpError] = useState('')
	const [otpSuccess, setOtpSuccess] = useState('')

	useEffect(() => {
		// Check if in guest mode first
		const isGuest = localStorage.getItem('isGuestMode') === 'true'

		if (isGuest) {
			// Guest mode - no authentication required
			setCustomerAuth({ isGuest: true })
			setCheckingEmailStatus(false)
			return
		}

		const auth = localStorage.getItem('customerAuth')
		if (auth) {
			try {
				const parsedAuth = JSON.parse(auth)
				setCustomerAuth(parsedAuth)

				// ✅ Restore accessToken to window for API calls
				if (parsedAuth?.accessToken) {
					window.accessToken = parsedAuth.accessToken
					console.log('🔑 Customer accessToken restored from localStorage')
				}

				// ✅ Check email verification status after loading auth
				if (parsedAuth?.email) {
					checkEmailVerificationStatus(parsedAuth.email)
				}
			} catch (error) {
				console.error('Failed to parse customer auth:', error)
				setCheckingEmailStatus(false)
			}
		} else {
			setCheckingEmailStatus(false)
		}
	}, [])

	// ✨ Function to check email verification status via API
	const checkEmailVerificationStatus = async (email) => {
		if (!email) {
			setCheckingEmailStatus(false)
			return
		}

		setCheckingEmailStatus(true)
		try {
			const result = await checkEmailVerificationStatusAPI(email)

			if (result.success) {
				setEmailVerified(result.isVerified)
				console.log('📧 Customer email verification status:', result.isVerified)
			} else {
				console.error('Failed to check email status:', result.message)
			}
		} catch (error) {
			console.error('Error checking email verification status:', error)
		} finally {
			setCheckingEmailStatus(false)
		}
	}

	// ✨ Email Verification Functions
	const handleSendVerificationEmail = async () => {
		setSendingEmail(true)
		setOtpError('')
		setOtpSuccess('')

		try {
			const result = await sendVerificationEmailAPI()

			if (result.success) {
				setShowOTPInput(true)
				setOtpSuccess('✅ Verification code sent to your email! Check your inbox.')
			} else {
				setOtpError(result.message || '❌ Failed to send verification email')
			}
		} catch (error) {
			setOtpError('❌ An error occurred. Please try again.')
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
				alert('🎉 Email verified successfully!')

				// ✅ Re-check email status via API
				if (customerAuth?.email) {
					await checkEmailVerificationStatus(customerAuth.email)
				}

				// Update customerAuth in localStorage
				const updatedAuth = { ...customerAuth, isEmailVerified: true }
				localStorage.setItem('customerAuth', JSON.stringify(updatedAuth))
				setCustomerAuth(updatedAuth)
			} else {
				setOtpError(result.message || '❌ Invalid verification code')
			}
		} catch (error) {
			setOtpError('❌ Verification failed. Please try again.')
			console.error('Verify OTP error:', error)
		} finally {
			setVerifyingOTP(false)
		}
	}

	const handleResendOTP = async () => {
		if (!customerAuth?.email) {
			setOtpError('Email not found. Please contact support.')
			return
		}

		setSendingEmail(true)
		setOtpError('')

		try {
			const result = await resendVerificationEmailAPI(customerAuth.email)

			if (result.success) {
				setOtpSuccess('✅ New verification code sent!')
			} else {
				setOtpError(result.message || '❌ Failed to resend code')
			}
		} catch (error) {
			setOtpError('❌ An error occurred. Please try again.')
			console.error('Resend OTP error:', error)
		} finally {
			setSendingEmail(false)
		}
	}

	const handleOTPInputChange = (e) => {
		const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only digits, max 6
		setOtpCode(value)
		setOtpError('') // Clear error when typing
	}

	// ✨ Order History Functions
	const fetchOrderHistory = useCallback(
		async (page = 1, status = historyFilter, sortOrder = historySortOrder) => {
			// Check for customerId (can be 'id' or 'userId' depending on auth source)
			const customerId = customerAuth?.id || customerAuth?.userId
			const tenantId = customerAuth?.ownerId || customerAuth?.tenantId

			if (!customerId || !tenantId) {
				console.warn('⚠️ Order History: Missing auth data', {
					customerId,
					tenantId,
					customerAuth,
				})
				setOrderHistoryError('Customer authentication required')
				return
			}

			setOrderHistoryLoading(true)
			setOrderHistoryError('')

			try {
				const result = await getOrderHistoryAPI({
					tenantId: tenantId,
					customerId: customerId,
					page,
					limit: orderHistoryPagination.limit,
					status: status === 'all' ? undefined : status,
					sortBy: 'createdAt',
					sortOrder: sortOrder,
				})

				if (result.success) {
					setOrderHistory(result.data?.orders || [])
					setOrderHistoryPagination({
						page: result.data?.page || 1,
						limit: result.data?.limit || 10,
						total: result.data?.total || 0,
						totalPages: result.data?.totalPages || 0,
					})
					console.log('📜 Order history loaded:', result.data)
				} else {
					setOrderHistoryError(result.message || 'Failed to load order history')
				}
			} catch (error) {
				console.error('Error fetching order history:', error)
				setOrderHistoryError('An error occurred while loading order history')
			} finally {
				setOrderHistoryLoading(false)
			}
		},
		[
			customerAuth?.id,
			customerAuth?.userId,
			customerAuth?.ownerId,
			customerAuth?.tenantId,
			historyFilter,
			historySortOrder,
			orderHistoryPagination.limit,
		],
	)

	const handleShowOrderHistory = () => {
		setShowOrderHistory(true)
		fetchOrderHistory(1, historyFilter, historySortOrder)
	}

	const handleFilterChange = (newFilter) => {
		setHistoryFilter(newFilter)
		fetchOrderHistory(1, newFilter, historySortOrder)
	}

	const handleSortOrderChange = () => {
		const newSortOrder = historySortOrder === 'DESC' ? 'ASC' : 'DESC'
		setHistorySortOrder(newSortOrder)
		fetchOrderHistory(orderHistoryPagination.page, historyFilter, newSortOrder)
	}

	const handlePageChange = (newPage) => {
		fetchOrderHistory(newPage, historyFilter, historySortOrder)
	}

	// Helper function to format date
	const formatDate = (dateString) => {
		const date = new Date(dateString)
		return date.toLocaleDateString('vi-VN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	// Helper function to get status color
	const getStatusColor = (status) => {
		switch (status) {
			case 'COMPLETED':
				return 'bg-green-500/20 text-green-400 border-green-500/30'
			case 'IN_PROGRESS':
			case 'PREPARING':
				return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
			case 'PENDING':
				return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
			case 'CANCELLED':
				return 'bg-red-500/20 text-red-400 border-red-500/30'
			default:
				return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
		}
	}

	// Helper function to get payment status color
	const getPaymentStatusColor = (status) => {
		switch (status) {
			case 'PAID':
				return 'bg-green-500/20 text-green-400'
			case 'PENDING':
				return 'bg-yellow-500/20 text-yellow-400'
			case 'FAILED':
			case 'REFUNDED':
				return 'bg-red-500/20 text-red-400'
			default:
				return 'bg-gray-500/20 text-gray-400'
		}
	}

	const handleLogout = () => {
		customerLogoutAPI()
		// Clear guest mode flag
		localStorage.removeItem('isGuestMode')
		// Set flag to show CustomerAuth modal after reload
		localStorage.setItem('showAuthAfterLogout', 'true')
		// Reload to show CustomerAuth modal
		window.location.reload()
	}

	const handleAuthSuccess = (customer) => {
		console.log('✅ Login successful:', customer)

		// Update guest mode flag
		if (customer?.isGuest) {
			localStorage.setItem('isGuestMode', 'true')
		} else {
			localStorage.setItem('isGuestMode', 'false')
			if (customer) {
				localStorage.setItem('customerAuth', JSON.stringify(customer))
			}
		}

		// Reload to update state
		window.location.reload()
	}

	// Guest mode or not logged in - show auth modal
	if (customerAuth?.isGuest || !customerAuth) {
		return (
			<div className="flex flex-col items-center justify-center h-full relative">
				<CustomerAuth
					onClose={() => {
						if (onBack) onBack()
					}}
					onSuccess={handleAuthSuccess}
				/>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className="flex flex-col h-full bg-gradient-to-br from-gray-900 to-gray-800"
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-700">
				<button
					onClick={onBack}
					className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
				>
					<span className="material-symbols-outlined text-white">arrow_back</span>
				</button>
				<h1 className="text-xl font-bold text-white">My Profile</h1>
				<button
					onClick={handleLogout}
					className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
				>
					Logout
				</button>
			</div>

			{/* Profile Content */}
			<div className="flex-1 overflow-y-auto p-6">
				{/* Avatar Section */}
				<div className="flex flex-col items-center mb-8">
					<div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
						<span className="material-symbols-outlined text-white text-5xl">person</span>
					</div>
					<h2 className="text-2xl font-bold text-white mb-1">
						{customerAuth.username || customerAuth.name || 'Customer'}
					</h2>
					{customerAuth.roles && customerAuth.roles.length > 0 && (
						<div className="mt-2 flex gap-2">
							{customerAuth.roles.map((role, index) => (
								<span
									key={index}
									className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
								>
									{role}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Profile Information Cards */}
				<div className="space-y-4">
					{/* Username Card */}
					{customerAuth.username && (
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
									<span className="material-symbols-outlined text-purple-400">badge</span>
								</div>
								<div className="flex-1">
									<p className="text-gray-400 text-sm">Username</p>
									<p className="text-white font-medium">{customerAuth.username}</p>
								</div>
							</div>
						</div>
					)}

					{/* Email Card */}
					{customerAuth.email && (
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
									<span className="material-symbols-outlined text-blue-400">mail</span>
								</div>
								<div className="flex-1">
									<p className="text-gray-400 text-sm">Email Address</p>
									<p className="text-white font-medium">{customerAuth.email}</p>
								</div>
							</div>
						</div>
					)}

					{/* Phone Card */}
					{customerAuth.phone && (
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
									<span className="material-symbols-outlined text-green-400">phone</span>
								</div>
								<div className="flex-1">
									<p className="text-gray-400 text-sm">Phone Number</p>
									<p className="text-white font-medium">{customerAuth.phone}</p>
								</div>
							</div>
						</div>
					)}

					{/* Email Verification - Account Status */}
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
									<span className="material-symbols-outlined text-yellow-400">
										{checkingEmailStatus
											? 'progress_activity'
											: emailVerified
												? 'verified'
												: 'mail'}
									</span>
								</div>
								<div className="flex-1">
									<p className="text-gray-400 text-sm">Account Status</p>
									<p className="text-white font-medium">
										{customerAuth?.email || 'No email'}
									</p>
								</div>
							</div>

							{/* Verification Status Badge */}
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
							<div className="mt-4 space-y-3">
								{/* Info Message */}
								<div className="text-xs text-blue-400 flex items-start gap-2 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
									<span className="material-symbols-outlined text-sm">info</span>
									<span>Verify your email to access all features</span>
								</div>

								{/* Send Verification Button */}
								{!showOTPInput && (
									<button
										type="button"
										onClick={handleSendVerificationEmail}
										disabled={sendingEmail}
										className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
									>
										<span className="material-symbols-outlined text-base">
											{sendingEmail ? 'progress_activity' : 'send'}
										</span>
										<span>{sendingEmail ? 'Sending...' : 'Send Code'}</span>
									</button>
								)}

								{/* OTP Input Form */}
								{showOTPInput && (
									<div className="space-y-3">
										{/* Success Message */}
										{otpSuccess && (
											<div className="text-xs text-green-400 flex items-start gap-2 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
												<span className="material-symbols-outlined text-sm">
													check_circle
												</span>
												<span>{otpSuccess}</span>
											</div>
										)}

										{/* OTP Input */}
										<div className="space-y-2">
											<label className="text-xs font-medium text-gray-300">
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
												className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												disabled={verifyingOTP}
											/>
										</div>

										{/* Error Message */}
										{otpError && (
											<div className="text-xs text-red-400 flex items-start gap-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
												<span className="material-symbols-outlined text-sm">error</span>
												<span>{otpError}</span>
											</div>
										)}

										{/* Action Buttons */}
										<div className="flex gap-2">
											<button
												type="button"
												onClick={handleVerifyOTP}
												disabled={verifyingOTP || otpCode.length !== 6}
												className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
											>
												<span className="material-symbols-outlined text-base">
													{verifyingOTP ? 'progress_activity' : 'verified'}
												</span>
												<span>{verifyingOTP ? 'Verifying...' : 'Verify'}</span>
											</button>

											<button
												type="button"
												onClick={handleResendOTP}
												disabled={sendingEmail}
												className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
											>
												<span className="material-symbols-outlined text-base">
													refresh
												</span>
											</button>
										</div>

										{/* Expiry Info */}
										<div className="text-xs text-gray-400 flex items-start gap-2">
											<span className="material-symbols-outlined text-sm">schedule</span>
											<span>Code expires in 5 minutes</span>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Already Verified Message */}
						{!checkingEmailStatus && emailVerified && (
							<div className="mt-3 text-xs text-green-400 flex items-center gap-2 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
								<span className="material-symbols-outlined text-sm">check_circle</span>
								<span>Your email is verified!</span>
							</div>
						)}
					</div>
				</div>

				{/* Actions Section */}
				<div className="mt-8 space-y-3">
					<button
						onClick={handleShowOrderHistory}
						className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-700/50 transition-colors text-left"
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">history</span>
								<span className="text-white font-medium">Order History</span>
							</div>
							<span className="material-symbols-outlined text-gray-400">
								chevron_right
							</span>
						</div>
					</button>

					<button className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-700/50 transition-colors text-left">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">favorite</span>
								<span className="text-white font-medium">Favorite Dishes</span>
							</div>
							<span className="material-symbols-outlined text-gray-400">
								chevron_right
							</span>
						</div>
					</button>

					<button className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-700/50 transition-colors text-left">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">
									location_on
								</span>
								<span className="text-white font-medium">Saved Addresses</span>
							</div>
							<span className="material-symbols-outlined text-gray-400">
								chevron_right
							</span>
						</div>
					</button>

					<button className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:bg-gray-700/50 transition-colors text-left">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-gray-400">
									notifications
								</span>
								<span className="text-white font-medium">Notifications</span>
							</div>
							<span className="material-symbols-outlined text-gray-400">
								chevron_right
							</span>
						</div>
					</button>
				</div>
			</div>

			{/* Order History Modal */}
			<AnimatePresence>
				{showOrderHistory && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
						onClick={() => setShowOrderHistory(false)}
					>
						<motion.div
							initial={{ y: '100%', opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: '100%', opacity: 0 }}
							transition={{ type: 'spring', damping: 25, stiffness: 300 }}
							onClick={(e) => e.stopPropagation()}
							className="w-full max-w-2xl max-h-[85vh] bg-gray-900 rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
						>
							{/* Modal Header */}
							<div className="flex items-center justify-between p-4 border-b border-gray-700">
								<h2 className="text-xl font-bold text-white flex items-center gap-2">
									<span className="material-symbols-outlined text-blue-400">history</span>
									Order History
								</h2>
								<button
									onClick={() => setShowOrderHistory(false)}
									className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
								>
									<span className="material-symbols-outlined text-gray-400">close</span>
								</button>
							</div>

							{/* Filters */}
							<div className="p-4 border-b border-gray-700 flex flex-wrap gap-2 items-center">
								<div className="flex gap-2 flex-wrap flex-1">
									{['all', 'COMPLETED', 'IN_PROGRESS', 'CANCELLED'].map((filter) => (
										<button
											key={filter}
											onClick={() => handleFilterChange(filter)}
											className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
												historyFilter === filter
													? 'bg-blue-500 text-white'
													: 'bg-gray-800 text-gray-400 hover:bg-gray-700'
											}`}
										>
											{filter === 'all' ? 'All' : filter.replace('_', ' ')}
										</button>
									))}
								</div>
								<button
									onClick={handleSortOrderChange}
									className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-gray-400 hover:bg-gray-700 rounded-lg text-sm transition-colors"
									title={historySortOrder === 'DESC' ? 'Newest first' : 'Oldest first'}
								>
									<span className="material-symbols-outlined text-base">
										{historySortOrder === 'DESC' ? 'arrow_downward' : 'arrow_upward'}
									</span>
									{historySortOrder === 'DESC' ? 'Newest' : 'Oldest'}
								</button>
							</div>

							{/* Content */}
							<div className="flex-1 overflow-y-auto p-4">
								{orderHistoryLoading ? (
									<div className="flex flex-col items-center justify-center py-12">
										<span className="material-symbols-outlined text-4xl text-blue-400 animate-spin">
											progress_activity
										</span>
										<p className="text-gray-400 mt-4">Loading order history...</p>
									</div>
								) : orderHistoryError ? (
									<div className="flex flex-col items-center justify-center py-12">
										<span className="material-symbols-outlined text-4xl text-red-400">
											error
										</span>
										<p className="text-red-400 mt-4">{orderHistoryError}</p>
										<button
											onClick={() =>
												fetchOrderHistory(1, historyFilter, historySortOrder)
											}
											className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
										>
											Retry
										</button>
									</div>
								) : orderHistory.length === 0 ? (
									<div className="flex flex-col items-center justify-center py-12">
										<span className="material-symbols-outlined text-4xl text-gray-500">
											receipt_long
										</span>
										<p className="text-gray-400 mt-4">No orders found</p>
										<p className="text-gray-500 text-sm mt-1">
											Your order history will appear here
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{orderHistory.map((order) => (
											<div
												key={order.id}
												className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
											>
												{/* Order Header */}
												<div className="flex items-start justify-between mb-3">
													<div>
														<p className="text-white font-medium">
															Order #{order.orderNumber || order.id?.slice(0, 8)}
														</p>
														<p className="text-gray-400 text-sm">
															{formatDate(order.createdAt)}
														</p>
													</div>
													<div className="flex flex-col items-end gap-1">
														<span
															className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
														>
															{order.status}
														</span>
														<span
															className={`px-2 py-0.5 rounded text-xs ${getPaymentStatusColor(order.paymentStatus)}`}
														>
															{order.paymentStatus}
														</span>
													</div>
												</div>

												{/* Order Items */}
												{order.items && order.items.length > 0 && (
													<div className="border-t border-gray-700 pt-3 mt-3">
														<p className="text-gray-400 text-xs mb-2">
															{order.items.length} item(s)
														</p>
														<div className="space-y-2">
															{order.items.slice(0, 3).map((item, idx) => (
																<div
																	key={item.id || idx}
																	className="flex items-center justify-between text-sm"
																>
																	<div className="flex items-center gap-2">
																		<span className="text-gray-300">
																			{item.quantity}x
																		</span>
																		<span className="text-white">
																			{item.menuItemName || item.name}
																		</span>
																	</div>
																	<span className="text-gray-400">
																		{item.itemTotal?.toLocaleString('vi-VN')}đ
																	</span>
																</div>
															))}
															{order.items.length > 3 && (
																<p className="text-gray-500 text-xs">
																	+{order.items.length - 3} more items...
																</p>
															)}
														</div>
													</div>
												)}

												{/* Order Total */}
												<div className="border-t border-gray-700 pt-3 mt-3 flex items-center justify-between">
													<span className="text-gray-400">Total</span>
													<span className="text-white font-bold text-lg">
														{order.total?.toLocaleString('vi-VN')}đ
													</span>
												</div>

												{/* Table Info */}
												{order.tableName && (
													<div className="mt-2 text-xs text-gray-500">
														Table: {order.tableName}
														{order.floorName && ` - ${order.floorName}`}
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>

							{/* Pagination */}
							{orderHistoryPagination.totalPages > 1 && (
								<div className="p-4 border-t border-gray-700 flex items-center justify-between">
									<p className="text-gray-400 text-sm">
										Page {orderHistoryPagination.page} of{' '}
										{orderHistoryPagination.totalPages}
										<span className="ml-2 text-gray-500">
											({orderHistoryPagination.total} orders)
										</span>
									</p>
									<div className="flex gap-2">
										<button
											onClick={() => handlePageChange(orderHistoryPagination.page - 1)}
											disabled={orderHistoryPagination.page <= 1}
											className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<span className="material-symbols-outlined text-base">
												chevron_left
											</span>
										</button>
										<button
											onClick={() => handlePageChange(orderHistoryPagination.page + 1)}
											disabled={
												orderHistoryPagination.page >= orderHistoryPagination.totalPages
											}
											className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<span className="material-symbols-outlined text-base">
												chevron_right
											</span>
										</button>
									</div>
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

export default ProfilePage
