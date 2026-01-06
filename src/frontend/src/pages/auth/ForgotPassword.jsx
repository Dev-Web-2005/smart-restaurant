import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import FloatingInputField from '../../components/form/FloatingInputField'
import BackgroundImage from '../../components/common/BackgroundImage'
import { useLoading } from '../../contexts/LoadingContext'
import { checkEmailVerificationStatusAPI } from '../../services/api/authAPI'

const ForgotPassword = () => {
	const { showLoading, hideLoading } = useLoading()
	const [email, setEmail] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const [successMessage, setSuccessMessage] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e) => {
		e.preventDefault()
		setErrorMessage('')
		setSuccessMessage('')

		if (!email.trim()) {
			setErrorMessage('Email is required.')
			return
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			setErrorMessage('Please enter a valid email address.')
			return
		}

		setLoading(true)
		showLoading('Checking email verification status...')

		try {
			// ✅ Step 1: Check if email is verified
			console.log('🔍 Checking email verification status for:', email)
			const verificationResult = await checkEmailVerificationStatusAPI(email)

			if (!verificationResult.success) {
				setErrorMessage('Failed to verify email status. Please try again.')
				setLoading(false)
				hideLoading()
				return
			}

			// ❌ If email is not verified, show error and stop
			if (!verificationResult.isVerified) {
				setErrorMessage(
					'⚠️ Your email is not verified. Please verify your email address before requesting a password reset. You can verify your email from your account settings.',
				)
				setLoading(false)
				hideLoading()
				return
			}

			// ✅ Step 2: Email is verified, proceed with forgot password request
			console.log('✅ Email is verified, sending reset link...')
			// Update loading message (don't call hideLoading/showLoading again)
			// Just rely on the existing loading state

			const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
			const response = await fetch(`${API_URL}/identity/auth/forgot-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			})

			const data = await response.json()

			if (response.ok && data.code === 1000) {
				setSuccessMessage(
					'✅ Password reset link has been sent to your verified email address. Please check your inbox.',
				)
				setEmail('')
			} else {
				// Still show success message to prevent email enumeration
				setSuccessMessage(
					'✅ If an account with that email exists, we have sent a password reset link. Please check your inbox.',
				)
			}
		} catch (error) {
			console.error('Forgot password error:', error)
			setErrorMessage('❌ An error occurred. Please try again later.')
		} finally {
			setLoading(false)
			hideLoading()
		}
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4 font-[Work_Sans] w-full">
			<BackgroundImage overlayOpacity={75} fixed={true} />

			<div className="flex w-full max-w-md flex-col items-center">
				{/* Logo */}
				<div className="mb-8 flex items-center gap-3">
					<h1 className="text-white text-4xl font-bold z-50">SpillProofPOS</h1>
				</div>

				{/* Card */}
				<div className="w-full rounded-xl bg-black/60 backdrop-blur-md p-8 shadow-lg border border-white/10">
					<div className="text-center mb-6">
						<div className="flex justify-center mb-4">
							<span className="material-symbols-outlined text-5xl text-[#137fec]">
								lock_reset
							</span>
						</div>
						<h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
						<p className="mt-2 text-sm text-[#9dabbb]">
							Enter your email address and we'll send you a link to reset your password.
						</p>
					</div>

					<form className="flex flex-col gap-5" onSubmit={handleSubmit}>
						{/* Error Message */}
						{errorMessage && (
							<div className="text-sm text-red-400 bg-red-600/10 p-3 rounded-lg text-center">
								{errorMessage}
							</div>
						)}

						{/* Success Message */}
						{successMessage && (
							<div className="text-sm text-green-400 bg-green-600/10 p-3 rounded-lg text-center">
								{successMessage}
							</div>
						)}

						{/* Email Input */}
						<FloatingInputField
							label="Email Address"
							type="email"
							id="email"
							name="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder=""
							disabled={loading}
							autoComplete="email"
							icon={<span className="material-symbols-outlined">email</span>}
							iconPosition="left"
						/>

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
								'Send Reset Link'
							)}
						</button>
					</form>
				</div>

				{/* Back to Login Link */}
				<div className="mt-4 text-center z-50">
					<p className="text-sm text-white">
						Remember your password?
						<Link
							to="/login"
							className="text-[#137fec] font-medium hover:text-white transition-colors ml-1"
						>
							Back to Login
						</Link>
					</p>
				</div>
			</div>
		</div>
	)
}

export default ForgotPassword
