import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import FloatingInputField from '../../components/form/FloatingInputField'
import BackgroundImage from '../../components/common/BackgroundImage'
import { updateEmailWhenRegisterFailed } from '../../services/api/authAPI'

const EmailConfirmation = () => {
	const navigate = useNavigate()
	const [attemptCount, setAttemptCount] = useState(0)
	const [showEmailForm, setShowEmailForm] = useState(false)
	const [newEmail, setNewEmail] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	// Get username from localStorage (saved during signup)
	const [username, setUsername] = useState('')

	useEffect(() => {
		// Try to get username from registrationUsername (saved after successful registration)
		const savedUsername = localStorage.getItem('registrationUsername')

		if (savedUsername) {
			setUsername(savedUsername)
		} else {
			// Fallback: Try to get from pendingSignupData
			const pendingData = localStorage.getItem('pendingSignupData')
			if (pendingData) {
				try {
					const data = JSON.parse(pendingData)
					setUsername(data.username)
				} catch (e) {
					console.error('Failed to parse pendingSignupData:', e)
				}
			}
		}

		// If still no username found, redirect to signup
		if (!savedUsername && !localStorage.getItem('pendingSignupData')) {
			console.warn('No username found, redirecting to signup')
			navigate('/signup')
		}
	}, [navigate])

	const handleReceivedEmail = () => {
		// User confirmed they received the email
		// Clean up localStorage
		localStorage.removeItem('registrationUsername')
		localStorage.removeItem('pendingSignupData')
		navigate('/login')
	}

	const handleNotReceivedEmail = () => {
		setAttemptCount((prev) => prev + 1)

		if (attemptCount >= 2) {
			// Third attempt - redirect to signup
			alert('Please try registering again with a valid email address.')
			localStorage.removeItem('registrationUsername')
			localStorage.removeItem('pendingSignupData')
			navigate('/signup')
		} else {
			// Show email form
			setShowEmailForm(true)
			setError('')
		}
	}

	const handleUpdateEmail = async (e) => {
		e.preventDefault()
		setError('')

		// Validate email
		if (!newEmail || !newEmail.includes('@')) {
			setError('Please enter a valid email address.')
			return
		}

		if (!username) {
			setError('Username not found. Please register again.')
			return
		}

		try {
			setLoading(true)

			// Call API to update email
			const result = await updateEmailWhenRegisterFailed(username, newEmail)

			if (result.success) {
				// Email updated successfully
				alert('✅ Email updated successfully! Please check your new email inbox.')
				setShowEmailForm(false)
				setNewEmail('')
			} else {
				setError(result.message || 'Failed to update email. Please try again.')
			}
		} catch (err) {
			console.error('Error updating email:', err)
			setError(err.message || 'Failed to update email. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4 font-['Work_Sans',_sans-serif] relative">
			<BackgroundImage overlayOpacity={75} fixed={true} useDefault={true} />

			<div className="relative z-10 w-full max-w-md">
				<div className="bg-black/60 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/10">
					{/* Logo */}
					<div className="text-center mb-6">
						<h1 className="text-white text-3xl font-bold mb-2">SpillProofPOS</h1>
						<p className="text-sm text-gray-300">Registration Successful</p>
					</div>

					<AnimatePresence mode="wait">
						{!showEmailForm ? (
							<div key="confirmation" className="text-center">
								<div className="mb-6">
									<span className="material-symbols-outlined text-6xl text-green-500 mb-4 block">
										mark_email_read
									</span>
									<h2 className="text-2xl font-bold text-white mb-3">Check Your Email</h2>
									<p className="text-gray-300 text-sm leading-relaxed">
										We've sent a welcome email to your inbox. Please check your email to
										verify your account.
									</p>
								</div>

								<div className="space-y-3">
									<button
										onClick={handleReceivedEmail}
										className="w-full flex items-center justify-center h-12 rounded-lg bg-[#137fec] hover:bg-[#137fec]/90 text-white font-semibold transition-colors"
									>
										<span className="material-symbols-outlined mr-2">check_circle</span>I
										Received the Email
									</button>

									<button
										onClick={handleNotReceivedEmail}
										className="w-full flex items-center justify-center h-12 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/20"
									>
										<span className="material-symbols-outlined mr-2">
											mark_email_unread
										</span>
										I Didn't Receive the Email
									</button>
								</div>

								{attemptCount > 0 && (
									<div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-600/50 rounded-lg">
										<p className="text-sm text-yellow-400">
											<span className="material-symbols-outlined text-base mr-1 align-middle">
												warning
											</span>
											Attempt {attemptCount} of 3
										</p>
									</div>
								)}
							</div>
						) : (
							<div key="emailForm">
								<div className="mb-6">
									<span className="material-symbols-outlined text-5xl text-blue-500 mb-4 block text-center">
										edit_note
									</span>
									<h2 className="text-2xl font-bold text-white mb-3 text-center">
										Update Your Email
									</h2>
									<p className="text-gray-300 text-sm text-center">
										Please provide a new email address to receive the welcome email.
									</p>
								</div>

								<form onSubmit={handleUpdateEmail} className="space-y-4">
									<FloatingInputField
										label="New Email Address"
										type="email"
										id="newEmail"
										name="newEmail"
										value={newEmail}
										onChange={(e) => setNewEmail(e.target.value)}
										placeholder="your.email@example.com"
										disabled={loading}
										icon={<span className="material-symbols-outlined">mail</span>}
										iconPosition="left"
										required
									/>

									{error && (
										<div className="p-3 bg-red-600/10 border border-red-600/50 rounded-lg">
											<p className="text-sm text-red-400">{error}</p>
										</div>
									)}

									<div className="space-y-3">
										<button
											type="submit"
											disabled={loading}
											className={`w-full flex items-center justify-center h-12 rounded-lg bg-[#137fec] hover:bg-[#137fec]/90 text-white font-semibold transition-colors ${
												loading ? 'opacity-70 cursor-wait' : ''
											}`}
										>
											{loading ? (
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
													Updating...
												</>
											) : (
												<>
													<span className="material-symbols-outlined mr-2">send</span>
													Update Email & Resend
												</>
											)}
										</button>

										<button
											type="button"
											onClick={() => setShowEmailForm(false)}
											disabled={loading}
											className="w-full flex items-center justify-center h-12 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/20"
										>
											<span className="material-symbols-outlined mr-2">arrow_back</span>
											Back
										</button>
									</div>
								</form>

								<div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/50 rounded-lg">
									<p className="text-sm text-blue-400">
										<span className="material-symbols-outlined text-base mr-1 align-middle">
											info
										</span>
										Attempts remaining: {3 - attemptCount}
									</p>
								</div>
							</div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}

export default EmailConfirmation
