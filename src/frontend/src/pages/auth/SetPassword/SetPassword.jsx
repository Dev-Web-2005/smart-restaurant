import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import apiClient from '../../../services/apiClient'
import { useAlert } from '../../../contexts/AlertContext'

const SetPassword = () => {
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const navigate = useNavigate()
	const location = useLocation()
	const { showSuccess, showError } = useAlert()

	const isFirstTimeGoogleLogin = location.state?.firstTimeGoogleLogin || false
	const ownerId = location.state?.ownerId
	const tableNumber =
		location.state?.tableNumber || localStorage.getItem('currentTableNumber') || '0'

	const handleSubmit = async (e) => {
		e.preventDefault()

		if (password.length < 8) {
			showError('Validation Error', 'Password must be at least 8 characters long')
			return
		}

		if (password !== confirmPassword) {
			showError('Validation Error', 'Passwords do not match')
			return
		}

		setLoading(true)
		try {
			const response = await apiClient.post('/identity/auth/set-password', {
				password,
			})

			if (response.data.code === 200) {
				showSuccess('Success', 'Password set successfully! Redirecting...', 2000)
				setTimeout(() => {
					if (ownerId) {
						// Customer - redirect to restaurant interface
						if (tableNumber) {
							navigate(`/tenant/${ownerId}/table/${tableNumber}`)
						} else {
							navigate(`/select-table/${ownerId}`)
						}
					} else {
						// User - redirect to login page
						navigate('/login')
					}
				}, 2000)
			} else {
				showError('Failed', response.data.message || 'Failed to set password')
			}
		} catch (error) {
			showError(
				'Error',
				error.response?.data?.message || 'Failed to set password. Please try again.',
			)
		} finally {
			setLoading(false)
		}
	}

	const handleSkip = () => {
		if (ownerId) {
			if (tableNumber) {
				navigate(`/tenant/${ownerId}/table/${tableNumber}`)
			} else {
				navigate(`/select-table/${ownerId}`)
			}
		} else {
			navigate('/')
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
				<h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
					Set Your Password
				</h2>
				{isFirstTimeGoogleLogin && (
					<p className="text-gray-600 text-sm mb-6 text-center">
						You logged in with Google. Set a password to enable traditional login in the
						future.
					</p>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							New Password
						</label>
						<div className="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="At least 8 characters"
								required
								minLength={8}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								{showPassword ? '👁️' : '👁️‍🗨️'}
							</button>
						</div>
					</div>

					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Confirm Password
						</label>
						<div className="relative">
							<input
								type={showConfirmPassword ? 'text' : 'password'}
								id="confirmPassword"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Re-enter password"
								required
								minLength={8}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								{showConfirmPassword ? '👁️' : '👁️‍🗨️'}
							</button>
						</div>
					</div>

					<div className="flex flex-col gap-3 mt-6">
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Setting Password...' : 'Set Password'}
						</button>
						{isFirstTimeGoogleLogin && (
							<button
								type="button"
								onClick={handleSkip}
								disabled={loading}
								className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Skip for Now
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	)
}

export default SetPassword
