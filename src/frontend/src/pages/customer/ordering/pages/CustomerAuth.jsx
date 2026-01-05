import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom'
import FloatingInputField from '../../../../components/form/FloatingInputField'
import BackgroundImage from '../../../../components/common/BackgroundImage'
import { customerLoginAPI, customerSignupAPI } from '../../../../services/api/customerAPI'

const CustomerAuth = ({ onClose, onSuccess, tenantId: propTenantId }) => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const params = useParams()
	const location = useLocation()
	const [activeTab, setActiveTab] = useState('login') // 'login' or 'signup' or 'forgot'
	const [loading, setLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [successMessage, setSuccessMessage] = useState('')
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [ownerId, setOwnerId] = useState('')

	// Forgot password state
	const [forgotEmail, setForgotEmail] = useState('')

	// Get tenantId/ownerId from multiple sources
	// Priority: props > URL params > searchParams > localStorage
	useEffect(() => {
		const tenantId =
			propTenantId ||
			params.tenantId ||
			searchParams.get('tenantId') ||
			searchParams.get('ownerId') ||
			localStorage.getItem('currentTenantId') ||
			localStorage.getItem('currentOwnerId')

		if (tenantId) {
			setOwnerId(tenantId)
			localStorage.setItem('currentTenantId', tenantId)
			localStorage.setItem('currentOwnerId', tenantId) // Keep backward compatibility
			console.log('✅ CustomerAuth: tenantId/ownerId set to:', tenantId)
		} else {
			console.warn('⚠️ CustomerAuth: No tenantId found in props, params, or localStorage')
		}
	}, [searchParams, params, propTenantId, location])

	// Login form state
	const [loginData, setLoginData] = useState({
		username: '',
		password: '',
	})

	// Signup form state
	const [signupData, setSignupData] = useState({
		username: '',
		fullName: '',
		phoneNumber: '',
		email: '',
		password: '',
		confirmPassword: '',
	})

	// Handle login input change
	const handleLoginChange = (e) => {
		const { id, value } = e.target
		setLoginData((prev) => ({ ...prev, [id]: value }))
	}

	// Handle signup input change
	const handleSignupChange = (e) => {
		const { id, value } = e.target
		setSignupData((prev) => ({ ...prev, [id]: value }))
	}

	// Validate email format
	const validateEmail = (email) => {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
		return emailRegex.test(email)
	}

	// Validate phone number (Vietnamese format)
	const validatePhone = (phone) => {
		const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
		const phoneRegex = /^(0|\+84)[0-9]{9}$/
		return phoneRegex.test(cleanPhone)
	}

	// Validate username (4-20 characters, alphanumeric and underscore)
	const validateUsername = (username) => {
		const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/
		return usernameRegex.test(username)
	}

	// Handle login submission
	const handleLogin = async (e) => {
		e.preventDefault()
		setErrorMessage('')
		setLoading(true)

		// Validation
		if (!loginData.username.trim()) {
			setErrorMessage('Username or email is required.')
			setLoading(false)
			return
		}

		if (!loginData.password.trim()) {
			setErrorMessage('Password is required.')
			setLoading(false)
			return
		}

		if (loginData.password.length < 8) {
			setErrorMessage('Password must be at least 8 characters long.')
			setLoading(false)
			return
		}

		if (!ownerId) {
			setErrorMessage('Restaurant ID not found. Please scan QR code again.')
			setLoading(false)
			return
		}

		try {
			// Call customer login API
			const result = await customerLoginAPI(
				loginData.username,
				loginData.password,
				ownerId,
			)

			if (result.success) {
				setLoading(false)

				// Callback to parent component
				if (onSuccess) {
					onSuccess(result.customer)
				}

				// Close modal
				if (onClose) {
					onClose()
				}
			} else {
				setErrorMessage(result.message || 'Login failed. Please try again.')
				setLoading(false)
			}
		} catch (error) {
			console.error('Login error:', error)
			setErrorMessage('Login failed. Please try again.')
			setLoading(false)
		}
	}

	// Handle signup submission
	const handleSignup = async (e) => {
		e.preventDefault()
		setErrorMessage('')
		setLoading(true)

		// Validation
		if (!signupData.username.trim()) {
			setErrorMessage('Username is required.')
			setLoading(false)
			return
		}

		if (!validateUsername(signupData.username)) {
			setErrorMessage(
				'Username must be 4-20 characters (letters, numbers, underscore only).',
			)
			setLoading(false)
			return
		}

		if (!signupData.fullName.trim()) {
			setErrorMessage('Full name is required.')
			setLoading(false)
			return
		}

		if (!signupData.phoneNumber.trim()) {
			setErrorMessage('Phone number is required.')
			setLoading(false)
			return
		}

		if (!validatePhone(signupData.phoneNumber)) {
			setErrorMessage('Phone number must be 10 digits starting with 0 or +84.')
			setLoading(false)
			return
		}

		if (!signupData.email.trim()) {
			setErrorMessage('Email is required.')
			setLoading(false)
			return
		}

		if (!validateEmail(signupData.email)) {
			setErrorMessage('Please enter a valid email address.')
			setLoading(false)
			return
		}

		if (!signupData.password.trim()) {
			setErrorMessage('Password is required.')
			setLoading(false)
			return
		}

		if (signupData.password.length < 8) {
			setErrorMessage('Password must be at least 8 characters long.')
			setLoading(false)
			return
		}

		if (signupData.password !== signupData.confirmPassword) {
			setErrorMessage('Passwords do not match.')
			setLoading(false)
			return
		}

		if (!ownerId) {
			setErrorMessage('Restaurant ID not found. Please scan QR code again.')
			setLoading(false)
			return
		}

		try {
			// Call customer signup API
			const result = await customerSignupAPI(signupData, ownerId)

			if (result.success) {
				setLoading(false)

				// Callback to parent component
				if (onSuccess) {
					onSuccess(result.customer)
				}

				// Close modal
				if (onClose) {
					onClose()
				}
			} else {
				setErrorMessage(result.message || 'Registration failed. Please try again.')
				setLoading(false)
			}
		} catch (error) {
			console.error('Signup error:', error)
			setErrorMessage('Signup failed. Please try again.')
			setLoading(false)
		}
	}

	// Toggle password visibility
	const togglePasswordVisibility = () => {
		setPasswordVisible((prev) => !prev)
	}

	// Handle forgot password submission
	const handleForgotPassword = async (e) => {
		e.preventDefault()
		setErrorMessage('')
		setSuccessMessage('')
		setLoading(true)

		if (!forgotEmail.trim()) {
			setErrorMessage('Email is required.')
			setLoading(false)
			return
		}

		if (!validateEmail(forgotEmail)) {
			setErrorMessage('Please enter a valid email address.')
			setLoading(false)
			return
		}

		try {
			const API_URL = import.meta.env.VITE_API_GATEWAY_URL
				? `${import.meta.env.VITE_API_GATEWAY_URL}/api/v1`
				: '/api/v1'

			const response = await fetch(`${API_URL}/identity/auth/forgot-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email: forgotEmail }),
			})

			const data = await response.json()

			if (response.ok && data.code === 1000) {
				setSuccessMessage(
					'If an account with that email exists, we have sent a password reset link. Please check your inbox.',
				)
				setForgotEmail('')
			} else {
				// Still show success message to prevent email enumeration
				setSuccessMessage(
					'If an account with that email exists, we have sent a password reset link. Please check your inbox.',
				)
			}
		} catch (error) {
			console.error('Forgot password error:', error)
			setErrorMessage('An error occurred. Please try again later.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-[Work_Sans]"
		>
			{/* Background overlay */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="absolute inset-0 bg-black/70 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Auth card */}
			<motion.div
				initial={{ scale: 0.9, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.9, opacity: 0, y: 20 }}
				transition={{ type: 'spring', duration: 0.5 }}
				className="relative w-full max-w-md"
			>
				{/* Background image for card */}
				<BackgroundImage overlayOpacity={85} fixed={false} />

				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
				>
					<span className="material-symbols-outlined text-3xl">close</span>
				</button>

				{/* Card content */}
				<div className="relative rounded-xl bg-black/60 backdrop-blur-md p-8 shadow-2xl border border-white/10">
					{/* Logo */}
					<div className="text-center mb-6">
						<h1 className="text-white text-3xl font-bold mb-2">SpillProofPOS</h1>
						<p className="text-sm text-[#9dabbb]">Customer Portal</p>
					</div>

					{/* Tab switcher */}
					<div className="flex gap-2 mb-6 bg-white/5 rounded-lg p-1">
						<button
							onClick={() => {
								setActiveTab('login')
								setErrorMessage('')
							}}
							className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
								activeTab === 'login'
									? 'bg-[#137fec] text-white shadow-lg'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							Login
						</button>
						<button
							onClick={() => {
								setActiveTab('signup')
								setErrorMessage('')
							}}
							className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
								activeTab === 'signup'
									? 'bg-[#137fec] text-white shadow-lg'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							Sign Up
						</button>
					</div>

					{/* Error message */}
					<AnimatePresence mode="wait">
						{errorMessage && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className="mb-4 text-sm text-red-400 bg-red-600/10 p-3 rounded-lg text-center"
							>
								{errorMessage}
							</motion.div>
						)}
					</AnimatePresence>

					{/* Success message */}
					<AnimatePresence mode="wait">
						{successMessage && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								className="mb-4 text-sm text-green-400 bg-green-600/10 p-3 rounded-lg text-center"
							>
								{successMessage}
							</motion.div>
						)}
					</AnimatePresence>

					{/* Login Form */}
					<AnimatePresence mode="wait">
						{activeTab === 'login' && (
							<motion.form
								key="login"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ duration: 0.3 }}
								onSubmit={handleLogin}
								className="flex flex-col gap-4"
							>
								<FloatingInputField
									label="Username or Email"
									type="text"
									id="username"
									name="username"
									value={loginData.username}
									onChange={handleLoginChange}
									placeholder=""
									disabled={loading}
									autoComplete="off"
									icon={<span className="material-symbols-outlined">person</span>}
									iconPosition="left"
								/>

								<div className="relative">
									<FloatingInputField
										label="Password"
										type={passwordVisible ? 'text' : 'password'}
										id="password"
										name="password"
										value={loginData.password}
										onChange={handleLoginChange}
										placeholder=""
										disabled={loading}
										autoComplete="new-password"
										icon={<span className="material-symbols-outlined">lock</span>}
										iconPosition="left"
									/>
									<button
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none z-20 bg-transparent border-none cursor-pointer"
										type="button"
										onClick={togglePasswordVisibility}
										disabled={loading}
									>
										<span className="material-symbols-outlined text-lg">
											{passwordVisible ? 'visibility_off' : 'visibility'}
										</span>
									</button>
								</div>

								{/* Forgot Password Link */}
								<div className="text-right -mt-2">
									<button
										type="button"
										onClick={() => {
											setActiveTab('forgot')
											setErrorMessage('')
											setSuccessMessage('')
										}}
										className="text-sm text-[#137fec] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
										disabled={loading}
									>
										Forgot password?
									</button>
								</div>

								<button
									className={`${
										loading ? 'opacity-70 cursor-wait' : ''
									} flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white transition-colors hover:bg-blue-600/90 border-none cursor-pointer mt-2`}
									type="submit"
									disabled={loading}
								>
									{loading ? (
										<svg
											className="animate-spin h-5 w-5 text-white"
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
									) : (
										'Login'
									)}
								</button>

								<div className="relative my-4">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-white/10"></div>
									</div>
									<div className="relative flex justify-center text-sm">
										<span className="px-2 bg-black/60 text-gray-400">Or continue with</span>
									</div>
								</div>

								<button
									type="button"
									onClick={() => {
									const clientId = import.meta.env.VITE_CLIENT_ID;
									const redirectUri = import.meta.env.VITE_REDIRECT_URI;
									const scope = 'email profile';
									const tableNum = localStorage.getItem('currentTableNumber') || '';
									// State format: ownerId|tableNumber (pipe-separated)
									const state = ownerId ? `${ownerId}|${tableNum}` : '';
									
									// Validate env vars
									if (!clientId || !redirectUri) {
										alert('Google OAuth is not configured. Please contact support.');
										return;
									}
									
										const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
										window.location.href = googleAuthUrl;
									}}
									className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-white text-base font-semibold text-gray-700 transition-all hover:bg-gray-100 border-none cursor-pointer"
									disabled={loading}
								>
									<svg className="w-5 h-5" viewBox="0 0 24 24">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
									</svg>
									Continue with Google
								</button>
							</motion.form>
						)}

						{/* Signup Form */}
						{activeTab === 'signup' && (
							<motion.form
								key="signup"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
								onSubmit={handleSignup}
								className="flex flex-col gap-4"
							>
								<FloatingInputField
									label="Username"
									type="text"
									id="username"
									name="username"
									value={signupData.username}
									onChange={handleSignupChange}
									placeholder="4-20 characters"
									disabled={loading}
									icon={<span className="material-symbols-outlined">badge</span>}
									iconPosition="left"
								/>

								<FloatingInputField
									label="Full Name"
									type="text"
									id="fullName"
									name="fullName"
									value={signupData.fullName}
									onChange={handleSignupChange}
									placeholder=""
									disabled={loading}
									icon={<span className="material-symbols-outlined">person</span>}
									iconPosition="left"
								/>

								<FloatingInputField
									label="Phone Number"
									type="tel"
									id="phoneNumber"
									name="phoneNumber"
									value={signupData.phoneNumber}
									onChange={handleSignupChange}
									placeholder="0123456789"
									disabled={loading}
									icon={<span className="material-symbols-outlined">phone</span>}
									iconPosition="left"
								/>

								<FloatingInputField
									label="Email Address"
									type="email"
									id="email"
									name="email"
									value={signupData.email}
									onChange={handleSignupChange}
									placeholder=""
									disabled={loading}
									icon={<span className="material-symbols-outlined">mail</span>}
									iconPosition="left"
								/>

								<div className="relative">
									<FloatingInputField
										label="Password"
										type={passwordVisible ? 'text' : 'password'}
										id="password"
										name="password"
										value={signupData.password}
										onChange={handleSignupChange}
										placeholder=""
										disabled={loading}
										icon={<span className="material-symbols-outlined">lock</span>}
										iconPosition="left"
									/>
									<button
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none z-20 bg-transparent border-none cursor-pointer"
										type="button"
										onClick={togglePasswordVisibility}
										disabled={loading}
									>
										<span className="material-symbols-outlined text-lg">
											{passwordVisible ? 'visibility_off' : 'visibility'}
										</span>
									</button>
								</div>

								<div className="relative">
									<FloatingInputField
										label="Confirm Password"
										type={passwordVisible ? 'text' : 'password'}
										id="confirmPassword"
										name="confirmPassword"
										value={signupData.confirmPassword}
										onChange={handleSignupChange}
										placeholder=""
										disabled={loading}
										icon={<span className="material-symbols-outlined">lock</span>}
										iconPosition="left"
									/>
									<button
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none z-20 bg-transparent border-none cursor-pointer"
										type="button"
										onClick={togglePasswordVisibility}
										disabled={loading}
									>
										<span className="material-symbols-outlined text-lg">
											{passwordVisible ? 'visibility_off' : 'visibility'}
										</span>
									</button>
								</div>

								<button
									className={`${
										loading ? 'opacity-70 cursor-wait' : ''
									} flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white transition-colors hover:bg-blue-600/90 border-none cursor-pointer mt-2`}
									type="submit"
									disabled={loading}
								>
									{loading ? (
										<svg
											className="animate-spin h-5 w-5 text-white"
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
									) : (
										'Sign Up'
									)}
								</button>
							</motion.form>
						)}

						{/* Forgot Password Form */}
						{activeTab === 'forgot' && (
							<motion.form
								key="forgot"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
								onSubmit={handleForgotPassword}
								className="flex flex-col gap-4"
							>
								<p className="text-gray-300 text-sm mb-2 text-center">
									Enter your email address and we'll send you instructions to reset your
									password.
								</p>

								<FloatingInputField
									label="Email Address"
									type="email"
									id="forgotEmail"
									name="forgotEmail"
									value={forgotEmail}
									onChange={(e) => setForgotEmail(e.target.value)}
									placeholder=""
									disabled={loading}
									icon={<span className="material-symbols-outlined">mail</span>}
									iconPosition="left"
								/>

								<button
									className={`${
										loading ? 'opacity-70 cursor-wait' : ''
									} flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white transition-colors hover:bg-blue-600/90 border-none cursor-pointer mt-2`}
									type="submit"
									disabled={loading}
								>
									{loading ? (
										<svg
											className="animate-spin h-5 w-5 text-white"
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
									) : (
										'Send Reset Instructions'
									)}
								</button>

								{/* Back to Login Link */}
								<div className="text-center mt-2">
									<button
										type="button"
										onClick={() => {
											setActiveTab('login')
											setErrorMessage('')
											setSuccessMessage('')
											setForgotEmail('')
										}}
										className="text-sm text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
										disabled={loading}
									>
										Back to Login
									</button>
								</div>
							</motion.form>
						)}
					</AnimatePresence>
				</div>
			</motion.div>
		</motion.div>
	)
}

export default CustomerAuth
