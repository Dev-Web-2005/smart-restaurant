import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { useLoading } from '../../contexts/LoadingContext'
import FloatingInputField from '../../components/form/FloatingInputField'
import BasePageLayout from '../../components/layout/BasePageLayout'
import { ButtonLoader } from '../../components/common/LoadingSpinner'
import BackgroundImage from '../../components/common/BackgroundImage'
import {
	createKYCSession,
	getKYCResult,
	completeKYCVerification,
} from '../../services/api/kycAPI'

// Onboarding steps
const STEPS = [
	{ id: 1, name: 'Business Information', percent: 33 },
	{ id: 2, name: 'Payment & Identity', percent: 66 }, // Đổi tên bước 2
	{ id: 3, name: 'Review & Finish', percent: 100 },
]

// Tailwind custom classes
const TAILWIND_CLASSES = {
	bgDark: 'bg-black/60 backdrop-blur-sm',
	cardBgDark: 'bg-black/40 backdrop-blur-md border-white/10',
	primary: 'bg-[#137fec] hover:bg-[#137fec]/90',
	textDark: 'text-white',
	textSecondaryDark: 'text-gray-300',
	textLabelDark: 'text-gray-200',
	textPlaceholderDark: 'placeholder:text-gray-400',
	inputBorderDark: 'border-white/20',
	progressBgDark: 'bg-white/20',
	locationBgDark: 'bg-black/30',
	dropzoneHover: 'hover:bg-black/30 hover:border-white/30',
	dropzoneBorder: 'border-white/20',
}

// Step 1: Business Information
const Step1 = ({ formData, handleChange }) => {
	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
			<div className="sm:col-span-2">
				<FloatingInputField
					label="Restaurant Name"
					type="text"
					id="restaurantName"
					name="restaurantName"
					value={formData.restaurantName}
					onChange={handleChange}
					placeholder="e.g., The Gourmet Kitchen"
					required
				/>
			</div>

			<div className="sm:col-span-2">
				<FloatingInputField
					label="Address"
					type="text"
					id="address"
					name="address"
					value={formData.address}
					onChange={handleChange}
					placeholder="Enter restaurant address"
					icon={<span className="material-symbols-outlined">location_on</span>}
					iconPosition="left"
					required
				/>
			</div>

			<div className="sm-col-span-1">
				<FloatingInputField
					label="Phone Number (Hotline)"
					type="tel"
					id="phone"
					name="phone"
					value={formData.phone}
					onChange={handleChange}
					placeholder="(123) 456-7890"
					icon={<span className="material-symbols-outlined">phone</span>}
					iconPosition="left"
					required
				/>
			</div>

			<div className="sm-col-span-1">
				<FloatingInputField
					label="Contact Email"
					type="email"
					id="email"
					name="email"
					value={formData.email}
					onChange={handleChange}
					placeholder="contact@example.com"
					icon={<span className="material-symbols-outlined">mail</span>}
					iconPosition="left"
					required
				/>
			</div>

			{/* Đã xóa phần Logo */}
		</div>
	)
}

// ===========================================
// Sub-component: File Dropzone (Component mới để tái sử dụng)
// ===========================================
const FileDropzone = ({ id, name, label, file, handleFileChange }) => {
	return (
		<div className="sm-col-span-1">
			<label className="block">
				<p className={`pb-2 text-sm font-medium ${TAILWIND_CLASSES.textLabelDark}`}>
					{label}
				</p>
			</label>
			<label
				className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${TAILWIND_CLASSES.cardBgDark} ${TAILWIND_CLASSES.dropzoneBorder} ${TAILWIND_CLASSES.dropzoneHover}`}
				htmlFor={id}
			>
				<div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-2">
					<span
						className={`material-symbols-outlined text-3xl ${TAILWIND_CLASSES.textSecondaryDark}`}
					>
						{file ? 'check_circle' : 'cloud_upload'}
					</span>
					<p className={`mb-1 text-xs ${TAILWIND_CLASSES.textSecondaryDark}`}>
						<span className="font-semibold">Click to upload</span> or drag and drop
					</p>
					<p className={`text-xs ${TAILWIND_CLASSES.textSecondaryDark}`}>
						{file ? file.name : 'PNG, JPG, or PDF (Max 5MB)'}
					</p>
				</div>
				<input
					className="dropzone-input hidden"
					id={id}
					name={name}
					type="file"
					accept=".png,.jpg,.jpeg,.pdf"
					onChange={handleFileChange}
				/>
			</label>
		</div>
	)
}

// ===========================================
// Sub-component: STEP 2 - Payment & Identity Verification
// ===========================================
const Step2 = ({
	formData,
	handleChange,
	kycStatus,
	onVerifyIdentity,
	checkKYCStatus,
	kycLoading,
}) => {
	return (
		<div className="space-y-6">
			<h2 className={`text-xl font-bold ${TAILWIND_CLASSES.textDark} mb-4`}>
				Billing Information
			</h2>
			{/* Cardholder Name */}
			<FloatingInputField
				label="Cardholder Name"
				type="text"
				id="cardholderName"
				name="cardholderName"
				value={formData.cardholderName}
				onChange={handleChange}
				placeholder="Enter name as it appears on card"
				required
			/>

			{/* Card Number / Account Number */}
			<FloatingInputField
				label="Account Number (or Card Number)"
				type="text"
				id="accountNumber"
				name="accountNumber"
				value={formData.accountNumber}
				onChange={handleChange}
				placeholder="XXXX XXXX XXXX XXXX"
				icon={<span className="material-symbols-outlined">credit_card</span>}
				iconPosition="left"
				required
			/>

			{/* Expiration Date and CVV Group */}
			<div className="grid grid-cols-2 gap-4">
				<FloatingInputField
					label="Expiration Date"
					type="text"
					id="expirationDate"
					name="expirationDate"
					value={formData.expirationDate}
					onChange={handleChange}
					placeholder="MM / YY"
					required
				/>
				<FloatingInputField
					label="CSC / CVV Code"
					type="password"
					id="cvv"
					name="cvv"
					value={formData.cvv}
					onChange={handleChange}
					placeholder="•••"
					maxLength={4}
					required
				/>
			</div>

			<div
				className={`security-text flex items-center justify-center text-xs ${TAILWIND_CLASSES.textSecondaryDark} pt-2`}
			>
				<span className="material-symbols-outlined text-sm mr-1.5">lock</span>
				<span>Your billing information is encrypted and secure.</span>
			</div>

			<hr className={`border-t ${TAILWIND_CLASSES.inputBorderDark} my-8`} />

			{/* KYC Identity Verification */}
			<h2 className={`text-xl font-bold ${TAILWIND_CLASSES.textDark} mb-4`}>
				Identity Verification (KYC)
			</h2>

			<div
				className={`p-6 rounded-lg ${TAILWIND_CLASSES.cardBgDark} border ${TAILWIND_CLASSES.inputBorderDark}`}
			>
				{!kycStatus.verified ? (
					<>
						<div className="flex items-start gap-4 mb-4">
							<span
								className={`material-symbols-outlined text-3xl ${TAILWIND_CLASSES.textSecondaryDark}`}
							>
								badge
							</span>
							<div>
								<h3 className={`text-lg font-semibold ${TAILWIND_CLASSES.textDark} mb-2`}>
									Verify Your Identity
								</h3>
								<p className={`text-sm ${TAILWIND_CLASSES.textSecondaryDark} mb-4`}>
									We use Didit's secure identity verification service to verify your
									Citizen ID. This process will:
								</p>
								<ul
									className={`text-sm ${TAILWIND_CLASSES.textSecondaryDark} list-disc list-inside space-y-1 mb-4`}
								>
									<li>Open a secure verification window</li>
									<li>Scan your Citizen ID (front & back)</li>
									<li>Take a selfie for face matching</li>
									<li>Automatically extract your information</li>
								</ul>
							</div>
						</div>

						<button
							onClick={onVerifyIdentity}
							disabled={kycLoading}
							className={`w-full flex items-center justify-center h-12 rounded-lg ${
								TAILWIND_CLASSES.primary
							} text-base font-semibold ${TAILWIND_CLASSES.textDark} transition-colors ${
								kycLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'
							}`}
						>
							{kycLoading ? (
								<>
									<svg
										className="animate-spin h-5 w-5 mr-2"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Checking...
								</>
							) : (
								<>
									<span className="material-symbols-outlined mr-2">verified_user</span>
									{kycStatus.sessionId
										? 'Start New Verification'
										: 'Start Identity Verification'}
								</>
							)}
						</button>

						{kycStatus.sessionId && !kycStatus.verified && (
							<button
								onClick={checkKYCStatus}
								disabled={kycLoading}
								className={`w-full mt-3 flex items-center justify-center h-12 rounded-lg border-2 ${
									TAILWIND_CLASSES.borderDark
								} text-base font-semibold ${
									TAILWIND_CLASSES.textDark
								} transition-colors ${
									kycLoading
										? 'opacity-70 cursor-wait'
										: 'cursor-pointer hover:bg-white/5'
								}`}
							>
								<span className="material-symbols-outlined mr-2">refresh</span>
								Check Verification Status
							</button>
						)}

						<div
							className={`mt-3 p-3 bg-blue-600/10 border border-blue-600/50 rounded-lg`}
						>
							<p className="text-sm text-blue-400">
								<span className="material-symbols-outlined text-base mr-1 align-middle">
									info
								</span>
								After completing verification in the pop-up window, click &quot;Check
								Verification Status&quot; to continue.
							</p>
						</div>

						{kycStatus.error && (
							<div className="mt-4 p-3 bg-red-600/10 border border-red-600/50 rounded-lg">
								<p className="text-sm text-red-400">{kycStatus.error}</p>
							</div>
						)}
					</>
				) : (
					<>
						<div className="flex items-start gap-4">
							<span className="material-symbols-outlined text-3xl text-green-500">
								check_circle
							</span>
							<div className="flex-1">
								<h3 className={`text-lg font-semibold ${TAILWIND_CLASSES.textDark} mb-2`}>
									Identity Verified Successfully
								</h3>
								{kycStatus.citizenInfo && (
									<div
										className={`text-sm ${TAILWIND_CLASSES.textSecondaryDark} space-y-1`}
									>
										<p>
											<strong>Name:</strong> {kycStatus.citizenInfo.fullName}
										</p>
										<p>
											<strong>ID Number:</strong> {kycStatus.citizenInfo.idNumber}
										</p>
										<p>
											<strong>Date of Birth:</strong> {kycStatus.citizenInfo.dateOfBirth}
										</p>
									</div>
								)}
								<button
									onClick={onVerifyIdentity}
									className={`mt-4 text-sm ${TAILWIND_CLASSES.primary} px-4 py-2 rounded hover:opacity-80`}
								>
									Verify Again
								</button>
							</div>
						</div>
					</>
				)}
			</div>

			<div
				className={`security-text flex items-center justify-center text-xs ${TAILWIND_CLASSES.textSecondaryDark} pt-4`}
			>
				<span className="material-symbols-outlined text-sm mr-1.5">lock</span>
				<span>Your identity data is encrypted and processed securely by Didit.</span>
			</div>
		</div>
	)
}

// ===========================================
// Sub-component: STEP 3 - Review Information
// ===========================================
const Step3 = ({ formData, kycStatus }) => {
	// Sử dụng formData thực tế để review
	const data = formData

	const maskAccountNumber = (accountNumber) => {
		if (!accountNumber || accountNumber.length < 8) return '••••'
		const lastFour = accountNumber.slice(-4)
		// Ẩn 4 ký tự đầu và hiển thị 4 ký tự cuối
		return accountNumber.slice(0, accountNumber.length - 4).replace(/./g, '•') + lastFour
	}

	return (
		<>
			{/* ------------------- BUSINESS INFORMATION ------------------- */}
			<div className="mb-10">
				<h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5 border-t border-t-white/10 m-0">
					Business Information
				</h2>
				{/* Lưới 2 cột: Label (25%) và Value (1fr) */}
				<div className="grid grid-cols-1 sm:grid-cols-[25%_1fr] gap-x-6">
					<div
						className={`col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5`}
					>
						<p className={TAILWIND_CLASSES.textSecondaryDark}>Restaurant Name</p>
						<p className={TAILWIND_CLASSES.textDark}>{data.restaurantName}</p>
					</div>

					<div className="col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5">
						<p className={TAILWIND_CLASSES.textSecondaryDark}>Business Address</p>
						<p className={TAILWIND_CLASSES.textDark}>{data.address}</p>
					</div>

					<div className="col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5">
						<p className={TAILWIND_CLASSES.textSecondaryDark}>Contact Phone Number</p>
						<p className={TAILWIND_CLASSES.textDark}>{data.phone}</p>
					</div>

					<div className="col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5">
						<p className={TAILWIND_CLASSES.textSecondaryDark}>Contact Email</p>
						<p className={TAILWIND_CLASSES.textDark}>{data.email}</p>
					</div>
					{/* Đã xóa phần Logo Status */}
				</div>
			</div>

			{/* ------------------- PAYMENT INFORMATION ------------------- */}
			<div className="mb-10">
				<h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-5 border-t border-t-white/10 m-0">
					Payment & Identity Information
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-[25%_1fr] gap-x-6">
					<div className="col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5">
						<p className={TAILWIND_CLASSES.textSecondaryDark}>Cardholder Name</p>
						<p className={TAILWIND_CLASSES.textDark}>{data.cardholderName}</p>
					</div>

					<div className="col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5">
						<p className={TAILWIND_CLASSES.textSecondaryDark}>Account Number</p>
						<p className={TAILWIND_CLASSES.textDark} style={{ letterSpacing: '0.1rem' }}>
							{/* Hiển thị masked account number */}
							{maskAccountNumber(data.accountNumber)}
						</p>
					</div>

					<div className="col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5">
						<p className={TAILWIND_CLASSES.textSecondaryDark}>Expiration Date</p>
						<p className={TAILWIND_CLASSES.textDark}>{data.expirationDate}</p>
					</div>

					<div className="col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5">
						<p className={TAILWIND_CLASSES.textSecondaryDark}>CVV</p>
						<p className={TAILWIND_CLASSES.textDark}>***</p>
					</div>

					<div className="col-span-2 grid grid-cols-subgrid border-t border-t-white/10 py-5">
						<p className={TAILWIND_CLASSES.textSecondaryDark}>Identity Verification</p>
						<div>
							<p className={`${TAILWIND_CLASSES.textDark} flex items-center gap-2`}>
								{kycStatus.verified ? (
									<>
										<span className="material-symbols-outlined text-green-500">
											check_circle
										</span>
										<span className="text-green-500">Verified</span>
									</>
								) : (
									<>
										<span className="material-symbols-outlined text-yellow-500">
											pending
										</span>
										<span className="text-yellow-500">Not Verified</span>
									</>
								)}
							</p>
							{kycStatus.citizenInfo && (
								<div className={`mt-2 text-sm ${TAILWIND_CLASSES.textSecondaryDark}`}>
									<p>Name: {kycStatus.citizenInfo.fullName}</p>
									<p>ID: {kycStatus.citizenInfo.idNumber}</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

// ===========================================
// Main Component: RestaurantOnboarding
// ===========================================
const RestaurantOnboarding = () => {
	const navigate = useNavigate()
	// Lấy Context user và pendingSignupData
	const { completeOnboarding, pendingSignupData } = useUser()

	// ✅ Flag to prevent redirect during onboarding completion
	const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false)

	// ✅ Redirect to signup if no pending data (but not during onboarding completion)
	useEffect(() => {
		if (!pendingSignupData && !isCompletingOnboarding) {
			console.warn('⚠️ No signup data found, redirecting to signup page')
			navigate('/signup')
		}
	}, [pendingSignupData, isCompletingOnboarding, navigate])

	const [step, setStep] = useState(1)
	const [formData, setFormData] = useState({
		// Step 1: Business Information - Pre-fill with signup data if available
		restaurantName: '',
		address: pendingSignupData?.address || '',
		phone: pendingSignupData?.phoneNumber || '',
		email: pendingSignupData?.email || '',

		// Step 2: Payment (Empty by default)
		cardholderName: pendingSignupData?.fullName || '',
		accountNumber: '',
		expirationDate: '',
		cvv: '',
	})
	const [loading, setLoading] = useState(false)

	// KYC State Management
	const [kycStatus, setKycStatus] = useState({
		verified: false,
		sessionId: null,
		cccdFrontUrl: null,
		cccdBackUrl: null,
		citizenInfo: null,
		error: null,
	})
	const [kycLoading, setKycLoading] = useState(false)
	const [kycWindow, setKycWindow] = useState(null)

	const progress = STEPS.find((s) => s.id === step)

	// Handle KYC verification
	const handleVerifyIdentity = async () => {
		try {
			setKycLoading(true)
			setKycStatus((prev) => ({ ...prev, error: null }))

			// Create KYC session
			const { sessionId, verificationUrl } = await createKYCSession(
				Date.now().toString(),
				formData.email,
				formData.phone,
			)

			console.log('✅ KYC session created:', sessionId)

			// Store session ID
			setKycStatus((prev) => ({
				...prev,
				sessionId,
			}))

			// Open KYC verification in new window
			const width = 800
			const height = 900
			const left = window.screen.width / 2 - width / 2
			const top = window.screen.height / 2 - height / 2

			const verificationWindow = window.open(
				verificationUrl,
				'KYCVerification',
				`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
			)

			if (!verificationWindow) {
				throw new Error('Please allow pop-ups to complete identity verification')
			}

			// Focus on the new window
			verificationWindow.focus()
			setKycWindow(verificationWindow)

			console.log('🪟 KYC verification window opened')
			console.log(
				'ℹ️ Please complete verification in the pop-up, then click "Check Status"',
			)

			// Stop loading - user will manually check status
			setKycLoading(false)
		} catch (error) {
			console.error('❌ KYC verification error:', error)
			setKycStatus((prev) => ({
				...prev,
				error: error.message || 'Failed to start verification',
			}))
			setKycLoading(false)
		}
	}

	// Check KYC verification status manually
	const checkKYCStatus = async () => {
		if (!kycStatus.sessionId) {
			return
		}

		try {
			setKycLoading(true)
			setKycStatus((prev) => ({ ...prev, error: null }))

			// Fetch KYC result from Didit API
			const result = await getKYCResult(kycStatus.sessionId)

			// Debug: Log full result to see exact structure
			console.log('📊 Full KYC Result:', result)
			console.log('📊 Result Status:', result.status)
			console.log('📊 Result Data:', result.data)

			// Normalize status to lowercase for comparison
			const normalizedStatus = (result.status || '').toLowerCase()

			// Check if verification is approved
			if (
				normalizedStatus === 'approved' ||
				normalizedStatus === 'completed' ||
				normalizedStatus === 'success'
			) {
				// Extract and upload CCCD images
				const { cccdFrontUrl, cccdBackUrl, citizenInfo } = await completeKYCVerification(
					kycStatus.sessionId,
				)

				console.log('✅ CCCD images extracted:', {
					cccdFrontUrl,
					cccdBackUrl,
				})

				// Update state
				setKycStatus({
					verified: true,
					sessionId: kycStatus.sessionId,
					cccdFrontUrl,
					cccdBackUrl,
					citizenInfo,
					error: null,
				})

				// Show success message
				alert('✅ Identity verification successful!')
			} else if (
				normalizedStatus === 'in review' ||
				normalizedStatus === 'pending' ||
				normalizedStatus === 'processing'
			) {
				// Still processing
				setKycStatus((prev) => ({
					...prev,
					error:
						'Verification is still being processed. Please wait a moment and try again.',
				}))
			} else if (
				normalizedStatus === 'declined' ||
				normalizedStatus === 'failed' ||
				normalizedStatus === 'rejected'
			) {
				// Verification failed
				setKycStatus((prev) => ({
					...prev,
					sessionId: null,
					error: 'Verification failed. Please start a new verification process.',
				}))
			} else {
				// Not started or other status
				setKycStatus((prev) => ({
					...prev,
					error: `Verification status: ${
						result.status || 'Unknown'
					}. Please complete the verification in the pop-up window first.`,
				}))
			}
		} catch (error) {
			console.error('❌ Error checking KYC status:', error)
			setKycStatus((prev) => ({
				...prev,
				error: 'Could not check verification status. Please try again.',
			}))
		} finally {
			setKycLoading(false)
		}
	}

	// Xử lý thay đổi input chung
	const handleChange = (e) => {
		const { id, name, value } = e.target
		// Sử dụng name hoặc id tùy thuộc vào cấu trúc form
		const key = id || name
		setFormData((prev) => ({ ...prev, [key]: value }))
	}

	// Hàm chuyển bước
	const handleNext = () => {
		// Comment: BẮT ĐẦU: Logic kiểm tra validation trước khi chuyển bước

		// Ví dụ Validation đơn giản (Bạn cần mở rộng logic này)
		if (step === 1) {
			if (
				!formData.restaurantName ||
				!formData.address ||
				!formData.phone ||
				!formData.email
			) {
				alert('Please fill in all required business fields.')
				return
			}
		}

		if (step === 2) {
			if (!formData.accountNumber || !formData.cvv) {
				alert('Please fill in payment details.')
				return
			}

			if (!kycStatus.verified) {
				alert('Please complete identity verification before proceeding.')
				return
			}
		}

		// Comment: KẾT THÚC: Logic kiểm tra validation

		if (step < STEPS.length) {
			setStep(step + 1)
		}
	}

	const handleBack = () => {
		if (step > 1) {
			setStep(step - 1)
		}
	}

	// Hàm Hoàn tất và gửi dữ liệu (Chỉ gọi ở Step 3)
	const handleFinish = async () => {
		setLoading(true)
		console.log('Final Data Submitted:', formData)

		// Comment: BẮT ĐẦU: Logic gọi API hoàn tất Onboarding

		// Tạo FormData để gửi file và dữ liệu text
		const finalPayload = new FormData()
		// Step 1 Data
		finalPayload.append('restaurantName', formData.restaurantName)
		finalPayload.append('address', formData.address)
		finalPayload.append('phone', formData.phone)
		finalPayload.append('email', formData.email)
		// Step 2 Data
		finalPayload.append('cardholderName', formData.cardholderName)
		finalPayload.append('accountNumber', formData.accountNumber)
		finalPayload.append('expirationDate', formData.expirationDate)
		finalPayload.append('cvv', formData.cvv)
		if (formData.cccdFrontFile) {
			finalPayload.append('cccdFrontFile', formData.cccdFrontFile)
		}
		if (formData.cccdBackFile) {
			finalPayload.append('cccdBackFile', formData.cccdBackFile)
		}

		// try {
		//      const response = await axios.post('/api/onboarding/finalize', finalPayload, {
		//          headers: { 'Content-Type': 'multipart/form-data' }
		//      });
		//
		//      if (response.data.success) {
		//          alert('Onboarding Complete! Redirecting to Dashboard.');
		//      } else {
		//          alert('Submission failed: ' + response.data.message);
		//      }
		// } catch (error) {
		//      console.error('Final submission error:', error);
		//      alert('An error occurred during submission.');
		// } finally {
		//      setLoading(false);
		// }

		// Validate KYC completion
		if (!kycStatus.verified) {
			alert('Please complete identity verification before finishing.')
			setLoading(false)
			return
		}

		// ✅ Validate CCCD images URLs exist
		if (!kycStatus.cccdFrontUrl || !kycStatus.cccdBackUrl) {
			alert('❌ CCCD images are missing. Please complete KYC verification again.')
			console.error('Missing CCCD URLs:', {
				cccdFrontUrl: kycStatus.cccdFrontUrl,
				cccdBackUrl: kycStatus.cccdBackUrl,
			})
			setLoading(false)
			return
		}

		// Tạo object onboarding data with KYC URLs
		const onboardingData = {
			restaurantName: formData.restaurantName,
			address: formData.address,
			phone: formData.phone,
			email: formData.email,
			cardholderName: formData.cardholderName,
			accountNumber: formData.accountNumber,
			expirationDate: formData.expirationDate,
			cvv: formData.cvv,
			// ✅ KYC verification data (REQUIRED - 2 image URLs)
			cccdFrontUrl: kycStatus.cccdFrontUrl,
			cccdBackUrl: kycStatus.cccdBackUrl,
			kycSessionId: kycStatus.sessionId,
			citizenInfo: kycStatus.citizenInfo,
		}

		// ✅ Debug log to verify URLs exist before sending
		console.log('📦 Onboarding data prepared:', {
			...onboardingData,
			cccdFrontUrl: onboardingData.cccdFrontUrl ? '✅ Present' : '❌ Missing',
			cccdBackUrl: onboardingData.cccdBackUrl ? '✅ Present' : '❌ Missing',
		})

		// ✅ IMPORTANT: Save username to localStorage BEFORE calling completeOnboarding
		// This prevents race condition where pendingSignupData is cleared before we can access it
		localStorage.setItem('registrationUsername', pendingSignupData.username)

		// ✅ Set flag to prevent useEffect redirect during onboarding completion
		setIsCompletingOnboarding(true)

		try {
			// 🚀 Call completeOnboarding (uploads files, then registers user with backend)
			console.log('🚀 Starting onboarding completion...')
			const result = await completeOnboarding(onboardingData)

			if (result.success) {
				// ✅ Registration successful
				console.log('✅ Onboarding complete!')
				setLoading(false)

				// Show success message
				alert('🎉 Registration successful! Welcome to SpillProofPOS!')

				// Navigate to email confirmation page
				navigate('/email-confirmation')
			} else {
				// ❌ Registration failed
				console.error('❌ Registration failed:', result.message)
				alert('Registration failed: ' + (result.message || 'Unknown error'))
				setLoading(false)
			}
		} catch (error) {
			console.error('❌ Onboarding completion error:', error)
			alert(
				'An error occurred during registration: ' + (error.message || 'Unknown error'),
			)
			setLoading(false)
			// Reset flag on error so user can try again
			setIsCompletingOnboarding(false)
		}

		// Comment: KẾT THÚC: Logic gọi API hoàn tất Onboarding
	}

	const renderStep = () => {
		switch (step) {
			case 1:
				return <Step1 formData={formData} handleChange={handleChange} />
			case 2:
				return (
					<Step2
						formData={formData}
						handleChange={handleChange}
						kycStatus={kycStatus}
						checkKYCStatus={checkKYCStatus}
						onVerifyIdentity={handleVerifyIdentity}
						kycLoading={kycLoading}
					/>
				)
			case 3:
				return <Step3 formData={formData} kycStatus={kycStatus} />
			default:
				return null
		}
	}

	return (
		<div className="page-wrapper flex min-h-screen w-full flex-col items-center justify-center p-4 font-['Work_Sans',_sans-serif] relative">
			{/* Background image - Sử dụng component tập trung */}
			<BackgroundImage overlayOpacity={75} fixed={true} />

			<div className="content-container w-full max-w-4xl z-50">
				<div className="my-8 text-center">
					<h1
						className={`text-3xl font-bold tracking-tight ${TAILWIND_CLASSES.textDark} sm:text-4xl m-0`}
					>
						Welcome! Let's set up your infomation.
					</h1>
					<p className={`mt-2 text-base ${TAILWIND_CLASSES.textSecondaryDark}`}></p>
				</div>

				{/* Progress Bar & Status (Hiện ở tất cả các bước) */}
				<div className="mb-6 px-4 z-50">
					<div className="flex items-center justify-between mb-2 z-50">
						<p className={`text-base font-medium ${TAILWIND_CLASSES.textLabelDark}`}>
							Step {progress.id} of {STEPS.length}
						</p>
						<span className={`text-sm font-medium ${TAILWIND_CLASSES.textSecondaryDark}`}>
							{progress.percent}%
						</span>
					</div>
					<div
						className={`relative h-2 w-full rounded-full ${TAILWIND_CLASSES.progressBgDark}`}
					>
						<div
							className="h-2 rounded-full bg-[#137fec]"
							style={{ width: `${progress.percent}%` }}
						></div>
					</div>
					<p className={`text-sm mt-2 ${TAILWIND_CLASSES.textSecondaryDark}`}>
						{progress.id === 1 && 'Next: Payment & Identity'}
						{progress.id === 2 && 'Next: Review & Finish'}
						{progress.id === 3 && 'Final Step'}
					</p>
				</div>

				<div
					className={`main-card rounded-xl border ${TAILWIND_CLASSES.cardBgDark} border-white/10 shadow-lg w-full`}
				>
					<div className="p-8 sm:p-10">
						<div className="text-center mb-8">
							<h1
								className={`text-3xl font-bold tracking-tight ${TAILWIND_CLASSES.textDark} m-0`}
							>
								{progress.name}
							</h1>
							<p className={`mt-2 text-base ${TAILWIND_CLASSES.textSecondaryDark}`}>
								{progress.id === 1 &&
									'Please enter your restaurant details to complete your profile.'}
								{progress.id === 2 &&
									'Please enter your billing and identity information to activate your account.'}
								{progress.id === 3 &&
									'Please confirm the details below are correct before finishing.'}
							</p>
						</div>

						<form className="form-fields" onSubmit={(e) => e.preventDefault()}>
							{renderStep()}
						</form>
					</div>

					{/* Navigation Buttons */}
					<div
						className={`flex items-center justify-between pt-8 mt-4 border-t ${TAILWIND_CLASSES.inputBorderDark} p-8`}
					>
						{step === 1 ? (
							<button
								onClick={() => navigate('/signup')}
								disabled={loading}
								className={`flex h-12 items-center justify-center rounded-lg px-6 text-base font-semibold ${
									TAILWIND_CLASSES.textLabelDark
								} bg-slate-700/50 hover:bg-slate-700 transition-colors ${
									loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
								}`}
							>
								<span className="material-symbols-outlined mr-2">close</span>
								Cancel
							</button>
						) : (
							<button
								onClick={handleBack}
								disabled={loading}
								className={`flex h-12 items-center justify-center rounded-lg px-6 text-base font-semibold ${
									TAILWIND_CLASSES.textLabelDark
								} bg-slate-700/50 hover:bg-slate-700 transition-colors ${
									loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
								}`}
							>
								<span className="material-symbols-outlined mr-2">arrow_back</span>
								Back
							</button>
						)}

						{step < STEPS.length ? (
							<button
								onClick={handleNext}
								disabled={loading}
								className={`flex h-12 items-center justify-center rounded-lg px-6 text-base font-semibold ${
									TAILWIND_CLASSES.textDark
								} ${TAILWIND_CLASSES.primary} transition-colors ${
									loading ? 'opacity-70 cursor-wait' : 'cursor-pointer'
								}`}
							>
								Next
								<span className="material-symbols-outlined ml-2">arrow_forward</span>
							</button>
						) : (
							<button
								onClick={handleFinish}
								disabled={loading || !kycStatus.verified}
								className={`flex h-12 items-center justify-center rounded-lg px-6 text-base font-semibold ${
									TAILWIND_CLASSES.textDark
								} ${TAILWIND_CLASSES.primary} transition-colors ${
									loading || !kycStatus.verified
										? 'opacity-50 cursor-not-allowed'
										: 'cursor-pointer'
								}`}
								title={
									!kycStatus.verified ? 'Please complete identity verification first' : ''
								}
							>
								{loading ? 'Processing...' : 'Finish'}
								<span className="material-symbols-outlined ml-2">check_circle</span>
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default RestaurantOnboarding
