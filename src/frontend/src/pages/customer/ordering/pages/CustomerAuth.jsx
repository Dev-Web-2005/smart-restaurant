import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import FloatingInputField from '../../../../components/form/FloatingInputField'
import BackgroundImage from '../../../../components/common/BackgroundImage'

const CustomerAuth = ({ onClose, onSuccess }) => {
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState('login') // 'login' or 'signup'
	const [loading, setLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [passwordVisible, setPasswordVisible] = useState(false)

	// Login form state
	const [loginData, setLoginData] = useState({
		email: '',
		password: '',
	})

	// Signup form state
	const [signupData, setSignupData] = useState({
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

	// Handle login submission
	const handleLogin = async (e) => {
		e.preventDefault()
		setErrorMessage('')
		setLoading(true)

		// Validation
		if (!loginData.email.trim()) {
			setErrorMessage('Email is required.')
			setLoading(false)
			return
		}

		if (!validateEmail(loginData.email)) {
			setErrorMessage('Please enter a valid email address.')
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

		try {
			// TODO: Call customer login API
			console.log('Customer Login:', loginData)

			// Mock successful login
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Store customer auth token (localStorage for persistence)
			localStorage.setItem(
				'customerAuth',
				JSON.stringify({
					email: loginData.email,
					name: loginData.email.split('@')[0],
					loggedInAt: new Date().toISOString(),
				}),
			)

			setLoading(false)

			// Callback to parent component
			if (onSuccess) {
				onSuccess()
			}

			// Close modal
			if (onClose) {
				onClose()
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

		// Password complexity check
		const passwordRegex =
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
		if (!passwordRegex.test(signupData.password)) {
			setErrorMessage(
				'Password must include uppercase, lowercase, number, and special character.',
			)
			setLoading(false)
			return
		}

		try {
			// TODO: Call customer signup API
			console.log('Customer Signup:', signupData)

			// Mock successful signup
			await new Promise((resolve) => setTimeout(resolve, 1500))

			// Auto login after signup
			localStorage.setItem(
				'customerAuth',
				JSON.stringify({
					email: signupData.email,
					name: signupData.fullName,
					phone: signupData.phoneNumber,
					loggedInAt: new Date().toISOString(),
				}),
			)

			setLoading(false)

			// Callback to parent component
			if (onSuccess) {
				onSuccess()
			}

			// Close modal
			if (onClose) {
				onClose()
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
									label="Email Address"
									type="email"
									id="email"
									name="email"
									value={loginData.email}
									onChange={handleLoginChange}
									placeholder=""
									disabled={loading}
									autoComplete="off"
									icon={<span className="material-symbols-outlined">mail</span>}
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
					</AnimatePresence>
				</div>
			</motion.div>
		</motion.div>
	)
}

export default CustomerAuth
