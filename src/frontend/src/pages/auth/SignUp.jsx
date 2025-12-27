import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../contexts/UserContext'
import { useLoading } from '../../contexts/LoadingContext'
import FloatingInputField from '../../components/form/FloatingInputField'
import PasswordStrengthIndicator from '../../components/form/PasswordStrengthIndicator'
import { ButtonLoader } from '../../components/common/LoadingSpinner'
import BackgroundImage from '../../components/common/BackgroundImage'
// import axios from 'axios'; // Import Axios khi bạn sẵn sàng tích hợp API

const SignUp = () => {
	const navigate = useNavigate()
	const { startSignup } = useUser()
	const { showLoading, hideLoading } = useLoading()
	// 1. State để quản lý input form
	const [formData, setFormData] = useState({
		username: '',
		fullName: '',
		birthYear: '',
		phoneNumber: '',
		email: '',
		address: '',
		password: '',
		confirmPassword: '',
	})
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [loading, setLoading] = useState(false)

	// 2. Hàm xử lý thay đổi input
	const handleChange = (e) => {
		const { id, value } = e.target
		setFormData((prev) => ({ ...prev, [id]: value }))
	}

	// 3. Hàm xử lý đăng ký (POST)
	const handleSignUp = async (e) => {
		e.preventDefault()
		setErrorMessage('')

		// ✅ VALIDATION MATCHING BACKEND REQUIREMENTS
		// Required: username (4-20 chars, alphanumeric + underscore)
		if (!formData.username.trim()) {
			setErrorMessage('Username is required.')
			return
		}
		if (formData.username.length < 4 || formData.username.length > 20) {
			setErrorMessage('Username must be between 4 and 20 characters.')
			return
		}
		// Username format: only letters, numbers, and underscore
		const usernameRegex = /^[a-zA-Z0-9_]+$/
		if (!usernameRegex.test(formData.username)) {
			setErrorMessage('Username can only contain letters, numbers, and underscore.')
			return
		}

		// Required: email (valid format)
		if (!formData.email.trim()) {
			setErrorMessage('Email is required.')
			return
		}
		// Improved email validation
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
		if (!emailRegex.test(formData.email)) {
			setErrorMessage('Please enter a valid email address (e.g., user@example.com).')
			return
		}

		// Optional: phone number validation (if provided, must be 10 digits)
		if (formData.phoneNumber.trim()) {
			// Remove spaces and special characters
			const cleanPhone = formData.phoneNumber.replace(/[\s\-\(\)]/g, '')
			// Check if it's 10 digits (Vietnamese format)
			const phoneRegex = /^(0|\+84)[0-9]{9}$/
			if (!phoneRegex.test(cleanPhone)) {
				setErrorMessage(
					'Phone number must be 10 digits starting with 0 or +84 followed by 9 digits.',
				)
				return
			}
		}

		// Optional: birth year validation (if provided, must be valid)
		if (formData.birthYear) {
			const year = parseInt(formData.birthYear)
			const currentYear = new Date().getFullYear()
			if (isNaN(year) || year < 1900 || year > currentYear) {
				setErrorMessage(`Birth year must be between 1900 and ${currentYear}.`)
				return
			}
		}

		// Required: password (min 8 chars)
		if (!formData.password.trim()) {
			setErrorMessage('Password is required.')
			return
		}
		if (formData.password.length < 8) {
			setErrorMessage('Password must be at least 8 characters long.')
			return
		}

		// Required: confirmPassword (must match)
		if (formData.password !== formData.confirmPassword) {
			setErrorMessage('Passwords do not match.')
			return
		}

		// Optional: password complexity check (recommended but not required by backend)
		const passwordRegex =
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
		if (!passwordRegex.test(formData.password)) {
			setErrorMessage(
				'Password must include uppercase letters, lowercase letters, numbers, and special characters.',
			)
			return
		}

		setLoading(true)

		// ✅ Prepare signup data (only required fields + optional profile data)
		const signupData = {
			// REQUIRED FIELDS
			username: formData.username.trim(),
			email: formData.email.trim().toLowerCase(), // Normalize email
			password: formData.password,
			confirmPassword: formData.confirmPassword, // ✅ Backend requires this field
			// OPTIONAL PROFILE FIELDS
			fullName: formData.fullName?.trim() || '',
			yearOfBirth: formData.birthYear ? parseInt(formData.birthYear) : null,
			phoneNumber: formData.phoneNumber
				? formData.phoneNumber.replace(/[\s\-\(\)]/g, '')
				: '', // Clean phone format
			address: formData.address?.trim() || '',
		}

		console.log('Saving signup data temporarily:', signupData)

		// Lưu dữ liệu signup tạm thời và chuyển sang onboarding
		try {
			showLoading('Đang xử lý đăng ký...')
			startSignup(signupData)
			setLoading(false)
			// Chuyển hướng sang trang onboarding
			navigate('/onboarding')
		} catch (error) {
			console.error('Error during signup:', error)
			setErrorMessage('Failed to proceed to onboarding.')
			setLoading(false)
		} finally {
			hideLoading()
		}
	}

	// Hàm Toggle Password Visibility
	const togglePasswordVisibility = () => {
		setPasswordVisible((prev) => !prev)
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4 font-[Work_Sans] w-full relative">
			{/* Background image - Sử dụng component tập trung */}
			<BackgroundImage overlayOpacity={75} fixed={true} />

			<div className="flex w-full max-w-md flex-col items-center">
				{/* Logo Group */}
				<div className="mb-8 flex items-center gap-3 z-50">
					{/* <span className="material-symbols-outlined text-[#137fec] text-5xl">
            restaurant_menu
          </span> */}
					<h1 className="text-white text-4xl font-bold">SpillProofPOS</h1>
				</div>

				{/* Sign Up Card */}
				<div className="w-full rounded-xl bg-black/60 backdrop-blur-md p-8 shadow-lg border border-white/10">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold text-white">Create Account</h2>
						<p className="mt-1 text-sm text-[#9dabbb]">Join the platform control panel</p>
					</div>

					<form className="flex flex-col gap-5" onSubmit={handleSignUp}>
						{/* Error Message */}
						{errorMessage && (
							<div className="text-sm text-red-400 bg-red-600/10 p-2 rounded-lg text-center">
								{errorMessage}
							</div>
						)}
						{/* Username Field (Mới thêm) */}
						<FloatingInputField
							label="Username (4-20 characters)"
							type="text"
							id="username"
							name="username"
							value={formData.username}
							onChange={handleChange}
							placeholder=""
							disabled={loading}
							required
						/>
						{/* Name and Birth Year Grid */}
						<div className="grid grid-cols-2 gap-4">
							<FloatingInputField
								label="Full Name"
								type="text"
								id="fullName"
								name="fullName"
								value={formData.fullName}
								onChange={handleChange}
								disabled={loading}
							/>
							<FloatingInputField
								label="Year of Birth (1900-2025)"
								type="number"
								id="birthYear"
								name="birthYear"
								value={formData.birthYear}
								onChange={handleChange}
								placeholder="1990"
								disabled={loading}
								min="1900"
								max="2025"
							/>
						</div>
						{/* Phone Number */}
						<FloatingInputField
							label="Phone Number (10 digits)"
							type="tel"
							id="phoneNumber"
							name="phoneNumber"
							value={formData.phoneNumber}
							onChange={handleChange}
							placeholder="0123456789 or +84123456789"
							disabled={loading}
							icon={<span className="material-symbols-outlined">phone</span>}
							iconPosition="left"
						/>
						{/* Email Address */}
						<FloatingInputField
							label="Email Address"
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							placeholder="you@example.com"
							disabled={loading}
							required
							icon={<span className="material-symbols-outlined">mail</span>}
							iconPosition="left"
						/>
						{/* Address */}
						<FloatingInputField
							label="Address"
							type="text"
							id="address"
							name="address"
							value={formData.address}
							onChange={handleChange}
							disabled={loading}
							icon={<span className="material-symbols-outlined">location_on</span>}
							iconPosition="left"
						/>
						{/* Password */}
						<div>
							<div className="relative">
								<FloatingInputField
									label="Password"
									type={passwordVisible ? 'text' : 'password'}
									id="password"
									name="password"
									value={formData.password}
									onChange={handleChange}
									placeholder="Enter your password"
									disabled={loading}
									required
									icon={<span className="material-symbols-outlined">lock</span>}
									iconPosition="left"
								/>
								<button
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none z-20 bg-transparent border-none cursor-pointer"
									type="button"
									title="Toggle Password Visibility"
									onClick={togglePasswordVisibility}
									disabled={loading}
								>
									<span className="material-symbols-outlined text-lg">
										{passwordVisible ? 'visibility_off' : 'visibility'}
									</span>
								</button>
							</div>
							<PasswordStrengthIndicator
								password={formData.password}
								showRequirements={true}
							/>
						</div>{' '}
						{/* Confirm Password */}
						<div className="relative">
							<FloatingInputField
								label="Confirm Password"
								type={passwordVisible ? 'text' : 'password'}
								id="confirmPassword"
								name="confirmPassword"
								value={formData.confirmPassword}
								onChange={handleChange}
								placeholder="Confirm your password"
								disabled={loading}
								required
								icon={<span className="material-symbols-outlined">lock</span>}
								iconPosition="left"
							/>
							<button
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none z-20 bg-transparent border-none cursor-pointer"
								type="button"
								title="Toggle Password Visibility"
								onClick={togglePasswordVisibility}
								disabled={loading}
							>
								<span className="material-symbols-outlined text-lg">
									{passwordVisible ? 'visibility_off' : 'visibility'}
								</span>
							</button>
						</div>
						{/* Sign Up Button */}
						<button
							className={`signup-button ${
								loading ? 'opacity-70 cursor-wait' : ''
							} flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white transition-colors hover:bg-blue-600/90 border-none cursor-pointer  `}
							type="submit"
							disabled={loading}
						>
							{loading ? (
								<svg
									className="animate-spin h-5 w-5 text-white  "
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25 "
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75 "
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							) : (
								'Sign Up'
							)}
						</button>
						{/* Footer Link */}
						<p className="login-link-text text-sm text-white">
							Already have an account?
							<a
								href="/login"
								className="text-[#137fec] font-medium hover:text-white transition-colors"
							>
								{' '}
								Login
							</a>
						</p>
					</form>
				</div>
			</div>
		</div>
	)
}

export default SignUp
