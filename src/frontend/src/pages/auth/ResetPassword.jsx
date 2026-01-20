import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import FloatingInputField from '../../components/form/FloatingInputField'
import PasswordStrengthIndicator from '../../components/form/PasswordStrengthIndicator'
import BackgroundImage from '../../components/common/BackgroundImage'
import { useLoading } from '../../contexts/LoadingContext'
import { useAlert } from '../../contexts/AlertContext'

const ResetPassword = () => {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { showLoading, hideLoading } = useLoading()
	const { showSuccess, showError } = useAlert()

	const [formData, setFormData] = useState({
		password: '',
		confirmPassword: '',
	})
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
	const [loading, setLoading] = useState(false)
	const [tokenValid, setTokenValid] = useState(true)
	const [tokenErrorMessage, setTokenErrorMessage] = useState('')

	const token = searchParams.get('token')

	useEffect(() => {
		if (!token) {
			setTokenValid(false)
			setTokenErrorMessage(
				'Invalid or missing reset token. Please request a new password reset link.',
			)
		}
	}, [token])

	const handleChange = (e) => {
		const { id, value } = e.target
		setFormData((prev) => ({ ...prev, [id]: value }))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		// Validation
		if (!formData.password.trim()) {
			showError('Validation Error', 'Password is required.')
			return
		}

		if (formData.password.length < 8) {
			showError('Validation Error', 'Password must be at least 8 characters long.')
			return
		}

		if (formData.password !== formData.confirmPassword) {
			showError('Validation Error', 'Passwords do not match.')
			return
		}

		setLoading(true)
		showLoading('Resetting password...')

		try {
			const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
			const response = await fetch(`${API_URL}/identity/auth/reset-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					resetToken: token,
					password: formData.password,
					confirmPassword: formData.confirmPassword,
				}),
			})

			const data = await response.json()

			if (response.ok && data.code === 200) {
				showSuccess(
					'Success',
					'Password reset successfully! Redirecting to login...',
					3000,
				)
				setTimeout(() => {
					navigate('/login')
				}, 3000)
			} else {
				if (data.message?.includes('expired')) {
					showError(
						'Token Expired',
						'Reset link has expired. Please request a new one.',
						5000,
					)
					setTokenValid(false)
					setTokenErrorMessage('Reset link has expired. Please request a new one.')
				} else {
					showError(
						'Reset Failed',
						data.message || 'Failed to reset password. Please try again.',
						5000,
					)
				}
			}
		} catch (error) {
			console.error('Reset password error:', error)
			showError('Error', 'An error occurred. Please try again later.', 5000)
		} finally {
			setLoading(false)
			hideLoading()
		}
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4 font-[Work_Sans] w-full">
			<BackgroundImage overlayOpacity={75} fixed={true} useDefault={true} />

			<div className="flex w-full max-w-md flex-col items-center">
				{/* Logo */}
				<div className="mb-8 flex items-center gap-3">
					<h1 className="text-white text-4xl font-bold z-50">SpillProofPOS</h1>
				</div>

				{/* Card */}
				<div className="w-full rounded-xl bg-black/60 backdrop-blur-md p-8 shadow-lg border border-white/10">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold text-white">Reset Password</h2>
						<p className="mt-2 text-sm text-[#9dabbb]">Enter your new password below.</p>
					</div>

					{!tokenValid ? (
						<div className="text-center">
							<div className="text-sm text-red-400 bg-red-600/10 p-4 rounded-lg mb-6">
								{tokenErrorMessage}
							</div>
							<Link
								to="/forgot-password"
								className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-[#137fec] text-base font-bold text-white transition-colors hover:bg-blue-600/90"
							>
								Request New Reset Link
							</Link>
						</div>
					) : (
						<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
							{/* New Password Input */}
							<div>
								<div className="relative">
									<FloatingInputField
										label="New Password"
										type={passwordVisible ? 'text' : 'password'}
										id="password"
										name="password"
										value={formData.password}
										onChange={handleChange}
										placeholder=""
										disabled={loading}
										autoComplete="new-password"
										icon={<span className="material-symbols-outlined">lock</span>}
										iconPosition="left"
									/>
									<button
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none z-20 bg-transparent border-none cursor-pointer"
										type="button"
										onClick={() => setPasswordVisible(!passwordVisible)}
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
							</div>

							{/* Confirm Password Input */}
							<div className="relative">
								<FloatingInputField
									label="Confirm Password"
									type={confirmPasswordVisible ? 'text' : 'password'}
									id="confirmPassword"
									name="confirmPassword"
									value={formData.confirmPassword}
									onChange={handleChange}
									placeholder=""
									disabled={loading}
									autoComplete="new-password"
									icon={<span className="material-symbols-outlined">lock</span>}
									iconPosition="left"
								/>
								<button
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none z-20 bg-transparent border-none cursor-pointer"
									type="button"
									onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
									disabled={loading}
								>
									<span className="material-symbols-outlined text-lg">
										{confirmPasswordVisible ? 'visibility_off' : 'visibility'}
									</span>
								</button>
							</div>

							{/* Submit Button */}
							<button
								className={`${
									loading ? 'opacity-70 cursor-wait' : ''
								} flex h-12 w-full items-center justify-center rounded-lg bg-[#137fec] text-base font-bold text-white transition-colors hover:bg-blue-600/90 border-none cursor-pointer`}
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
									'Reset Password'
								)}
							</button>
						</form>
					)}
				</div>

				{/* Back to Login Link */}
				<div className="mt-4 text-center z-50">
					<p className="text-sm text-white">
						<Link
							to="/login"
							className="text-[#137fec] font-medium hover:text-white transition-colors"
						>
							Back to Login
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default ResetPassword
