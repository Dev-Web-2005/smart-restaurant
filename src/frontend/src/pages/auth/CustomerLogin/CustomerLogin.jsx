import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import apiClient from '../../../services/apiClient'

const CustomerLogin = () => {
	const [usernameOrEmail, setUsernameOrEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const navigate = useNavigate()
	const { ownerId } = useParams()
	const [searchParams] = useSearchParams()

	// Get ownerId from URL params or localStorage
	const currentOwnerId =
		ownerId || searchParams.get('ownerId') || localStorage.getItem('currentOwnerId')

	useEffect(() => {
		// Store ownerId if available
		if (currentOwnerId) {
			localStorage.setItem('currentOwnerId', currentOwnerId)
			localStorage.setItem('currentTenantId', currentOwnerId)
		}
	}, [currentOwnerId])

	const handleLogin = async (e) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const response = await apiClient.post('/identity/auth/login', {
				usernameOrEmail,
				password,
				ownerId: currentOwnerId,
			})

			if (response.data.code === 200) {
				const { accessToken, refreshToken } = response.data.data

				window.accessToken = accessToken

				if (currentOwnerId) {
					navigate(`/tenant/${currentOwnerId}/table/0`)
				} else {
					navigate('/')
				}
			} else {
				setError(response.data.message || 'Login failed')
			}
		} catch (err) {
			setError(err.response?.data?.message || 'Invalid username/email or password')
		} finally {
			setLoading(false)
		}
	}

	const handleGoogleLogin = () => {
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
		const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI
		const state = currentOwnerId || ''

		const googleAuthUrl =
			`https://accounts.google.com/o/oauth2/v2/auth?` +
			`client_id=${clientId}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&response_type=code` +
			`&scope=email profile` +
			`&state=${state}`

		window.location.href = googleAuthUrl
	}

	const handleSignUp = () => {
		// Navigate to signup page with ownerId context
		if (currentOwnerId) {
			navigate(`/customer-signup/${currentOwnerId}`)
		} else {
			navigate('/customer-signup')
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-6">
			<div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
				<div className="text-center mb-6">
					<h2 className="text-3xl font-bold text-gray-800 mb-2">🍽️ Welcome Back</h2>
					<p className="text-gray-600 text-sm">Login to your account</p>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
						<span>⚠️</span>
						<span className="text-sm">{error}</span>
					</div>
				)}

				<form onSubmit={handleLogin} className="space-y-4">
					<div>
						<label
							htmlFor="usernameOrEmail"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Username or Email
						</label>
						<input
							type="text"
							id="usernameOrEmail"
							value={usernameOrEmail}
							onChange={(e) => setUsernameOrEmail(e.target.value)}
							placeholder="Enter your username or email"
							required
							disabled={loading}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Password
						</label>
						<div className="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter your password"
								required
								disabled={loading}
								className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								disabled={loading}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
							>
								{showPassword ? '👁️' : '👁️‍🗨️'}
							</button>
						</div>
					</div>

					<div className="mt-6">
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? 'Logging in...' : 'Login'}
						</button>
					</div>
				</form>

				<div className="flex items-center my-6">
					<div className="flex-1 border-t border-gray-300"></div>
					<span className="px-4 text-gray-500 text-sm">OR</span>
					<div className="flex-1 border-t border-gray-300"></div>
				</div>

				<button
					type="button"
					onClick={handleGoogleLogin}
					disabled={loading}
					className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
							fill="#4285F4"
						/>
						<path
							d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z"
							fill="#34A853"
						/>
						<path
							d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
							fill="#FBBC05"
						/>
						<path
							d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.003 0 5.482 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
							fill="#EA4335"
						/>
					</svg>
					Continue with Google
				</button>

				<div className="text-center mt-6 text-sm text-gray-600">
					<span>Don't have an account? </span>
					<button
						type="button"
						onClick={handleSignUp}
						disabled={loading}
						className="text-purple-600 font-semibold hover:text-purple-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Sign Up
					</button>
				</div>
			</div>
		</div>
	)
}

export default CustomerLogin
